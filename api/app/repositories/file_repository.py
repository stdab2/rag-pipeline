from uuid import UUID

from sqlalchemy import delete, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.errors import ErrorCode, NotFoundError
from app.models.file import File as FileModel
from app.schemas.file import FileCreate, FileRead, FilesDelete


class FileRepository:
    async def save_file(
        self, session: AsyncSession, file_info: FileCreate, file_path: str
    ) -> FileRead:
        db_file = FileModel(
            name=file_info.name,
            file_path=file_path,
            content_type=file_info.content_type,
            size=file_info.size,
        )
        session.add(db_file)
        await session.commit()
        await session.refresh(db_file)
        return FileRead.model_validate(db_file)

    async def get_all_files(self, session: AsyncSession) -> list[FileRead]:
        query = select(FileModel)
        result = await session.execute(query)
        files = result.scalars().all()
        return [FileRead.model_validate(file) for file in files]

    async def delete_files(self, session: AsyncSession, files_delete: FilesDelete):
        file_ids = [str(file_id) for file_id in files_delete.file_ids]
        query = delete(FileModel).where(FileModel.id.in_(file_ids))
        await session.execute(query)
        await session.execute(
            text("""
                DELETE FROM langchain_pg_embedding
                WHERE cmetadata->>'file_id' = ANY(:file_ids)
            """),
            {"file_ids": file_ids},
        )
        await session.commit()

    async def get_files(
        self, session: AsyncSession, files_delete: FilesDelete
    ) -> list[FileRead]:
        file_ids = [str(file_id) for file_id in files_delete.file_ids]
        query = select(FileModel).where(FileModel.id.in_(file_ids))
        result = await session.execute(query)
        files = result.scalars().all()
        return [FileRead.model_validate(file) for file in files]

    async def get_file(self, session: AsyncSession, file_id: UUID) -> FileRead:
        file = await session.get(FileModel, file_id)
        if file is None:
            raise NotFoundError(ErrorCode.FILE_NOT_FOUND, "File not found")
        return FileRead.model_validate(file)

    async def delete_documents_by_file_id(self, session: AsyncSession, file_id: UUID):
        await session.execute(
            text("""
                DELETE FROM langchain_pg_embedding
                WHERE cmetadata->>'file_id' = ANY(:file_ids)
            """),
            {"file_ids": [str(file_id)]},
        )
        await session.commit()
