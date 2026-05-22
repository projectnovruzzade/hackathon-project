def _login(client, email, password):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def test_login_success_and_me(client, seed_users):
    res = _login(client, "student@teamforge.az", "password")
    assert res.status_code == 200
    body = res.get_json()
    assert "accessToken" in body
    token = body["accessToken"]

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    me_body = me.get_json()
    assert me_body["user"]["email"] == "student@teamforge.az"
    assert me_body["user"]["role"] == "student"


def test_role_guard_blocks_student_on_admin_only(client, seed_users):
    login = _login(client, "student@teamforge.az", "password")
    token = login.get_json()["accessToken"]
    res = client.get("/api/auth/admin-only", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403
    assert res.get_json()["error"] == "forbidden"


def test_student_profile_requires_auth_and_returns_data(client, seed_users):
    unauth = client.get("/api/student/profile")
    assert unauth.status_code == 401

    login = _login(client, "student@teamforge.az", "password")
    token = login.get_json()["accessToken"]
    res = client.get("/api/student/profile", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    body = res.get_json()
    assert body["participant"]["email"] == "student@teamforge.az"

