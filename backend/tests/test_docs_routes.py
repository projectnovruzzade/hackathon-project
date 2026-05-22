def test_swagger_ui_and_spec_are_served(client):
    ui = client.get("/apidocs/")
    assert ui.status_code == 200
    assert b"swagger-ui" in ui.data.lower() or b"swagger" in ui.data.lower()

    spec = client.get("/apispec.json")
    assert spec.status_code == 200

    body = spec.get_json()
    assert body["info"]["title"] == "TeamForge AI Backend API"
    assert "/api/health" in body["paths"]
    assert "/api/auth/login" in body["paths"]
    assert "/api/admin/participants" in body["paths"]
    assert "get" in body["paths"]["/api/admin/participants"]
    assert "post" in body["paths"]["/api/admin/participants"]
