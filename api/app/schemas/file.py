from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FileCreate(BaseModel):
    name: str = Field(..., max_length=55)
    content_type: str = Field(..., max_length=50)
    size: int = Field(..., gt=0)


class FileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    file_path: str
    created_at: datetime
    content_type: str
    size: int
