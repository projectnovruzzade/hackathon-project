import uuid
from pathlib import Path
import sys

import pytest
from werkzeug.security import generate_password_hash

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import create_app
from app.extensions import db
from app.models import Participant, User


class TestConfig:
    TESTING = True
    SECRET_KEY = "test-secret-key-with-32-plus-chars"
    JWT_SECRET_KEY = "test-jwt-secret-key-with-32-plus-chars"
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False


@pytest.fixture()
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def seed_users(app):
    with app.app_context():
        admin = User(
            id=str(uuid.uuid4()),
            name="Admin",
            email="admin@teamforge.az",
            password_hash=generate_password_hash("password"),
            role="admin",
            avatar_color="cyan",
        )
        student = User(
            id=str(uuid.uuid4()),
            name="Student",
            email="student@teamforge.az",
            password_hash=generate_password_hash("password"),
            role="student",
            avatar_color="violet",
        )
        db.session.add(admin)
        db.session.add(student)
        db.session.flush()

        participant = Participant(
            id=str(uuid.uuid4()),
            user_id=student.id,
            name="Student",
            email="student@teamforge.az",
            avatar_color="violet",
            experience=2,
            university="ADA University",
        )
        db.session.add(participant)
        db.session.commit()

        return {"admin": admin, "student": student, "participant": participant}
