from datetime import timedelta

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash

from app.auth import role_required
from app.extensions import db
from app.models import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _serialize_user(user: User):
    display_name = (
        "Shamsi Bayramzadeh"
        if user.role == "admin" and user.email == "admin@teamforge.az"
        else user.name
    )
    return {
        "id": user.id,
        "name": display_name,
        "email": user.email,
        "role": user.role,
        "avatarColor": user.avatar_color,
    }


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    email = payload.get("email", "").strip().lower()
    password = payload.get("password", "")

    if not email or not password:
        return jsonify({"error": "bad_request", "message": "email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "invalid_credentials", "message": "Invalid email or password"}), 401

    if user.role == "admin" and user.email == "admin@teamforge.az" and user.name != "Shamsi Bayramzadeh":
        user.name = "Shamsi Bayramzadeh"
        db.session.commit()

    token = create_access_token(
        identity=user.id,
        additional_claims={"role": user.role, "email": user.email},
        expires_delta=timedelta(hours=12),
    )
    return jsonify({"accessToken": token, "user": _serialize_user(user)}), 200


@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "not_found", "message": "User not found"}), 404
    return jsonify({"user": _serialize_user(user)}), 200


@auth_bp.get("/admin-only")
@role_required("admin")
def admin_only():
    return jsonify({"ok": True, "message": "Admin access granted"}), 200


@auth_bp.get("/student-only")
@role_required("student")
def student_only():
    return jsonify({"ok": True, "message": "Student access granted"}), 200
