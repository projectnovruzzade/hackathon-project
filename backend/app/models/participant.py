from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from app.utils.time import utcnow


class Participant(db.Model):
    __tablename__ = "participants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    avatar_color: Mapped[str] = mapped_column(String(30), nullable=False, default="violet")
    experience: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    bio: Mapped[str | None] = mapped_column(Text)
    github: Mapped[str | None] = mapped_column(String(255))
    linkedin: Mapped[str | None] = mapped_column(String(255))
    cv_url: Mapped[str | None] = mapped_column(String(500))
    cv_uploaded_at: Mapped[datetime | None] = mapped_column(DateTime)
    university: Mapped[str | None] = mapped_column(String(120), index=True)
    graduation_year: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=utcnow, onupdate=utcnow
    )

    user = relationship("User", back_populates="participant_profile")
    skills = relationship("ParticipantSkill", back_populates="participant", cascade="all, delete-orphan")
    team_memberships = relationship("TeamMember", back_populates="participant", cascade="all, delete-orphan")
    support_tickets = relationship("SupportTicket", back_populates="participant")


class ParticipantSkill(db.Model):
    __tablename__ = "participant_skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    participant_id: Mapped[str] = mapped_column(
        ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    level: Mapped[str] = mapped_column(String(20), nullable=False)
    category: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(20), nullable=False, default="manual")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow)

    participant = relationship("Participant", back_populates="skills")
