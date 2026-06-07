from langchain_openai import OpenAIEmbeddings
from langchain_postgres import PGVector
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.ext.asyncio import create_async_engine

from app.repositories.file_repository import FileRepository
from app.repositories.message_repository import MessageRepository
from app.services.ai_service import AIService
from app.services.chat_service import ChatService
from app.services.file_service import FileService


class Settings(BaseSettings):
    POSTGRES_DB_URL: str
    OPENAI_API_KEY: str
    EMBEDDING_MODEL: str
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    VECTOR_STORE_COLLECTION_NAME: str = "file_embeddings"
    DEBUG: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="RAG_PIPELINE_",
        extra="ignore",
    )


class Context:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.engine = create_async_engine(
            self.settings.POSTGRES_DB_URL, echo=self.settings.DEBUG
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.settings.CHUNK_SIZE,
            chunk_overlap=self.settings.CHUNK_OVERLAP,
            add_start_index=True,
        )
        self.embeddings = OpenAIEmbeddings(
            model=self.settings.EMBEDDING_MODEL,
            openai_api_key=self.settings.OPENAI_API_KEY,
        )
        self.vector_store = PGVector(
            connection=self.settings.POSTGRES_DB_URL,
            collection_name=self.settings.VECTOR_STORE_COLLECTION_NAME,
            embeddings=self.embeddings,
            async_mode=True,
            use_jsonb=True,  # For metadata storage
            create_extension=False,
        )
        self.file_repository = FileRepository()
        self.message_repository = MessageRepository()
        self.file_service = FileService(
            self.vector_store, self.text_splitter, self.file_repository
        )
        self.ai_service = AIService(openai_api_key=self.settings.OPENAI_API_KEY)
        self.chat_service = ChatService(
            self.message_repository, self.file_service, self.ai_service
        )


def create_context() -> Context:
    settings = Settings()
    return Context(settings)
