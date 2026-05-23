from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import File as FileModel
from app.schemas.file import FileCreate


class FileRepository:
    async def save_file(
        self, session: AsyncSession, file_info: FileCreate, file_path: str
    ) -> FileModel:
        db_file = FileModel(
            name=file_info.name,
            file_path=file_path,
            content_type=file_info.content_type,
            size=file_info.size,
        )
        session.add(db_file)
        await session.commit()
        await session.refresh(db_file)
        return db_file
