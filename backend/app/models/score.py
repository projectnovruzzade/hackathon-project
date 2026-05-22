from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from app.utils.time import utcnow


class ScoreEntry(db.Model):
    __tablename__ = "score_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    judge_id: Mapped[str] = mapped_column(ForeignKey("judges.id"), nullable=False, index=True)
    team_id: Mapped[str] = mapped_column(ForeignKey("teams.id"), nullable=False, index=True)
    event_id: Mapped[str] = mapped_column(ForeignKey("events.id"), nullable=False, index=True)
    technical: Mapped[int | None] = mapped_column(Integer)
    presentation: Mapped[int | None] = mapped_column(Integer)
    innovation: Mapped[int | None] = mapped_column(Integer)
    teamwork: Mapped[int | None] = mapped_column(Integer)
    comment: Mapped[str | None] = mapped_column(Text)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow)

    judge = relationship("Judge", back_populates="scores")
    team = relationship("Team", back_populates="scores")
    event = relationship("Event", back_populates="scores")
