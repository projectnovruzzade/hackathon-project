from flask import Flask, jsonify

try:
    from flasgger import Swagger
except ModuleNotFoundError:  # Optional dependency in local/dev environments
    Swagger = None

from config import Config

from .extensions import cors, db, jwt, migrate
from .models import (
    Announcement,
    AnnouncementRead,
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
    User,
)
from .routes.auth import auth_bp
from .routes.admin import admin_bp
from .routes.health import health_bp
from .routes.reports import reports_bp
from .routes.student import student_bp
from .seed import register_seed_commands
from .swagger import SWAGGER_CONFIG, build_swagger_template


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(reports_bp)
    register_seed_commands(app)
    if Swagger is not None:
        Swagger(app, config=SWAGGER_CONFIG, template=build_swagger_template(app))
    else:
        app.logger.warning("flasgger is not installed; Swagger docs are disabled.")

    @jwt.unauthorized_loader
    def unauthorized_callback(_err):
        return jsonify({"error": "unauthorized", "message": "Missing or invalid token"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(_err):
        return jsonify({"error": "invalid_token", "message": "Token is invalid"}), 401

    @jwt.expired_token_loader
    def expired_token_callback(_header, _payload):
        return jsonify({"error": "token_expired", "message": "Token has expired"}), 401

    @app.errorhandler(ValueError)
    def handle_value_error(exc):
        details = exc.args[0] if exc.args else "Invalid request payload"
        return jsonify({"error": "validation_error", "message": "Validation failed", "details": details}), 400

    @app.errorhandler(404)
    def not_found(_exc):
        return jsonify({"error": "not_found", "message": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(_exc):
        return jsonify({"error": "internal_server_error", "message": "Unexpected server error"}), 500

    @app.get("/")
    def root():
        return jsonify({"message": "Joint Holbies Backend"}), 200

    return app
