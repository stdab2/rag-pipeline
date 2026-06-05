from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ChatCreate(BaseModel):
    pass


class ChatRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
