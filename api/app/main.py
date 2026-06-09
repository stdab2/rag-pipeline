import os

from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.seed import seed_data
from app.routers import chat, file

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("SEEDING DATA")
    await seed_data()
    print("DATA SEEDED")

    yield
    print("SHUTTING DOWN")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ["CLIENT_URL"]],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(file.router)
app.include_router(chat.router)


@app.get("/")
async def root():
    return {"message": "hello"}
