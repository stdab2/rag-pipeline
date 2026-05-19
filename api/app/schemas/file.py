from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FileCreate(BaseModel):
    name: str = Field(..., max_length=255)


class FileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    file_path: str
    created_at: datetime
