from datetime import datetime, timezone
from typing import TYPE_CHECKING, List
from uuid import UUID, uuid4

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.message import Message

if TYPE_CHECKING:
    from app.models.message import Message


class Chat(Base):
    __tablename__ = "chat"

    id: Mapped[UUID] = mapped_column(default=uuid4, primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    messages: Mapped[List["Message"]] = relationship(back_populates="chat")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
