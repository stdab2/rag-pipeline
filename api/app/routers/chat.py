from fastapi import APIRouter

from app.dependencies import ChatServiceDependency, SessionDependency
from app.schemas.message import MessageCreate, MessageRead

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/message")
async def send_message(
    session: SessionDependency,
    chat_service: ChatServiceDependency,
    message_data: MessageCreate,
) -> dict:
    response = await chat_service.get_ai_response(session, message_data)
    return response


@router.get("/{chat_id}/messages")
async def get_messages_by_chat_id(
    session: SessionDependency, chat_service: ChatServiceDependency, chat_id: str
) -> list[MessageRead]:
    messages = await chat_service.get_messages_by_chat_id(session, chat_id)
    return messages
