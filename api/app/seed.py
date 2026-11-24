from sqlalchemy import select

from app.db import AsyncSessionLocal
from app.models import Chat as ChatModel


async def seed_data():
    id: str = "476b719c-ce11-4f98-b7fd-8ff91a9d5a42"
    title: str = "default_chat"
    messages = []

    db_chat = ChatModel(id=id, title=title, messages=messages)

    async with AsyncSessionLocal() as session:
        query = select(ChatModel).where(ChatModel.id == id)
        result = await session.execute(query)
        chat_exists = result.scalars().first()

        if not chat_exists:
            session.add(db_chat)
            await session.commit()
            await session.refresh(db_chat)
        else:
            print("CHAT ALREADY EXISTS")
