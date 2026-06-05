from fastapi import APIRouter, File, UploadFile
from fastapi.responses import StreamingResponse

from app.dependencies import FileServiceDependency, SessionDependency
from app.schemas.file import FileRead

router = APIRouter(prefix="/files", tags=["files"])


@router.get("")
async def get_files(
    session: SessionDependency, file_service: FileServiceDependency
) -> list[FileRead]:
    files = await file_service.get_files(session)
    return files


@router.post("/uploadfile")
async def upload_files(
    session: SessionDependency,
    file_service: FileServiceDependency,
    file: UploadFile = File(...),
):
    async def generate():
        yield 'data: {"progress": 50, "stage": "saving file"}\n\n'
        await file_service.save_file(session, file)
        yield 'data: {"progress": 100, "stage": "done"}\n\n'

    return StreamingResponse(generate(), media_type="text/event-stream")
