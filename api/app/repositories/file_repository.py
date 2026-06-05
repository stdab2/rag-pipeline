from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import File as FileModel
from app.schemas.file import FileCreate, FileRead


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

    async def get_files(self, session: AsyncSession) -> list[FileRead]:
        query = select(FileModel)
        result = await session.execute(query)
        files = result.scalars().all()
        return [FileRead.model_validate(file) for file in files]
