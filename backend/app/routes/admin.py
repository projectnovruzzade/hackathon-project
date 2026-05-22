import uuid
from datetime import datetime

from flask import Blueprint, jsonify, request

from app.auth import role_required
from app.extensions import db
from app.models import (
    Announcement,
    Event,
    Judge,
    JudgeEventAssignment,
    JudgePermission,
    Participant,
    ParticipantSkill,
    ScoreEntry,
    SupportTicket,
    Team,
    TeamMember,
)
from app.schemas.common import EventCreateSchema, ParticipantCreateSchema, load_or_raise
from app.utils.time import utcnow
from app.utils.api import err, ok
from app.utils.pagination import get_pagination_params, meta_from_paginated

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def _dt(v):
    return v.isoformat() if v else None


@admin_bp.get("/participants")
@role_required("admin")
def list_participants():
    query = Participant.query
    search = request.args.get("search")
    university = request.args.get("university")
    min_exp = request.args.get("minExperience", type=int)
    max_exp = request.args.get("maxExperience", type=int)
    skill_category = request.args.get("skillCategory")

    if search:
        query = query.filter((Participant.name.ilike(f"%{search}%")) | (Participant.email.ilike(f"%{search}%")))
    if university:
        query = query.filter(Participant.university == university)
    if min_exp is not None:
        query = query.filter(Participant.experience >= min_exp)
    if max_exp is not None:
        query = query.filter(Participant.experience <= max_exp)
    if skill_category:
        query = query.join(ParticipantSkill).filter(ParticipantSkill.category == skill_category)

    page, per_page = get_pagination_params(default_per_page=20)
    paged = query.order_by(Participant.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return ok(
        {
            "participants": [
                {
                    "id": p.id,
                    "name": p.name,
                    "email": p.email,
                    "university": p.university,
                    "experience": p.experience,
                    "avatarColor": p.avatar_color,
                    "teamId": p.team_memberships[0].team_id if p.team_memberships else None,
                    "skills": [{"id": s.id, "name": s.name, "level": s.level, "category": s.category} for s in p.skills],
                }
                for p in paged.items
            ]
        },
        meta=meta_from_paginated(paged),
    )


@admin_bp.post("/participants")
@role_required("admin")
def create_participant():
    payload = load_or_raise(ParticipantCreateSchema(), request.get_json(silent=True) or {})

    p = Participant(
        id=str(uuid.uuid4()),
        name=payload["name"],
        email=payload["email"].lower().strip(),
        avatar_color=payload.get("avatarColor", "violet"),
        experience=payload.get("experience", 0),
        bio=payload.get("bio"),
        github=payload.get("github"),
        linkedin=payload.get("linkedin"),
        university=payload.get("university"),
        graduation_year=payload.get("graduationYear"),
    )
    db.session.add(p)
    db.session.commit()
    return ok({"id": p.id}, 201)


@admin_bp.put("/participants/<participant_id>")
@role_required("admin")
def update_participant(participant_id: str):
    p = db.session.get(Participant, participant_id)
    if not p:
        return jsonify({"error": "not_found"}), 404
    payload = request.get_json(silent=True) or {}
    for src, dest in [
        ("name", "name"),
        ("email", "email"),
        ("bio", "bio"),
        ("github", "github"),
        ("linkedin", "linkedin"),
        ("university", "university"),
        ("experience", "experience"),
        ("graduationYear", "graduation_year"),
        ("avatarColor", "avatar_color"),
    ]:
        if src in payload:
            setattr(p, dest, payload[src])
    db.session.commit()
    return jsonify({"updated": True}), 200


@admin_bp.delete("/participants/<participant_id>")
@role_required("admin")
def delete_participant(participant_id: str):
    p = db.session.get(Participant, participant_id)
    if not p:
        return jsonify({"error": "not_found"}), 404
    db.session.delete(p)
    db.session.commit()
    return jsonify({"deleted": True}), 200


@admin_bp.get("/teams")
@role_required("admin")
def list_teams():
    event_id = request.args.get("eventId")
    status = request.args.get("status")
    query = Team.query
    if event_id:
        query = query.filter_by(event_id=event_id)
    if status:
        query = query.filter_by(status=status)
    rows = query.order_by(Team.created_at.desc()).all()
    return jsonify(
        {
            "teams": [
                {
                    "id": t.id,
                    "name": t.name,
                    "status": t.status,
                    "eventId": t.event_id,
                    "eventType": t.event_type,
                    "captainId": t.captain_id,
                    "chemistryScore": t.chemistry_score,
                    "missingSkills": t.missing_skills_csv.split(",") if t.missing_skills_csv else [],
                    "members": [
                        {"participantId": m.participant_id, "name": m.participant.name, "role": m.role}
                        for m in t.members
                    ],
                }
                for t in rows
            ]
        }
    )


@admin_bp.post("/teams")
@role_required("admin")
def create_team():
    payload = request.get_json(silent=True) or {}
    name = payload.get("name")
    captain_id = payload.get("captainId")
    event_id = payload.get("eventId")
    member_ids = payload.get("memberIds", [])
    if not name or not captain_id:
        return jsonify({"error": "bad_request", "message": "name and captainId are required"}), 400

    event = db.session.get(Event, event_id) if event_id else None
    t = Team(
        id=str(uuid.uuid4()),
        name=name,
        captain_id=captain_id,
        event_id=event_id,
        event_type=event.type if event else payload.get("eventType", "hackathon"),
        status=payload.get("status", "forming"),
        chemistry_score=float(payload.get("chemistryScore", 0)),
        missing_skills_csv=",".join(payload.get("missingSkills", [])),
        description=payload.get("description"),
        repository_url=payload.get("repositoryUrl"),
        project_name=payload.get("projectName"),
    )
    db.session.add(t)
    if captain_id not in member_ids:
        member_ids = [captain_id, *member_ids]
    for participant_id in member_ids:
        db.session.add(
            TeamMember(
                team_id=t.id,
                participant_id=participant_id,
                role="captain" if participant_id == captain_id else "member",
            )
        )
    db.session.commit()
    return jsonify({"id": t.id}), 201


@admin_bp.put("/teams/<team_id>")
@role_required("admin")
def update_team(team_id: str):
    t = db.session.get(Team, team_id)
    if not t:
        return jsonify({"error": "not_found"}), 404
    payload = request.get_json(silent=True) or {}
    for src, dest in [
        ("name", "name"),
        ("status", "status"),
        ("captainId", "captain_id"),
        ("projectName", "project_name"),
        ("repositoryUrl", "repository_url"),
        ("description", "description"),
    ]:
        if src in payload:
            setattr(t, dest, payload[src])
    if "missingSkills" in payload:
        t.missing_skills_csv = ",".join(payload["missingSkills"])
    db.session.commit()
    return jsonify({"updated": True}), 200


@admin_bp.delete("/teams/<team_id>")
@role_required("admin")
def dissolve_team(team_id: str):
    t = db.session.get(Team, team_id)
    if not t:
        return jsonify({"error": "not_found"}), 404
    db.session.delete(t)
    db.session.commit()
    return jsonify({"deleted": True}), 200


@admin_bp.post("/teams/<team_id>/members")
@role_required("admin")
def add_team_member(team_id: str):
    t = db.session.get(Team, team_id)
    if not t:
        return jsonify({"error": "not_found"}), 404
    payload = request.get_json(silent=True) or {}
    participant_id = payload.get("participantId")
    if not participant_id:
        return jsonify({"error": "bad_request"}), 400
    exists = TeamMember.query.filter_by(team_id=team_id, participant_id=participant_id).first()
    if exists:
        return jsonify({"error": "conflict", "message": "Already member"}), 409
    db.session.add(TeamMember(team_id=team_id, participant_id=participant_id, role="member"))
    db.session.commit()
    return jsonify({"added": True}), 201


@admin_bp.delete("/teams/<team_id>/members/<participant_id>")
@role_required("admin")
def remove_team_member(team_id: str, participant_id: str):
    tm = TeamMember.query.filter_by(team_id=team_id, participant_id=participant_id).first()
    if not tm:
        return jsonify({"error": "not_found"}), 404
    db.session.delete(tm)
    db.session.commit()
    return jsonify({"deleted": True}), 200


@admin_bp.post("/teams/<team_id>/transfer-captain")
@role_required("admin")
def transfer_captain(team_id: str):
    t = db.session.get(Team, team_id)
    if not t:
        return jsonify({"error": "not_found"}), 404
    payload = request.get_json(silent=True) or {}
    new_captain_id = payload.get("participantId")
    tm = TeamMember.query.filter_by(team_id=team_id, participant_id=new_captain_id).first()
    if not tm:
        return jsonify({"error": "bad_request", "message": "participant not in team"}), 400
    for m in t.members:
        m.role = "captain" if m.participant_id == new_captain_id else "member"
    t.captain_id = new_captain_id
    db.session.commit()
    return jsonify({"updated": True}), 200


@admin_bp.get("/events")
@role_required("admin")
def list_events():
    status = request.args.get("status")
    q = Event.query
    if status:
        q = q.filter_by(status=status)
    page, per_page = get_pagination_params(default_per_page=12)
    paged = q.order_by(Event.start_date.asc()).paginate(page=page, per_page=per_page, error_out=False)
    return ok(
        {
            "events": [
                {
                    "id": e.id,
                    "name": e.name,
                    "type": e.type,
                    "status": e.status,
                    "description": e.description,
                    "startDate": _dt(e.start_date),
                    "endDate": _dt(e.end_date),
                    "registrationDeadline": _dt(e.registration_deadline),
                    "location": e.location,
                    "prize": e.prize,
                }
                for e in paged.items
            ]
        },
        meta=meta_from_paginated(paged),
    )


@admin_bp.post("/events")
@role_required("admin")
def create_event():
    p = load_or_raise(EventCreateSchema(), request.get_json(silent=True) or {})
    e = Event(
        id=str(uuid.uuid4()),
        name=p["name"],
        type=p["type"],
        description=p["description"],
        start_date=p["startDate"],
        end_date=p["endDate"],
        registration_deadline=p["registrationDeadline"],
        location=p["location"],
        status=p.get("status", "upcoming"),
        prize=p.get("prize"),
        cover_color=p.get("coverColor"),
        max_team_size=p.get("maxTeamSize"),
        max_participants=p.get("maxParticipants"),
        team_building_method=p.get("teamBuildingMethod"),
    )
    db.session.add(e)
    db.session.commit()
    return ok({"id": e.id}, 201)


@admin_bp.put("/events/<event_id>")
@role_required("admin")
def update_event(event_id: str):
    e = db.session.get(Event, event_id)
    if not e:
        return jsonify({"error": "not_found"}), 404
    p = request.get_json(silent=True) or {}
    mapping = {
        "name": "name",
        "type": "type",
        "description": "description",
        "location": "location",
        "status": "status",
        "prize": "prize",
        "coverColor": "cover_color",
        "maxTeamSize": "max_team_size",
        "maxParticipants": "max_participants",
        "teamBuildingMethod": "team_building_method",
    }
    for src, dest in mapping.items():
        if src in p:
            setattr(e, dest, p[src])
    if "startDate" in p:
        e.start_date = datetime.fromisoformat(p["startDate"])
    if "endDate" in p:
        e.end_date = datetime.fromisoformat(p["endDate"])
    if "registrationDeadline" in p:
        e.registration_deadline = datetime.fromisoformat(p["registrationDeadline"])
    db.session.commit()
    return jsonify({"updated": True}), 200


@admin_bp.delete("/events/<event_id>")
@role_required("admin")
def delete_event(event_id: str):
    e = db.session.get(Event, event_id)
    if not e:
        return jsonify({"error": "not_found"}), 404
    db.session.delete(e)
    db.session.commit()
    return jsonify({"deleted": True}), 200


@admin_bp.post("/events/<event_id>/assign-judge")
@role_required("admin")
def assign_judge(event_id: str):
    payload = request.get_json(silent=True) or {}
    judge_id = payload.get("judgeId")
    if not judge_id:
        return jsonify({"error": "bad_request"}), 400
    exists = JudgeEventAssignment.query.filter_by(event_id=event_id, judge_id=judge_id).first()
    if exists:
        return jsonify({"assigned": True}), 200
    db.session.add(JudgeEventAssignment(event_id=event_id, judge_id=judge_id))
    db.session.commit()
    return jsonify({"assigned": True}), 201


@admin_bp.get("/judges")
@role_required("admin")
def list_judges():
    rows = Judge.query.order_by(Judge.created_at.desc()).all()
    return jsonify(
        {
            "judges": [
                {
                    "id": j.id,
                    "name": j.name,
                    "email": j.email,
                    "specialization": j.specialization,
                    "bio": j.bio,
                    "permissions": [{"criterion": p.criterion, "maxPoints": p.max_points} for p in j.permissions],
                    "assignedEventIds": [a.event_id for a in j.event_assignments],
                    "totalReviews": j.total_reviews,
                }
                for j in rows
            ]
        }
    )


@admin_bp.post("/judges")
@role_required("admin")
def create_judge():
    p = request.get_json(silent=True) or {}
    name, email = p.get("name"), p.get("email")
    if not name or not email:
        return jsonify({"error": "bad_request", "message": "name and email are required"}), 400
    j = Judge(
        id=str(uuid.uuid4()),
        name=name,
        email=email.strip().lower(),
        avatar_color=p.get("avatarColor", "cyan"),
        specialization=p.get("specialization", "Industry Expert"),
        bio=p.get("bio"),
    )
    db.session.add(j)
    for item in p.get("permissions", []):
        db.session.add(
            JudgePermission(
                judge_id=j.id,
                criterion=item["criterion"],
                max_points=item.get("maxPoints", 25),
            )
        )
    for event_id in p.get("assignedEventIds", []):
        db.session.add(JudgeEventAssignment(judge_id=j.id, event_id=event_id))
    db.session.commit()
    return jsonify({"id": j.id}), 201


@admin_bp.put("/judges/<judge_id>")
@role_required("admin")
def update_judge(judge_id: str):
    j = db.session.get(Judge, judge_id)
    if not j:
        return jsonify({"error": "not_found"}), 404
    p = request.get_json(silent=True) or {}
    for src, dest in [("name", "name"), ("email", "email"), ("specialization", "specialization"), ("bio", "bio")]:
        if src in p:
            setattr(j, dest, p[src])
    if "permissions" in p:
        JudgePermission.query.filter_by(judge_id=j.id).delete()
        for item in p["permissions"]:
            db.session.add(
                JudgePermission(
                    judge_id=j.id,
                    criterion=item["criterion"],
                    max_points=item.get("maxPoints", 25),
                )
            )
    if "assignedEventIds" in p:
        JudgeEventAssignment.query.filter_by(judge_id=j.id).delete()
        for event_id in p["assignedEventIds"]:
            db.session.add(JudgeEventAssignment(judge_id=j.id, event_id=event_id))
    db.session.commit()
    return jsonify({"updated": True}), 200


@admin_bp.delete("/judges/<judge_id>")
@role_required("admin")
def delete_judge(judge_id: str):
    j = db.session.get(Judge, judge_id)
    if not j:
        return jsonify({"error": "not_found"}), 404
    db.session.delete(j)
    db.session.commit()
    return jsonify({"deleted": True}), 200


@admin_bp.get("/scores")
@role_required("admin")
def list_scores():
    event_id = request.args.get("eventId")
    team_id = request.args.get("teamId")
    q = ScoreEntry.query
    if event_id:
        q = q.filter_by(event_id=event_id)
    if team_id:
        q = q.filter_by(team_id=team_id)
    rows = q.order_by(ScoreEntry.submitted_at.desc()).all()
    return jsonify(
        {
            "scores": [
                {
                    "id": s.id,
                    "judgeId": s.judge_id,
                    "teamId": s.team_id,
                    "eventId": s.event_id,
                    "technical": s.technical,
                    "presentation": s.presentation,
                    "innovation": s.innovation,
                    "teamwork": s.teamwork,
                    "comment": s.comment,
                    "submittedAt": _dt(s.submitted_at),
                }
                for s in rows
            ]
        }
    )


@admin_bp.post("/scores")
@role_required("admin")
def create_score():
    p = request.get_json(silent=True) or {}
    required = ["judgeId", "teamId", "eventId"]
    if any(not p.get(k) for k in required):
        return jsonify({"error": "bad_request"}), 400
    s = ScoreEntry(
        judge_id=p["judgeId"],
        team_id=p["teamId"],
        event_id=p["eventId"],
        technical=p.get("technical"),
        presentation=p.get("presentation"),
        innovation=p.get("innovation"),
        teamwork=p.get("teamwork"),
        comment=p.get("comment"),
    )
    db.session.add(s)
    judge = db.session.get(Judge, p["judgeId"])
    if judge:
        judge.total_reviews += 1
    db.session.commit()
    return jsonify({"id": s.id}), 201


@admin_bp.put("/scores/<int:score_id>")
@role_required("admin")
def override_score(score_id: int):
    s = db.session.get(ScoreEntry, score_id)
    if not s:
        return jsonify({"error": "not_found"}), 404
    p = request.get_json(silent=True) or {}
    for key in ["technical", "presentation", "innovation", "teamwork", "comment"]:
        if key in p:
            setattr(s, key, p[key])
    db.session.commit()
    return jsonify({"updated": True}), 200


@admin_bp.get("/announcements")
@role_required("admin")
def list_announcements():
    rows = Announcement.query.order_by(Announcement.pinned.desc(), Announcement.created_at.desc()).all()
    return jsonify(
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
                }
                for a in rows
            ]
        }
    )


@admin_bp.post("/announcements")
@role_required("admin")
def create_announcement():
    p = request.get_json(silent=True) or {}
    required = ["title", "content", "type", "targetRole", "authorId"]
    if any(not p.get(k) for k in required):
        return jsonify({"error": "bad_request"}), 400
    ann = Announcement(
        id=str(uuid.uuid4()),
        title=p["title"],
        content=p["content"],
        type=p["type"],
        target_role=p["targetRole"],
        author_id=p["authorId"],
        pinned=bool(p.get("pinned", False)),
        expires_at=datetime.fromisoformat(p["expiresAt"]) if p.get("expiresAt") else None,
    )
    db.session.add(ann)
    db.session.commit()
    return jsonify({"id": ann.id}), 201


@admin_bp.put("/announcements/<announcement_id>")
@role_required("admin")
def update_announcement(announcement_id: str):
    ann = db.session.get(Announcement, announcement_id)
    if not ann:
        return jsonify({"error": "not_found"}), 404
    p = request.get_json(silent=True) or {}
    mapping = [("title", "title"), ("content", "content"), ("type", "type"), ("targetRole", "target_role"), ("pinned", "pinned")]
    for src, dest in mapping:
        if src in p:
            setattr(ann, dest, p[src])
    if "expiresAt" in p:
        ann.expires_at = datetime.fromisoformat(p["expiresAt"]) if p["expiresAt"] else None
    db.session.commit()
    return jsonify({"updated": True}), 200


@admin_bp.delete("/announcements/<announcement_id>")
@role_required("admin")
def delete_announcement(announcement_id: str):
    ann = db.session.get(Announcement, announcement_id)
    if not ann:
        return jsonify({"error": "not_found"}), 404
    db.session.delete(ann)
    db.session.commit()
    return jsonify({"deleted": True}), 200


@admin_bp.get("/support-tickets")
@role_required("admin")
def list_support_tickets():
    status = request.args.get("status")
    q = SupportTicket.query
    if status:
        q = q.filter_by(status=status)
    rows = q.order_by(SupportTicket.created_at.desc()).all()
    return jsonify(
        {
            "tickets": [
                {
                    "id": t.id,
                    "userId": t.user_id,
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
    )


@admin_bp.put("/support-tickets/<ticket_id>")
@role_required("admin")
def update_support_ticket(ticket_id: str):
    t = db.session.get(SupportTicket, ticket_id)
    if not t:
        return jsonify({"error": "not_found"}), 404
    p = request.get_json(silent=True) or {}
    if "status" in p:
        t.status = p["status"]
    if "response" in p:
        t.response = p["response"]
        t.responded_at = utcnow()
    db.session.commit()
    return jsonify({"updated": True}), 200
