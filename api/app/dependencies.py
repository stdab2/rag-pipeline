from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.context import create_context
from app.services.ai_service import AIService
from app.services.chat_service import ChatService
from app.services.file_service import FileService

context = create_context()

AsyncSessionLocal = async_sessionmaker(context.engine, expire_on_commit=False)


async def get_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session


def get_file_service() -> FileService:
    return context.file_service


def get_ai_service() -> AIService:
    return context.ai_service


def get_chat_service() -> ChatService:
    return context.chat_service


SessionDependency = Annotated[AsyncSession, Depends(get_session)]
FileServiceDependency = Annotated[FileService, Depends(get_file_service)]
AIServiceDependency = Annotated[AIService, Depends(get_ai_service)]
ChatServiceDependency = Annotated[ChatService, Depends(get_chat_service)]

__all__ = [
    "SessionDependency",
    "FileServiceDependency",
    "AIServiceDependency",
    "ChatServiceDependency",
]
