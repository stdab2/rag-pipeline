from abc import ABC, abstractmethod

from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document

from app.errors import ErrorCode, UnsupportedMediaTypeError


class FileToDocumentsConversion(ABC):
    @abstractmethod
    def convert(self, file_path: str) -> list[Document]:
        pass


class PDFToDocumentsConversion(FileToDocumentsConversion):
    def convert(self, file_path: str) -> list[Document]:
        loader = PyPDFLoader(file_path)
        documents = loader.load()

        return documents


class FileToDocumentsConversionFactory:
    conversions = {
        "application/pdf": PDFToDocumentsConversion,
    }

    @staticmethod
    def get_converter(content_type: str | None) -> FileToDocumentsConversion:
        conversion_class = FileToDocumentsConversionFactory.conversions.get(
            content_type
        )
        if not conversion_class:
            raise UnsupportedMediaTypeError(
                ErrorCode.UNSUPPORTED_FILE_TYPE,
                f"Unsupported file type: {content_type}",
            )

        return conversion_class()
