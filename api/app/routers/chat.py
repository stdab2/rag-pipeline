from fastapi import APIRouter

from app.dependencies import SessionDependency

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("")
async def send_message(session: SessionDependency, chat_id: str, message: str):
    pass
