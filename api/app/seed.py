import os
from dotenv import load_dotenv
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy import select

from app.models.chat import Chat as ChatModel

load_dotenv()

async def seed_data():
    id: str = "476b719c-ce11-4f98-b7fd-8ff91a9d5a42"
    title: str = "default_chat"
    messages = []

    db_chat = ChatModel(
        id=id,
        title=title,
        messages=messages
    )

    engine = create_async_engine(os.environ["RAG_PIPELINE_POSTGRES_DB_URL"], echo=False)
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

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
