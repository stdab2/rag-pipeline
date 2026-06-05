from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.chat import Chat


class Role(Enum):
    ASSISTANT = "assistant"
    USER = "user"


class Message(Base):
    __tablename__ = "message"

    id: Mapped[UUID] = mapped_column(default=uuid4, primary_key=True)
    chat_id: Mapped[UUID] = mapped_column(ForeignKey("chat.id"))
    chat: Mapped["Chat"] = relationship(back_populates="messages")
    role: Mapped[Role] = mapped_column()
    content: Mapped[str] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
