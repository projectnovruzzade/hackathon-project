from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from app.utils.time import utcnow


class Judge(db.Model):
    __tablename__ = "judges"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    avatar_color: Mapped[str] = mapped_column(String(30), nullable=False, default="cyan")
    specialization: Mapped[str] = mapped_column(String(60), nullable=False)
    bio: Mapped[str | None] = mapped_column(Text)
    total_reviews: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=utcnow, onupdate=utcnow
    )

    permissions = relationship("JudgePermission", back_populates="judge", cascade="all, delete-orphan")
    event_assignments = relationship(
        "JudgeEventAssignment", back_populates="judge", cascade="all, delete-orphan"
    )
    scores = relationship("ScoreEntry", back_populates="judge")


class JudgePermission(db.Model):
    __tablename__ = "judge_permissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    judge_id: Mapped[str] = mapped_column(ForeignKey("judges.id", ondelete="CASCADE"), nullable=False, index=True)
    criterion: Mapped[str] = mapped_column(String(30), nullable=False)
    max_points: Mapped[int] = mapped_column(Integer, nullable=False, default=25)

    judge = relationship("Judge", back_populates="permissions")


class JudgeEventAssignment(db.Model):
    __tablename__ = "judge_event_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    judge_id: Mapped[str] = mapped_column(ForeignKey("judges.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id: Mapped[str] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow)

    judge = relationship("Judge", back_populates="event_assignments")
    event = relationship("Event", back_populates="judge_assignments")
