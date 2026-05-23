from abc import ABC, abstractmethod

from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document


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
    def get_converter(content_type: str) -> FileToDocumentsConversion:
        conversion_class = FileToDocumentsConversionFactory.conversions.get(
            content_type
        )
        if not conversion_class:
            raise ValueError(f"Unsupported content type: {content_type}")

        return conversion_class()
