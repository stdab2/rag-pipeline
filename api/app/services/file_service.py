from pathlib import Path

import aiofiles
from fastapi import File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import File as FileModel
from app.schemas.file import FileCreate


async def save_file(session: AsyncSession, file: UploadFile = File(...)):
    UPLOAD_PATH = "uploads"
    UPLOAD_DIR = Path(UPLOAD_PATH)
    UPLOAD_DIR.mkdir(exist_ok=True)

    file_path = UPLOAD_DIR / file.filename
    content = await file.read()
    async with aiofiles.open(file_path, "wb") as buffer:
        await buffer.write(content)

    file_data = FileCreate(name=file.filename)
    db_file = FileModel(name=file_data.name, file_path=str(file_path))

    session.add(db_file)
    await session.commit()
    await session.refresh(db_file)
