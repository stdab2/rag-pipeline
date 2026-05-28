from datetime import datetime, timezone
from uuid import UUID, uuid4
from enum import Enum

from sqlalchemy import DateTime, String, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Role(Enum):
    ASSISTANT = "assistant"
    USER = "user"


class Message(Base):
    __tablename__ = "message"

    id: Mapped[UUID] = mapped_column(default=uuid4, primary_key=True)
    chat_id: Mapped[UUID] = mapped_column(ForeignKey("chat.id"))
    chat: Mapped["Chat"] = relationship(back_populates="messages")
    role: Mapped[Role] = mapped_column()
    content: Mapped[String] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )