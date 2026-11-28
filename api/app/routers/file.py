from uuid import UUID

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import StreamingResponse

from app.dependencies import FileServiceDependency, SessionDependency
from app.errors import ErrorResponse, sse_error_event
from app.schemas.file import FileRead, FilesDelete

router = APIRouter(
    prefix="/files",
    tags=["files"],
    responses={
        422: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)


@router.get("")
async def get_files(
    session: SessionDependency, file_service: FileServiceDependency
) -> list[FileRead]:
    files = await file_service.get_files(session)
    return files


@router.post(
    "/uploadfile",
    responses={
        400: {"model": ErrorResponse},
        415: {"model": ErrorResponse},
    },
)
async def upload_files(
    session: SessionDependency,
    file_service: FileServiceDependency,
    uploaded_file: UploadFile = File(...),
):
    file_service.validate_upload(uploaded_file)

    async def generate():
        try:
            yield 'data: {"progress": 10, "stage": "uploading"}\n\n'

            file = await file_service.save_file(session, uploaded_file)
            yield 'data: {"progress": 40, "stage": "saving file"}\n\n'

            await file_service._generate_and_save_documents(
                uploaded_file.content_type, file.file_path, file
            )
            yield 'data: {"progress": 100, "stage": "done"}\n\n'
        except Exception as exc:
            yield sse_error_event(exc)

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.delete("")
async def delete_files(
    session: SessionDependency,
    file_service: FileServiceDependency,
    files_delete: FilesDelete,
):
    await file_service.delete_files(session, files_delete)


@router.post(
    "/{file_id}/reindex",
    responses={
        404: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
    },
)
async def reindex_file(
    session: SessionDependency,
    file_service: FileServiceDependency,
    file_id: UUID,
):
    await file_service.reindex_file(session, file_id)
