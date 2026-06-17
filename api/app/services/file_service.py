from pathlib import Path

import aiofiles
from fastapi import UploadFile
from langchain_core.documents import Document
from langchain_postgres import PGVector
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import File as FileModel
from app.repositories.file_repository import FileRepository
from app.schemas.file import FileCreate, FileRead, FilesDelete
from app.services.to_documents_conversion import FileToDocumentsConversionFactory


class FileService:
    def __init__(
        self,
        vector_store: PGVector,
        text_splitter: RecursiveCharacterTextSplitter,
        file_repository: FileRepository,
    ):
        self.vector_store = vector_store
        self.text_splitter = text_splitter
        self.file_repository = file_repository

    async def save_file(self, session: AsyncSession, file: UploadFile) -> FileModel:
        UPLOAD_PATH = "uploads"
        UPLOAD_DIR = Path(UPLOAD_PATH)
        UPLOAD_DIR.mkdir(exist_ok=True)

        file_path = UPLOAD_DIR / file.filename
        content = await file.read()
        async with aiofiles.open(file_path, "wb") as buffer:
            await buffer.write(content)

        file_info = FileCreate(
            name=file.filename, content_type=file.content_type, size=file.size
        )
        file_model = await self.file_repository.save_file(
            session, file_info, str(file_path)
        )

        documents = FileToDocumentsConversionFactory.get_converter(
            file.content_type
        ).convert(str(file_path))
        all_splits = self.text_splitter.split_documents(documents)
        self.__add_metadata(all_splits, file_model)
        await self.vector_store.aadd_documents(all_splits)

        return file_model

    def __add_metadata(self, documents: list[Document], file: FileModel):
        for doc in documents:
            doc.metadata["file_name"] = file.name
            doc.metadata["file_id"] = str(file.id)
            doc.metadata["content_type"] = file.content_type
            doc.metadata["size"] = file.size

    async def get_files(self, session: AsyncSession) -> list[FileRead]:
        files = await self.file_repository.get_files(session)
        return files

    async def similarity_search(
        self, query: str, file_ids: list[str], top_k: int = 10
    ) -> list[Document]:
        documents_filter = None
        if file_ids:
            documents_filter = {
                "file_id": {"$in": [str(file_id) for file_id in file_ids]}
            }
        results = await self.vector_store.asimilarity_search(
            query, k=top_k, filter=documents_filter
        )
        return results

    async def delete_files(self, session: AsyncSession, files_delete: FilesDelete):
        await self.file_repository.delete_files(session, files_delete)
