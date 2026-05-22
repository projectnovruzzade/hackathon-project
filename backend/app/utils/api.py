from flask import jsonify


def ok(data=None, status=200, **extra):
    payload = {}
    if isinstance(data, dict):
        payload.update(data)
    elif data is not None:
        payload["data"] = data
    payload.update(extra)
    return jsonify(payload), status


def err(code: str, message: str, status: int = 400, **extra):
    payload = {"error": code, "message": message}
    payload.update(extra)
    return jsonify(payload), status

