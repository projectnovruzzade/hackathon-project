import uuid

from app.extensions import db
from app.models import Event, Judge, JudgePermission, Participant, ScoreEntry, Team
from app.services.scoring import aggregate_scores_for_team_event
from app.utils.time import utcnow


def test_score_aggregation_normalizes_and_ignores_unpermitted(app):
    with app.app_context():
        participant = Participant(
            id=str(uuid.uuid4()),
            name="Captain",
            email="captain@example.com",
            avatar_color="violet",
            experience=3,
        )
        db.session.add(participant)

        event = Event(
            id=str(uuid.uuid4()),
            name="Test Event",
            type="hackathon",
            description="Test event description",
            start_date=utcnow(),
            end_date=utcnow(),
            registration_deadline=utcnow(),
            location="Baku",
            status="completed",
        )
        db.session.add(event)
        db.session.flush()

        team = Team(
            id=str(uuid.uuid4()),
            name="Team A",
            captain_id=participant.id,
            event_id=event.id,
            event_type="hackathon",
            status="completed",
            chemistry_score=80,
        )
        db.session.add(team)

        judge_1 = Judge(
            id=str(uuid.uuid4()),
            name="Judge 1",
            email="judge1@example.com",
            avatar_color="cyan",
            specialization="Industry Expert",
        )
        judge_2 = Judge(
            id=str(uuid.uuid4()),
            name="Judge 2",
            email="judge2@example.com",
            avatar_color="cyan",
            specialization="Academic",
        )
        db.session.add(judge_1)
        db.session.add(judge_2)
        db.session.flush()

        # Judge 1: technical max 50, innovation max 50.
        db.session.add(JudgePermission(judge_id=judge_1.id, criterion="technical", max_points=50))
        db.session.add(JudgePermission(judge_id=judge_1.id, criterion="innovation", max_points=50))
        # Judge 2: presentation max 30, teamwork max 30.
        db.session.add(JudgePermission(judge_id=judge_2.id, criterion="presentation", max_points=30))
        db.session.add(JudgePermission(judge_id=judge_2.id, criterion="teamwork", max_points=30))

        db.session.add(
            ScoreEntry(
                judge_id=judge_1.id,
                team_id=team.id,
                event_id=event.id,
                technical=40,      # normalized: 20
                presentation=None,  # unpermitted
                innovation=30,     # normalized: 15
                teamwork=None,      # unpermitted
            )
        )
        db.session.add(
            ScoreEntry(
                judge_id=judge_2.id,
                team_id=team.id,
                event_id=event.id,
                technical=None,     # unpermitted
                presentation=24,    # normalized: 20
                innovation=None,     # unpermitted
                teamwork=18,        # normalized: 15
            )
        )
        db.session.commit()

        aggregated = aggregate_scores_for_team_event(team.id, event.id)
        assert aggregated["technical"] == 20.0
        assert aggregated["presentation"] == 20.0
        assert aggregated["innovation"] == 15.0
        assert aggregated["teamwork"] == 15.0
        assert aggregated["total"] == 70.0
        assert aggregated["judgeCount"] == 2
