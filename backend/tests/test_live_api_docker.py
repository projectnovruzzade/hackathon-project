import os
import subprocess
import time
import urllib.error
import urllib.request

import pytest


pytestmark = pytest.mark.integration


def _http_json(url: str, method="GET", token=None, payload=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = None
    if payload is not None:
        import json

        data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url=url, method=method, headers=headers, data=data)
    with urllib.request.urlopen(req, timeout=10) as resp:
        import json

        return resp.status, json.loads(resp.read().decode("utf-8"))


def _wait_for_health(base_url: str, timeout=60):
    start = time.time()
    while time.time() - start < timeout:
        try:
            status, body = _http_json(f"{base_url}/api/health")
            if status == 200 and body.get("status") == "ok":
                return
        except Exception:
            pass
        time.sleep(2)
    raise TimeoutError("API health check timed out")


@pytest.mark.skipif(os.getenv("RUN_DOCKER_INTEGRATION") != "1", reason="Set RUN_DOCKER_INTEGRATION=1 to run")
def test_live_docker_endpoints():
    compose_env = os.environ.copy()
    compose_env.setdefault("API_PORT", "5055")
    base_url = os.getenv("LIVE_API_BASE_URL", f"http://127.0.0.1:{compose_env['API_PORT']}")

    subprocess.run(["docker", "compose", "up", "-d", "--build"], cwd=".", check=True, env=compose_env)
    try:
        subprocess.run(
            [
                "docker",
                "compose",
                "exec",
                "-T",
                "api",
                "python",
                "-c",
                "from app import create_app; from app.extensions import db; app=create_app(); ctx=app.app_context(); ctx.push(); db.create_all()",
            ],
            cwd=".",
            check=True,
            env=compose_env,
        )
        subprocess.run(
            ["docker", "compose", "exec", "-T", "api", "flask", "--app", "manage:app", "seed"],
            cwd=".",
            check=True,
            env=compose_env,
        )

        _wait_for_health(base_url)

        _, login_body = _http_json(
            f"{base_url}/api/auth/login",
            method="POST",
            payload={"email": "student1@teamforge.az", "password": "password"},
        )
        token = login_body["accessToken"]

        status, me_body = _http_json(f"{base_url}/api/auth/me", token=token)
        assert status == 200
        assert me_body["user"]["role"] == "student"

        status, profile_body = _http_json(f"{base_url}/api/student/profile", token=token)
        assert status == 200
        assert profile_body["participant"]["email"] == "student1@teamforge.az"

        _, admin_login = _http_json(
            f"{base_url}/api/auth/login",
            method="POST",
            payload={"email": "admin@teamforge.az", "password": "password"},
        )
        admin_token = admin_login["accessToken"]
        status, participants_body = _http_json(f"{base_url}/api/admin/participants?page=1&perPage=5", token=admin_token)
        assert status == 200
        assert "participants" in participants_body
        assert "meta" in participants_body

        # Admin creates participant.
        _, created_participant = _http_json(
            f"{base_url}/api/admin/participants",
            method="POST",
            token=admin_token,
            payload={
                "name": "Live Test Participant",
                "email": "live.participant@example.com",
                "experience": 2,
                "university": "ADA University",
            },
        )
        created_participant_id = created_participant["id"]

        # Admin creates event.
        from datetime import UTC, datetime, timedelta

        now = datetime.now(UTC)
        _, created_event = _http_json(
            f"{base_url}/api/admin/events",
            method="POST",
            token=admin_token,
            payload={
                "name": "Live API Event",
                "type": "hackathon",
                "description": "Live API integration event for docker endpoint validation.",
                "startDate": (now + timedelta(days=7)).isoformat(),
                "endDate": (now + timedelta(days=9)).isoformat(),
                "registrationDeadline": (now + timedelta(days=5)).isoformat(),
                "location": "Baku",
                "status": "upcoming",
            },
        )
        created_event_id = created_event["id"]

        # Admin list events.
        status, events_body = _http_json(f"{base_url}/api/admin/events?page=1&perPage=10", token=admin_token)
        assert status == 200
        assert any(e["id"] == created_event_id for e in events_body["events"])

        # Admin creates team with participant and student1 participant.
        student_participant_id = participants_body["participants"][0]["id"]
        _, created_team = _http_json(
            f"{base_url}/api/admin/teams",
            method="POST",
            token=admin_token,
            payload={
                "name": "Live API Team",
                "captainId": student_participant_id,
                "eventId": created_event_id,
                "memberIds": [created_participant_id],
                "missingSkills": ["ml", "devops"],
            },
        )
        created_team_id = created_team["id"]

        status, teams_body = _http_json(f"{base_url}/api/admin/teams?eventId={created_event_id}", token=admin_token)
        assert status == 200
        assert any(t["id"] == created_team_id for t in teams_body["teams"])

        # Admin announcement CRUD.
        status, dashboard = _http_json(f"{base_url}/api/admin/reports/dashboard", token=admin_token)
        assert status == 200
        assert "totalParticipants" in dashboard

        _, new_announcement = _http_json(
            f"{base_url}/api/admin/announcements",
            method="POST",
            token=admin_token,
            payload={
                "title": "Live Test Announcement",
                "content": "Announcement from live docker integration test.",
                "type": "general",
                "targetRole": "all",
                "authorId": admin_login["user"]["id"],
                "pinned": False,
            },
        )
        announcement_id = new_announcement["id"]

        status, ann_list = _http_json(f"{base_url}/api/admin/announcements", token=admin_token)
        assert status == 200
        assert any(a["id"] == announcement_id for a in ann_list["announcements"])

        # Student announcements + support flow.
        status, student_ann = _http_json(f"{base_url}/api/student/announcements", token=token)
        assert status == 200
        assert "announcements" in student_ann

        _, ticket = _http_json(
            f"{base_url}/api/student/support-tickets",
            method="POST",
            token=token,
            payload={"subject": "Technical Issue", "message": "Live integration ticket"},
        )
        ticket_id = ticket["id"]

        status, ticket_list = _http_json(f"{base_url}/api/admin/support-tickets", token=admin_token)
        assert status == 200
        assert any(t["id"] == ticket_id for t in ticket_list["tickets"])

        # Admin resolves ticket.
        status, update_ticket = _http_json(
            f"{base_url}/api/admin/support-tickets/{ticket_id}",
            method="PUT",
            token=admin_token,
            payload={"status": "resolved", "response": "Resolved in live test"},
        )
        assert status == 200
        assert update_ticket["updated"] is True

        # Reports endpoint checks.
        status, team_perf = _http_json(f"{base_url}/api/admin/reports/team-performance", token=admin_token)
        assert status == 200
        assert "rows" in team_perf

        status, skills_report = _http_json(f"{base_url}/api/admin/reports/participant-skills", token=admin_token)
        assert status == 200
        assert "categoryDistribution" in skills_report

        status, judge_report = _http_json(f"{base_url}/api/admin/reports/judge-activity", token=admin_token)
        assert status == 200
        assert "rows" in judge_report

        status, event_summary = _http_json(f"{base_url}/api/admin/reports/event-summary", token=admin_token)
        assert status == 200
        assert "rows" in event_summary
    finally:
        subprocess.run(["docker", "compose", "down", "-v"], cwd=".", env=compose_env)
