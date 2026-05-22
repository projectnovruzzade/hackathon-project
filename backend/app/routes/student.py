import uuid
import json
from pathlib import Path

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity
from werkzeug.utils import secure_filename

from app.auth import role_required
from app.extensions import db
from app.models import (
    Announcement,
    AnnouncementRead,
    Event,
    Judge,
    Participant,
    ParticipantSkill,
    ScoreEntry,
    SupportTicket,
    Team,
    TeamMember,
    User,
)
from app.schemas.common import SkillCreateSchema, load_or_raise
from app.services.scoring import aggregate_scores_for_team_event
from app.services.cv_parser import parse_cv_document
from app.utils.api import err, ok
from app.utils.pagination import get_pagination_params, meta_from_paginated
from app.utils.time import utcnow

student_bp = Blueprint("student", __name__, url_prefix="/api/student")


def _dt(value):
    return value.isoformat() if value else None


def _participant_payload(participant: Participant):
    return {
        "id": participant.id,
        "name": participant.name,
        "email": participant.email,
        "avatarColor": participant.avatar_color,
        "experience": participant.experience,
        "bio": participant.bio,
        "github": participant.github,
        "linkedin": participant.linkedin,
        "cvUrl": participant.cv_url,
        "cvUploadedAt": _dt(participant.cv_uploaded_at),
        "university": participant.university,
        "graduationYear": participant.graduation_year,
        "skills": [
            {
                "id": skill.id,
                "name": skill.name,
                "level": skill.level,
                "category": skill.category,
                "source": skill.source,
            }
            for skill in participant.skills
        ],
    }


def _program_track(participant: Participant):
    categories = {skill.category for skill in participant.skills}
    if "ml" in categories:
        return "Machine Learning"
    if "security" in categories:
        return "Cyber Security"
    if "frontend" in categories and "backend" in categories:
        return "Full Stack"
    return participant.university or "Computer Science"


def _participant_summary_payload(participant: Participant):
    return {
        "id": participant.id,
        "name": participant.name,
        "email": participant.email,
        "avatarColor": participant.avatar_color,
        "experience": participant.experience,
        "university": participant.university,
        "programTrack": _program_track(participant),
        "cvUrl": participant.cv_url,
        "skills": [
            {
                "id": skill.id,
                "name": skill.name,
                "level": skill.level,
                "category": skill.category,
                "source": skill.source,
            }
            for skill in participant.skills
        ],
    }


def _team_payload(team: Team):
    members = []
    for tm in sorted(
        team.members,
        key=lambda row: (
            0 if row.role == "captain" else 1 if row.role == "member" else 2,
            row.joined_at or utcnow(),
        ),
    ):
        p = tm.participant
        members.append(
            {
                "id": p.id,
                "name": p.name,
                "email": p.email,
                "avatarColor": p.avatar_color,
                "role": tm.role,
                "university": p.university,
                "experience": p.experience,
                "cvUrl": p.cv_url,
                "skills": [{"name": s.name, "category": s.category, "level": s.level} for s in p.skills],
            }
        )

    return {
        "id": team.id,
        "name": team.name,
        "status": team.status,
        "eventId": team.event_id,
        "eventType": team.event_type,
        "captainId": team.captain_id,
        "chemistryScore": team.chemistry_score,
        "missingSkills": team.missing_skills_csv.split(",") if team.missing_skills_csv else [],
        "projectName": team.project_name,
        "repositoryUrl": team.repository_url,
        "description": team.description,
        "createdAt": _dt(team.created_at),
        "members": members,
    }


def _wanted_roles_for_team(team: Team):
    role_map = {
        "frontend": "Developer",
        "backend": "Developer",
        "ml": "Developer",
        "design": "Designer",
        "security": "Business analyzer",
        "devops": "Developer",
    }
    raw = [item.strip().lower() for item in (team.missing_skills_csv or "").split(",") if item.strip()]
    roles = []
    for item in raw:
        if item in {"presenter", "developer", "designer", "business analyzer"}:
            roles.append(item.title() if item != "business analyzer" else "Business analyzer")
        elif item in role_map:
            roles.append(role_map[item])

    if len(team.members) <= 2:
        roles.append("Presenter")

    canonical = ["Presenter", "Developer", "Designer", "Business analyzer"]
    seed_index = sum(ord(ch) for ch in (team.id or "")) % len(canonical) if team.id else 0
    for offset in range(len(canonical)):
        roles.append(canonical[(seed_index + offset) % len(canonical)])

    deduped = []
    for role in roles:
        if role not in deduped:
            deduped.append(role)
    return deduped[:4]


def _team_directory_payload(team: Team):
    event = db.session.get(Event, team.event_id) if team.event_id else None
    members = [
        {
            "id": member.participant.id,
            "name": member.participant.name,
            "email": member.participant.email,
            "roleInTeam": member.role,
        }
        for member in sorted(team.members, key=lambda item: item.joined_at or utcnow())
    ]
    return {
        "id": team.id,
        "name": team.name,
        "status": team.status,
        "memberCount": len(members),
        "wantedRoles": _wanted_roles_for_team(team),
        "event": {
            "id": event.id if event else None,
            "name": event.name if event else "No active hackathon",
            "status": event.status if event else "inactive",
        },
        "members": members,
    }


def _resolve_participant_from_jwt():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return None
    return Participant.query.filter_by(user_id=user.id).first()


@student_bp.get("/profile")
@role_required("student")
def get_profile():
    participant = _resolve_participant_from_jwt()
    if not participant:
        return err("not_found", "Participant profile not found", 404)
    return ok({"participant": _participant_payload(participant)})


@student_bp.put("/profile")
@role_required("student")
def update_profile():
    participant = _resolve_participant_from_jwt()
    if not participant:
        return err("not_found", "Participant profile not found", 404)

    payload = request.get_json(silent=True) or {}
    allowed = ["bio", "github", "linkedin", "university", "graduationYear", "experience"]
    for key in allowed:
        if key not in payload:
            continue
        if key == "graduationYear":
            participant.graduation_year = payload[key]
        elif key == "experience":
            participant.experience = payload[key]
        elif key == "bio":
            participant.bio = payload[key]
        elif key == "github":
            participant.github = payload[key]
        elif key == "linkedin":
            participant.linkedin = payload[key]
        elif key == "university":
            participant.university = payload[key]

    db.session.commit()
    return jsonify({"participant": _participant_payload(participant)}), 200


@student_bp.post("/cv/upload")
@role_required("student")
def upload_cv():
    participant = _resolve_participant_from_jwt()
    if not participant:
        return err("not_found", "Participant profile not found", 404)

    file = request.files.get("file")
    if not file:
        return err("bad_request", "file is required", 400)

    original_name = file.filename or ""
    ext = Path(original_name).suffix.lower()
    if ext != ".pdf":
        return err("bad_request", "Only PDF CV files are supported", 400)

    upload_dir = Path(current_app.config.get("CV_UPLOAD_DIR", Path(current_app.root_path).parent / "uploads" / "cv"))
    upload_dir.mkdir(parents=True, exist_ok=True)

    safe_name = secure_filename(original_name) or "cv.pdf"
    stored_name = f"{participant.id}_{uuid.uuid4().hex}{Path(safe_name).suffix.lower()}"
    stored_path = upload_dir / stored_name
    file.save(stored_path)

    parse_result = parse_cv_document(
        str(stored_path),
        gemini_api_key=current_app.config.get("GEMINI_API_KEY"),
        model=current_app.config.get("GEMINI_MODEL", "gemini-2.5-flash"),
    )
    parsed_payload = parse_result.get("parsed", {}) if isinstance(parse_result, dict) else {}
    parsed_skills = []
    parsed_experience = []
    if isinstance(parsed_payload, dict):
        skills_node = parsed_payload.get("skills")
        if isinstance(skills_node, dict):
            technical = skills_node.get("technical", [])
            if isinstance(technical, list):
                parsed_skills = [item for item in technical if isinstance(item, str)]
        elif isinstance(skills_node, list):
            parsed_skills = [item for item in skills_node if isinstance(item, str)]

        experience_node = parsed_payload.get("work_experience", parsed_payload.get("experience", []))
        if isinstance(experience_node, list):
            parsed_experience = experience_node

    # Requested behavior: print compact parse shape to console.
    print(
        "[CV_PARSE_GEMINI]",
        json.dumps({"skills": parsed_skills, "experience": parsed_experience}, ensure_ascii=False),
    )

    ParticipantSkill.query.filter_by(participant_id=participant.id, source="cv").delete()
    existing_manual = {
        (s.name.strip().lower(), s.category)
        for s in ParticipantSkill.query.filter_by(participant_id=participant.id).all()
        if s.source != "cv"
    }

    extracted_skills = parse_result.get("extracted_skills", [])
    for skill in extracted_skills:
        key = (skill["name"].strip().lower(), skill["category"])
        if key in existing_manual:
            continue
        db.session.add(
            ParticipantSkill(
                participant_id=participant.id,
                name=skill["name"].strip(),
                level=skill.get("level", "intermediate"),
                category=skill.get("category", "other"),
                source="cv",
            )
        )

    participant.cv_url = f"/uploads/cv/{stored_name}"
    participant.cv_uploaded_at = utcnow()

    # Ensure student has a starter team after first CV upload.
    existing_membership = TeamMember.query.filter_by(participant_id=participant.id).first()
    if not existing_membership:
        starter_team = Team(
            id=str(uuid.uuid4()),
            name=f"{participant.name.split(' ')[0]} Squad",
            captain_id=participant.id,
            event_id=None,
            event_type="hackathon",
            status="active",
            chemistry_score=72,
            missing_skills_csv="",
            description="Auto-created after CV upload.",
        )
        db.session.add(starter_team)
        db.session.flush()
        db.session.add(
            TeamMember(
                team_id=starter_team.id,
                participant_id=participant.id,
                role="captain",
            )
        )

    db.session.commit()
    db.session.refresh(participant)

    membership_after_upload = TeamMember.query.filter_by(participant_id=participant.id).first()
    team_payload = None
    if membership_after_upload:
        team_after_upload = db.session.get(Team, membership_after_upload.team_id)
        if team_after_upload:
            team_payload = _team_payload(team_after_upload)

    return ok(
        {
            "participant": _participant_payload(participant),
            "cvExtractedSkills": extracted_skills,
            "cvAnalysis": parse_result.get("parsed", {}),
            "team": team_payload,
        }
    )


@student_bp.post("/skills")
@role_required("student")
def add_skill():
    participant = _resolve_participant_from_jwt()
    if not participant:
        return jsonify({"error": "not_found", "message": "Participant profile not found"}), 404

    payload = load_or_raise(SkillCreateSchema(), request.get_json(silent=True) or {})

    skill = ParticipantSkill(
        participant_id=participant.id,
        name=payload["name"].strip(),
        level=payload["level"],
        category=payload["category"],
        source=payload.get("source", "manual"),
    )
    db.session.add(skill)
    db.session.commit()
    return ok({"skillId": skill.id}, 201)


@student_bp.delete("/skills/<int:skill_id>")
@role_required("student")
def delete_skill(skill_id: int):
    participant = _resolve_participant_from_jwt()
    if not participant:
        return err("not_found", "Participant profile not found", 404)

    skill = ParticipantSkill.query.filter_by(id=skill_id, participant_id=participant.id).first()
    if not skill:
        return jsonify({"error": "not_found", "message": "Skill not found"}), 404
    db.session.delete(skill)
    db.session.commit()
    return jsonify({"deleted": True}), 200


@student_bp.get("/team")
@role_required("student")
def my_team():
    participant = _resolve_participant_from_jwt()
    if not participant:
        return jsonify({"error": "not_found", "message": "Participant profile not found"}), 404

    membership = TeamMember.query.filter_by(participant_id=participant.id).first()
    if not membership:
        return jsonify({"team": None}), 200

    team = db.session.get(Team, membership.team_id)
    if not team:
        return jsonify({"team": None}), 200

    return jsonify({"team": _team_payload(team)}), 200


@student_bp.put("/team")
@role_required("student")
def update_my_team():
    participant = _resolve_participant_from_jwt()
    if not participant:
        return err("not_found", "Participant profile not found", 404)

    membership = TeamMember.query.filter_by(participant_id=participant.id).first()
    if not membership:
        return err("not_found", "You are not in a team", 404)
    team = db.session.get(Team, membership.team_id)
    if not team:
        return err("not_found", "Team not found", 404)
    if team.captain_id != participant.id:
        return err("forbidden", "Only captain can update team info.", 403)

    payload = request.get_json(silent=True) or {}
    if "projectName" in payload:
        team.project_name = payload["projectName"]
    if "repositoryUrl" in payload:
        team.repository_url = payload["repositoryUrl"]
    if "description" in payload:
        team.description = payload["description"]
    db.session.commit()
    db.session.refresh(team)
    return ok({"team": _team_payload(team)})


@student_bp.post("/team/leave")
@role_required("student")
def leave_my_team():
    participant = _resolve_participant_from_jwt()
    if not participant:
        return err("not_found", "Participant profile not found", 404)

    membership = TeamMember.query.filter_by(participant_id=participant.id).first()
    if not membership:
        return err("bad_request", "You are not in a team.", 400)

    team = db.session.get(Team, membership.team_id)
    if not team:
        return err("not_found", "Team not found", 404)

    db.session.delete(membership)
    db.session.flush()

    remaining = TeamMember.query.filter_by(team_id=team.id).all()
    if not remaining:
        db.session.delete(team)
        db.session.commit()
        return ok({"team": None})

    if team.captain_id == participant.id:
        next_captain = next((row for row in remaining if row.role != "invited"), remaining[0])
        team.captain_id = next_captain.participant_id
        next_captain.role = "captain"

    db.session.commit()
    db.session.refresh(team)
    return ok({"team": _team_payload(team)})


@student_bp.get("/teams")
@role_required("student")
def list_teams_directory():
    participant = _resolve_participant_from_jwt()
    if not participant:
        return err("not_found", "Participant profile not found", 404)

    teams = (
        Team.query.filter(Team.status.in_(["forming", "active", "competing"]))
        .order_by(Team.created_at.desc())
        .all()
    )

    query_text = (request.args.get("q") or "").strip().lower()
    payload = []
    for team in teams:
        row = _team_directory_payload(team)
        if query_text:
            haystack = " ".join(
                [row["name"], row["event"]["name"], *[member["name"] for member in row["members"]], *row["wantedRoles"]]
            ).lower()
            if query_text not in haystack:
                continue
        payload.append(row)

    return ok({"teams": payload})


@student_bp.get("/teams/<team_id>")
@role_required("student")
def team_directory_detail(team_id: str):
    participant = _resolve_participant_from_jwt()
    if not participant:
        return err("not_found", "Participant profile not found", 404)

    team = db.session.get(Team, team_id)
    if not team:
        return err("not_found", "Team not found", 404)

    detail = _team_directory_payload(team)
    member_ids = [member.participant_id for member in team.members]
    participated = {}
    for member in team.members:
        for membership in member.participant.team_memberships:
            history_team = membership.team
            if not history_team or not history_team.event_id:
                continue
            event = db.session.get(Event, history_team.event_id)
            if not event:
                continue
            key = event.id
            participated[key] = {
                "eventId": event.id,
                "eventName": event.name,
                "status": event.status,
                "teamName": history_team.name,
            }

    detail["hackathons"] = sorted(participated.values(), key=lambda item: item["eventName"])
    detail["isMember"] = participant.id in member_ids
    return ok({"team": detail})


@student_bp.post("/teams/<team_id>/join-request")
@role_required("student")
def request_team_join(team_id: str):
    participant = _resolve_participant_from_jwt()
    if not participant:
        return err("not_found", "Participant profile not found", 404)
    if not participant.cv_url:
        return err("forbidden", "Upload your CV before requesting to join a team.", 403)

    target_team = db.session.get(Team, team_id)
    if not target_team:
        return err("not_found", "Team not found", 404)

    if TeamMember.query.filter_by(team_id=team_id, participant_id=participant.id).first():
        return err("conflict", "You are already in this team.", 409)

    current_membership = TeamMember.query.filter_by(participant_id=participant.id).first()
    if current_membership and current_membership.team_id != team_id:
        current_team_members = TeamMember.query.filter_by(team_id=current_membership.team_id).count()
        if current_team_members >= 2:
            return err(
                "forbidden",
                "Joining is blocked because your current team already has 2 or more members.",
                403,
            )

        current_team = db.session.get(Team, current_membership.team_id)
        db.session.delete(current_membership)
        db.session.flush()

        if current_team and TeamMember.query.filter_by(team_id=current_team.id).count() == 0:
            db.session.delete(current_team)
            db.session.flush()

    db.session.add(
        TeamMember(
            team_id=target_team.id,
            participant_id=participant.id,
            role="member",
        )
    )
    db.session.commit()
    db.session.refresh(target_team)
    return ok({"team": _team_directory_payload(target_team), "joined": True})


@student_bp.get("/participants")
@role_required("student")
def list_available_participants():
    participant = _resolve_participant_from_jwt()
    if not participant:
        return err("not_found", "Participant profile not found", 404)

    if not participant.cv_url:
        return err("forbidden", "Upload your CV first to unlock team member recommendations.", 403)

    query_text = (request.args.get("q") or "").strip().lower()

    rows = (
        Participant.query.outerjoin(TeamMember, TeamMember.participant_id == Participant.id)
        .filter(Participant.id != participant.id)
        .filter(TeamMember.id.is_(None))
        .order_by(Participant.created_at.desc())
        .all()
    )

    if query_text:
        rows = [
            row
            for row in rows
            if query_text in row.name.lower()
            or query_text in row.email.lower()
            or query_text in (row.university or "").lower()
            or query_text in _program_track(row).lower()
        ]

    return ok({"participants": [_participant_summary_payload(row) for row in rows]})


@student_bp.get("/participants/<participant_id>")
@role_required("student")
def participant_detail(participant_id: str):
    participant = _resolve_participant_from_jwt()
    if not participant:
        return err("not_found", "Participant profile not found", 404)

    if not participant.cv_url:
        return err("forbidden", "Upload your CV first to unlock detailed profiles.", 403)

    target = db.session.get(Participant, participant_id)
    if not target:
        return err("not_found", "Participant not found", 404)

    in_team = TeamMember.query.filter_by(participant_id=target.id).first() is not None
    payload = _participant_payload(target)
    payload["programTrack"] = _program_track(target)
    payload["hasTeam"] = in_team
    return ok({"participant": payload})


@student_bp.post("/team/invitations")
@role_required("student")
def send_team_invitation():
    participant = _resolve_participant_from_jwt()
    if not participant:
        return err("not_found", "Participant profile not found", 404)
    if not participant.cv_url:
        return err("forbidden", "Upload your CV before inviting teammates.", 403)

    membership = TeamMember.query.filter_by(participant_id=participant.id).first()
    if not membership:
        return err("bad_request", "You are not assigned to any team.", 400)

    team = db.session.get(Team, membership.team_id)
    if not team:
        return err("not_found", "Team not found", 404)

    if team.captain_id != participant.id:
        return err("forbidden", "Only team captain can send invitations.", 403)

    payload = request.get_json(silent=True) or {}
    target_participant_id = payload.get("participantId")
    if not target_participant_id:
        return err("bad_request", "participantId is required", 400)

    target = db.session.get(Participant, target_participant_id)
    if not target:
        return err("not_found", "Target participant not found", 404)

    if TeamMember.query.filter_by(participant_id=target.id).first():
        return err("conflict", "Participant is already in a team.", 409)

    existing = TeamMember.query.filter_by(team_id=team.id, participant_id=target.id).first()
    if not existing:
        db.session.add(TeamMember(team_id=team.id, participant_id=target.id, role="invited"))
        db.session.commit()
        db.session.refresh(team)

    return ok({"team": _team_payload(team)})


@student_bp.get("/reviews")
@role_required("student")
def list_reviews():
    participant = _resolve_participant_from_jwt()
    if not participant:
        return err("not_found", "Participant profile not found", 404)

    reviews = []
    for team in Team.query.filter(Team.status == "completed").all():
        if not team.event_id:
            continue
        aggregate = aggregate_scores_for_team_event(team.id, team.event_id)
        judge_scores = []
        entries = ScoreEntry.query.filter_by(team_id=team.id, event_id=team.event_id).all()
        for entry in entries:
            judge = db.session.get(Judge, entry.judge_id)
            judge_scores.append(
                {
                    "judgeId": entry.judge_id,
                    "judgeName": judge.name if judge else entry.judge_id,
                    "scores": {
                        "technical": entry.technical,
                        "presentation": entry.presentation,
                        "innovation": entry.innovation,
                        "teamwork": entry.teamwork,
                    },
                    "comment": entry.comment,
                    "submittedAt": _dt(entry.submitted_at),
                }
            )

        reviews.append(
            {
                "teamId": team.id,
                "eventId": team.event_id,
                "judgeScores": judge_scores,
                "aggregatedScores": {
                    "technical": aggregate["technical"],
                    "presentation": aggregate["presentation"],
                    "innovation": aggregate["innovation"],
                    "teamwork": aggregate["teamwork"],
                    "total": aggregate["total"],
                },
                "reviewedAt": _dt(max((entry.submitted_at for entry in entries), default=utcnow())),
            }
        )

    reviews.sort(key=lambda item: item["aggregatedScores"]["total"], reverse=True)
    rank_by_team_event = {
        (item["teamId"], item["eventId"]): idx + 1
        for idx, item in enumerate(reviews)
    }
    for item in reviews:
        item["rank"] = rank_by_team_event[(item["teamId"], item["eventId"])]
        item["aiFeedback"] = (
            "Great coordination and clear pitching cadence. Improve technical depth in the next milestone."
        )

    return ok({"reviews": reviews})


@student_bp.get("/history-hackathons")
@role_required("student")
def history_hackathons():
    participant = _resolve_participant_from_jwt()
    if not participant:
        return err("not_found", "Participant profile not found", 404)

    event = Event.query.filter(Event.name.ilike("%DataDriven Solutions%")).first()
    if not event:
        return ok({"history": []})

    return ok(
        {
            "history": [
                {
                    "id": f"history-{event.id}",
                    "eventId": event.id,
                    "eventName": event.name,
                    "status": event.status,
                    "startDate": _dt(event.start_date),
                    "endDate": _dt(event.end_date),
                    "summary": "DataDriven Solutions hackathon delivered strong team execution and clear problem framing.",
                }
            ]
        }
    )


@student_bp.get("/events")
@role_required("student")
def list_events():
    status = request.args.get("status")
    query = Event.query
    if status:
        query = query.filter_by(status=status)
    events = query.order_by(Event.start_date.asc()).all()
    page, per_page = get_pagination_params(default_per_page=12)
    paged = query.order_by(Event.start_date.asc()).paginate(page=page, per_page=per_page, error_out=False)
    return ok(
        {
            "events": [
                {
                    "id": e.id,
                    "name": e.name,
                    "type": e.type,
                    "description": e.description,
                    "startDate": _dt(e.start_date),
                    "endDate": _dt(e.end_date),
                    "registrationDeadline": _dt(e.registration_deadline),
                    "status": e.status,
                    "location": e.location,
                    "prize": e.prize,
                    "coverColor": e.cover_color,
                    "teamCount": len(e.teams),
                    "participantCount": sum(len(t.members) for t in e.teams),
                }
                for e in paged.items
            ]
        },
        meta=meta_from_paginated(paged),
    )


@student_bp.get("/events/<event_id>")
@role_required("student")
def event_detail(event_id: str):
    participant = _resolve_participant_from_jwt()
    if not participant:
        return jsonify({"error": "not_found", "message": "Participant profile not found"}), 404

    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"error": "not_found", "message": "Event not found"}), 404

    team_rows = []
    for t in event.teams:
        team_rows.append({"id": t.id, "name": t.name, "chemistryScore": t.chemistry_score, "status": t.status})

    membership = TeamMember.query.filter_by(participant_id=participant.id).first()
    my_team_id = membership.team_id if membership else None
    my_scores = []
    if my_team_id:
        entries = ScoreEntry.query.filter_by(event_id=event.id, team_id=my_team_id).all()
        for entry in entries:
            my_scores.append(
                {
                    "judgeId": entry.judge_id,
                    "technical": entry.technical,
                    "presentation": entry.presentation,
                    "innovation": entry.innovation,
                    "teamwork": entry.teamwork,
                    "submittedAt": _dt(entry.submitted_at),
                }
            )

    return jsonify({"event": {"id": event.id, "name": event.name, "status": event.status, "teams": team_rows, "myScores": my_scores}}), 200


@student_bp.get("/announcements")
@role_required("student")
def list_announcements():
    participant = _resolve_participant_from_jwt()
    if not participant:
        return jsonify({"error": "not_found", "message": "Participant profile not found"}), 404

    read_rows = AnnouncementRead.query.filter_by(participant_id=participant.id).all()
    read_set = {r.announcement_id for r in read_rows}

    announcements = (
        Announcement.query.filter(Announcement.target_role.in_(["all", "student"]))
        .order_by(Announcement.pinned.desc(), Announcement.created_at.desc())
        .all()
    )
    return (
        jsonify(
            {
                "announcements": [
                    {
                        "id": a.id,
                        "title": a.title,
                        "content": a.content,
                        "type": a.type,
                        "targetRole": a.target_role,
                        "pinned": a.pinned,
                        "createdAt": _dt(a.created_at),
                        "expiresAt": _dt(a.expires_at),
                        "isRead": a.id in read_set,
                    }
                    for a in announcements
                ],
                "unreadCount": sum(1 for a in announcements if a.id not in read_set),
            }
        ),
        200,
    )


@student_bp.post("/announcements/<announcement_id>/read")
@role_required("student")
def mark_announcement_read(announcement_id: str):
    participant = _resolve_participant_from_jwt()
    if not participant:
        return jsonify({"error": "not_found", "message": "Participant profile not found"}), 404

    announcement = db.session.get(Announcement, announcement_id)
    if not announcement:
        return jsonify({"error": "not_found", "message": "Announcement not found"}), 404

    exists = AnnouncementRead.query.filter_by(
        participant_id=participant.id,
        announcement_id=announcement.id,
    ).first()
    if not exists:
        db.session.add(AnnouncementRead(participant_id=participant.id, announcement_id=announcement.id))
        db.session.commit()
    return jsonify({"ok": True}), 200


@student_bp.post("/announcements/read-all")
@role_required("student")
def mark_all_read():
    participant = _resolve_participant_from_jwt()
    if not participant:
        return jsonify({"error": "not_found", "message": "Participant profile not found"}), 404

    announcements = Announcement.query.filter(Announcement.target_role.in_(["all", "student"])).all()
    existing = {
        r.announcement_id
        for r in AnnouncementRead.query.filter_by(participant_id=participant.id).all()
    }
    for ann in announcements:
        if ann.id not in existing:
            db.session.add(AnnouncementRead(participant_id=participant.id, announcement_id=ann.id))
    db.session.commit()
    return jsonify({"ok": True}), 200


@student_bp.get("/support-tickets")
@role_required("student")
def list_support_tickets():
    participant = _resolve_participant_from_jwt()
    if not participant:
        return jsonify({"error": "not_found", "message": "Participant profile not found"}), 404

    rows = SupportTicket.query.filter_by(user_id=participant.id).order_by(SupportTicket.created_at.desc()).all()
    return (
        jsonify(
            {
                "tickets": [
                    {
                        "id": t.id,
                        "subject": t.subject,
                        "message": t.message,
                        "status": t.status,
                        "response": t.response,
                        "createdAt": _dt(t.created_at),
                        "respondedAt": _dt(t.responded_at),
                    }
                    for t in rows
                ]
            }
        ),
        200,
    )


@student_bp.post("/support-tickets")
@role_required("student")
def create_support_ticket():
    participant = _resolve_participant_from_jwt()
    if not participant:
        return jsonify({"error": "not_found", "message": "Participant profile not found"}), 404

    payload = request.get_json(silent=True) or {}
    subject = payload.get("subject")
    message = payload.get("message")
    if not subject or not message:
        return jsonify({"error": "bad_request", "message": "subject and message are required"}), 400

    ticket = SupportTicket(
        id=str(uuid.uuid4()),
        user_id=participant.id,
        subject=subject,
        message=message,
        status="open",
    )
    db.session.add(ticket)
    db.session.commit()
    return jsonify({"id": ticket.id, "status": ticket.status}), 201
