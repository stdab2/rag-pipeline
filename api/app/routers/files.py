import asyncio

from fastapi import APIRouter, UploadFile
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/files", tags=["files"])


@router.get("/")
async def get_files():
    return {"message": "Here are the files"}


@router.post("/uploadfile")
async def upload_files(file: UploadFile):
    async def generate():
        yield 'data: {"progress": 10, "stage": "parsing"}\n\n'
        await parse_document(file)

        yield 'data: {"progress": 50, "stage": "embedding"}\n\n'
        await embed_chunks(file)

        yield 'data: {"progress": 90, "stage": "indexing"}\n\n'
        await index_vectors(file)

        yield 'data: {"progress": 100, "stage": "done"}\n\n'

    return StreamingResponse(generate(), media_type="text/event-stream")


async def parse_document(file: UploadFile):
    await asyncio.sleep(1)


async def embed_chunks(file: UploadFile):
    await asyncio.sleep(1)


async def index_vectors(file: UploadFile):
    await asyncio.sleep(2)
