from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    POSTGRES_DB_URL: str
    CLIENT_URL: str
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


@lru_cache
def get_settings() -> Settings:
    return Settings()
