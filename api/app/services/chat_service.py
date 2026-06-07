from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.message_repository import MessageRepository
from app.schemas.message import MessageCreate, MessageRead
from app.services.ai_service import AIService
from app.services.file_service import FileService


class ChatService:
    def __init__(
        self,
        message_repository: MessageRepository,
        file_service: FileService,
        ai_service: AIService,
    ):
        self.message_repository = message_repository
        self.file_service = file_service
        self.ai_service = ai_service

    async def get_ai_response(
        self, session: AsyncSession, message_data: MessageCreate
    ) -> dict:
        documents = await self.file_service.similarity_search(
            message_data.content, message_data.file_ids
        )
        answer = await self.ai_service.generate_response(
            message_data.content, documents
        )

        user_message: MessageRead = await self.message_repository.save_message(
            session, message_data
        )
        ai_response: MessageRead = await self.message_repository.save_message(
            session,
            MessageCreate(
                chat_id=message_data.chat_id,
                content=answer,
                role="assistant",
                file_ids=message_data.file_ids,
            ),
        )
        return {"user_message": user_message, "ai_response": ai_response}

    async def get_messages_by_chat_id(
        self, session: AsyncSession, chat_id: str
    ) -> list[MessageRead]:
        return await self.message_repository.get_messages_by_chat_id(session, chat_id)
