import asyncio

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.services.file_service import save_file

router = APIRouter(prefix="/files", tags=["files"])


@router.get("/")
async def get_files():
    return {"message": "Here are the files"}


@router.post("/uploadfile")
async def upload_files(
    session: AsyncSession = Depends(get_session), file: UploadFile = File(...)
):
    async def generate():
        yield 'data: {"progress": 10, "stage": "waiting"}\n\n'
        await wait()

        yield 'data: {"progress": 90, "stage": "saving file"}\n\n'
        await save_file(session, file)

        yield 'data: {"progress": 100, "stage": "done"}\n\n'

    return StreamingResponse(generate(), media_type="text/event-stream")


async def wait():
    await asyncio.sleep(2)
