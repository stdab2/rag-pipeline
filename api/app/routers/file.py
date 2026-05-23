import asyncio

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import StreamingResponse

from app.dependencies import FileServiceDependency, SessionDependency

router = APIRouter(prefix="/files", tags=["files"])


@router.get("/")
async def get_files():
    return {"message": "Here are the files"}


@router.post("/uploadfile")
async def upload_files(
    session: SessionDependency,
    file_service: FileServiceDependency,
    file: UploadFile = File(...),
):
    async def generate():
        yield 'data: {"progress": 50, "stage": "waiting"}\n\n'
        await wait()

        yield 'data: {"progress": 90, "stage": "saving file"}\n\n'
        await file_service.save_file(session, file)

        yield 'data: {"progress": 100, "stage": "done"}\n\n'

    return StreamingResponse(generate(), media_type="text/event-stream")


async def wait():
    await asyncio.sleep(2)
