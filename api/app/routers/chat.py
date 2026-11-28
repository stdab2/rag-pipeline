from uuid import UUID

from fastapi import APIRouter

from app.dependencies import ChatServiceDependency, SessionDependency
from app.errors import ErrorResponse
from app.schemas.message import MessageCreate, MessageRead

router = APIRouter(
    prefix="/chat",
    tags=["chat"],
    responses={
        404: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)


@router.post("/message", responses={502: {"model": ErrorResponse}})
async def send_message(
    session: SessionDependency,
    chat_service: ChatServiceDependency,
    message_data: MessageCreate,
) -> dict:
    response = await chat_service.get_ai_response(session, message_data)
    return response


@router.get("/{chat_id}/messages")
async def get_messages_by_chat_id(
    session: SessionDependency, chat_service: ChatServiceDependency, chat_id: UUID
) -> list[MessageRead]:
    messages = await chat_service.get_messages_by_chat_id(session, chat_id)
    return messages
