import uuid

from app.extensions import db
from app.models import Event, Judge, JudgePermission, Participant, ScoreEntry, Team
from app.utils.time import utcnow


def _login(client, email, password):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    return res.get_json()["accessToken"]


def test_admin_participant_and_event_endpoints(client, seed_users):
    admin_token = _login(client, "admin@teamforge.az", "password")
    headers = {"Authorization": f"Bearer {admin_token}"}

    create_participant = client.post(
        "/api/admin/participants",
        headers=headers,
        json={"name": "Test User", "email": "testuser@example.com", "experience": 1},
    )
    assert create_participant.status_code == 201
    participant_id = create_participant.get_json()["id"]

    participants_list = client.get("/api/admin/participants?page=1&perPage=10", headers=headers)
    assert participants_list.status_code == 200
    body = participants_list.get_json()
    assert "participants" in body
    assert "meta" in body
    assert any(p["id"] == participant_id for p in body["participants"])

    create_event = client.post(
        "/api/admin/events",
        headers=headers,
        json={
            "name": "Route Test Event",
            "type": "hackathon",
            "description": "This is a valid description for test event route.",
            "startDate": utcnow().isoformat(),
            "endDate": utcnow().isoformat(),
            "registrationDeadline": utcnow().isoformat(),
            "location": "Baku",
            "status": "upcoming",
        },
    )
    assert create_event.status_code == 201

    events_list = client.get("/api/admin/events?page=1&perPage=10", headers=headers)
    assert events_list.status_code == 200
    ev_body = events_list.get_json()
    assert "events" in ev_body
    assert "meta" in ev_body
    assert any(e["name"] == "Route Test Event" for e in ev_body["events"])


def test_reports_score_aggregate_endpoint(client, app, seed_users):
    admin_token = _login(client, "admin@teamforge.az", "password")
    headers = {"Authorization": f"Bearer {admin_token}"}

    with app.app_context():
        participant = Participant(
            id=str(uuid.uuid4()),
            name="Captain 2",
            email="captain2@example.com",
            avatar_color="violet",
            experience=4,
        )
        db.session.add(participant)

        event = Event(
            id=str(uuid.uuid4()),
            name="Aggregate Event",
            type="hackathon",
            description="Aggregate event description test.",
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
            name="Aggregate Team",
            captain_id=participant.id,
            event_id=event.id,
            event_type="hackathon",
            status="completed",
            chemistry_score=75,
        )
        db.session.add(team)

        judge = Judge(
            id=str(uuid.uuid4()),
            name="Aggregate Judge",
            email="aggregate.judge@example.com",
            avatar_color="cyan",
            specialization="Industry Expert",
        )
        db.session.add(judge)
        db.session.flush()

        db.session.add(JudgePermission(judge_id=judge.id, criterion="technical", max_points=50))
        db.session.add(
            ScoreEntry(
                judge_id=judge.id,
                team_id=team.id,
                event_id=event.id,
                technical=40,  # -> normalized 20
            )
        )
        db.session.commit()
        team_id = team.id
        event_id = event.id

    res = client.get(
        f"/api/admin/reports/score-aggregate?teamId={team_id}&eventId={event_id}",
        headers=headers,
    )
    assert res.status_code == 200
    agg = res.get_json()["aggregate"]
    assert agg["technical"] == 20.0
    assert agg["total"] == 20.0
