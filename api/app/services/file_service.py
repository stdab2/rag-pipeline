from pathlib import Path

import aiofiles
from fastapi import UploadFile
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
from langchain_postgres import PGVector
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import File as FileModel
from app.repositories.file_repository import FileRepository
from app.schemas.file import FileCreate


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

        documents = self.__convert_to_documents(file_path)
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

    def __convert_to_documents(self, file_path: Path) -> list[Document]:
        loader = PyPDFLoader(str(file_path))
        documents = loader.load()

        return documents
