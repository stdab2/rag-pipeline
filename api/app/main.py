from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import engine
from app.routers import chat, file
from app.seed import seed_data

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("SEEDING DATA")
    await seed_data()
    print("DATA SEEDED")

    yield
    print("SHUTTING DOWN")
    await engine.dispose()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CLIENT_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(file.router)
app.include_router(chat.router)


@app.get("/")
async def root():
    return {"message": "hello"}
