from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from app.utils.time import utcnow


class Event(db.Model):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(180), nullable=False, unique=True, index=True)
    type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    registration_deadline: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    location: Mapped[str] = mapped_column(String(180), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    prize: Mapped[str | None] = mapped_column(String(120))
    cover_color: Mapped[str | None] = mapped_column(String(120))
    max_team_size: Mapped[int | None] = mapped_column(Integer)
    max_participants: Mapped[int | None] = mapped_column(Integer)
    team_building_method: Mapped[str | None] = mapped_column(String(30))
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=utcnow, onupdate=utcnow
    )

    teams = relationship("Team", back_populates="event")
    judge_assignments = relationship(
        "JudgeEventAssignment", back_populates="event", cascade="all, delete-orphan"
    )
    scores = relationship("ScoreEntry", back_populates="event")
