from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.errors import ErrorCode, NotFoundError
from app.models.chat import Chat as ChatModel


class ChatRepository:
    async def ensure_exists(self, session: AsyncSession, chat_id: UUID) -> None:
        if await session.get(ChatModel, chat_id) is None:
            raise NotFoundError(ErrorCode.CHAT_NOT_FOUND, "Chat not found")
