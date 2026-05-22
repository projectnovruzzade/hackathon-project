from collections import Counter, defaultdict

from flask import Blueprint, jsonify, request

from app.auth import role_required
from app.models import Event, Judge, Participant, ParticipantSkill, ScoreEntry, SupportTicket, Team
from app.services.scoring import CRITERIA, aggregate_scores_for_team_event

reports_bp = Blueprint("reports", __name__, url_prefix="/api/admin/reports")


@reports_bp.get("/dashboard")
@role_required("admin")
def dashboard_summary():
    participants_total = Participant.query.count()
    teams_active = Team.query.filter(Team.status.in_(["active", "competing", "forming"])).count()
    events_this_year = Event.query.count()
    judges_total = Judge.query.count()
    open_support = SupportTicket.query.filter(SupportTicket.status != "resolved").count()

    chemistry_rows = Team.query.all()
    avg_chemistry = (
        round(sum(t.chemistry_score for t in chemistry_rows) / len(chemistry_rows), 2)
        if chemistry_rows
        else 0.0
    )

    return jsonify(
        {
            "totalParticipants": participants_total,
            "activeTeams": teams_active,
            "eventsThisYear": events_this_year,
            "avgChemistryScore": avg_chemistry,
            "totalJudges": judges_total,
            "openSupportTickets": open_support,
        }
    )


@reports_bp.get("/score-aggregate")
@role_required("admin")
def score_aggregate():
    team_id = request.args.get("teamId")
    event_id = request.args.get("eventId")
    if not team_id or not event_id:
        return jsonify({"error": "bad_request", "message": "teamId and eventId are required"}), 400
    return jsonify({"aggregate": aggregate_scores_for_team_event(team_id, event_id)}), 200


@reports_bp.get("/team-performance")
@role_required("admin")
def team_performance_report():
    event_id = request.args.get("eventId")
    query = Team.query
    if event_id:
        query = query.filter_by(event_id=event_id)
    teams = query.all()

    rows = []
    for team in teams:
        if not team.event_id:
            continue
        agg = aggregate_scores_for_team_event(team.id, team.event_id)
        rows.append(
            {
                "teamId": team.id,
                "teamName": team.name,
                "eventId": team.event_id,
                "eventType": team.event_type,
                "chemistryScore": team.chemistry_score,
                "aggregatedScores": {
                    "technical": agg["technical"],
                    "presentation": agg["presentation"],
                    "innovation": agg["innovation"],
                    "teamwork": agg["teamwork"],
                    "total": agg["total"],
                },
            }
        )

    rows.sort(key=lambda x: x["aggregatedScores"]["total"], reverse=True)
    for idx, row in enumerate(rows, start=1):
        row["rank"] = idx

    return jsonify({"rows": rows}), 200


@reports_bp.get("/participant-skills")
@role_required("admin")
def participant_skills_report():
    event_id = request.args.get("eventId")
    teams = Team.query.filter_by(event_id=event_id).all() if event_id else Team.query.all()
    participant_ids = {m.participant_id for t in teams for m in t.members} if event_id else None

    skill_query = ParticipantSkill.query
    if participant_ids is not None:
        if not participant_ids:
            return jsonify({"categoryDistribution": {}, "topSkills": [], "experienceDistribution": {}}), 200
        skill_query = skill_query.filter(ParticipantSkill.participant_id.in_(participant_ids))
    skills = skill_query.all()

    category_counter = Counter([s.category for s in skills])
    top_skills = Counter([s.name for s in skills]).most_common(10)

    participants_query = Participant.query
    if participant_ids is not None:
        participants_query = participants_query.filter(Participant.id.in_(participant_ids))
    participants = participants_query.all()

    exp_bins = {"0-1": 0, "1-3": 0, "3-5": 0, "5+": 0}
    for p in participants:
        if p.experience <= 1:
            exp_bins["0-1"] += 1
        elif p.experience <= 3:
            exp_bins["1-3"] += 1
        elif p.experience <= 5:
            exp_bins["3-5"] += 1
        else:
            exp_bins["5+"] += 1

    return jsonify(
        {
            "categoryDistribution": dict(category_counter),
            "topSkills": [{"name": name, "count": count} for name, count in top_skills],
            "experienceDistribution": exp_bins,
        }
    )


@reports_bp.get("/judge-activity")
@role_required("admin")
def judge_activity_report():
    judges = Judge.query.all()
    entries = ScoreEntry.query.all()
    by_judge = defaultdict(list)
    for e in entries:
        by_judge[e.judge_id].append(e)

    rows = []
    for j in judges:
        judge_entries = by_judge.get(j.id, [])
        criteria_values = {c: [] for c in CRITERIA}
        for entry in judge_entries:
            for c in CRITERIA:
                v = getattr(entry, c)
                if v is not None:
                    criteria_values[c].append(v)

        avg_by_criteria = {
            c: round(sum(vals) / len(vals), 2) if vals else None
            for c, vals in criteria_values.items()
        }
        rows.append(
            {
                "judgeId": j.id,
                "name": j.name,
                "submittedCount": len(judge_entries),
                "totalReviews": j.total_reviews,
                "avgScoresByCriteria": avg_by_criteria,
                "permissions": [{"criterion": p.criterion, "maxPoints": p.max_points} for p in j.permissions],
            }
        )

    return jsonify({"rows": rows}), 200


@reports_bp.get("/event-summary")
@role_required("admin")
def event_summary_report():
    events = Event.query.order_by(Event.start_date.asc()).all()
    rows = []
    for event in events:
        teams = event.teams
        participant_count = sum(len(team.members) for team in teams)
        completed = sum(1 for t in teams if t.status == "completed")

        formation_times = []
        for team in teams:
            if team.created_at and event.registration_deadline:
                delta = (team.created_at - event.registration_deadline).days
                formation_times.append(delta)
        avg_formation = round(sum(formation_times) / len(formation_times), 2) if formation_times else None

        rows.append(
            {
                "eventId": event.id,
                "name": event.name,
                "type": event.type,
                "status": event.status,
                "teamCount": len(teams),
                "participantCount": participant_count,
                "completedTeams": completed,
                "avgTeamFormationDeltaDays": avg_formation,
            }
        )
    return jsonify({"rows": rows}), 200
