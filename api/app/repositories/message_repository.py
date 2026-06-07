from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message as MessageModel
from app.models.message import Role
from app.schemas.message import MessageCreate, MessageRead


class MessageRepository:
    async def save_message(
        self, session: AsyncSession, message_data: MessageCreate
    ) -> MessageModel:
        db_message = MessageModel(
            chat_id=message_data.chat_id,
            content=message_data.content,
            role=Role(message_data.role),
        )
        session.add(db_message)
        await session.commit()
        await session.refresh(db_message)
        return MessageRead.model_validate(db_message)

    async def get_messages_by_chat_id(
        self, session: AsyncSession, chat_id: str
    ) -> list[MessageRead]:
        query = (
            select(MessageModel)
            .where(MessageModel.chat_id == chat_id)
            .order_by(MessageModel.created_at)
        )
        result = await session.execute(query)
        messages = result.scalars().all()
        return [MessageRead.model_validate(message) for message in messages]
