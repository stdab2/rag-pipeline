# RAG Pipeline

A small retrieval-augmented generation app: upload documents, they get chunked and embedded into a vector store, and you can ask questions that get answered using only what's in those documents (with the source file cited).

See [LIMITATIONS.md](./LIMITATIONS.md) for what's still rough or missing.

## How it works

1. **Upload** — a PDF is saved to disk, split into chunks with `RecursiveCharacterTextSplitter`, embedded with OpenAI's embedding model, and stored in Postgres via `pgvector`. Each chunk is tagged with metadata (file name, file id, content type) so retrieval can be scoped to specific files.
2. **Chat** — your question is rewritten into a cleaner search query, used to run a similarity search against the selected files, and the retrieved chunks are passed to `gpt-4o` as context. The system prompt forces the model to answer only from that context and to say so when it can't.
3. Both the user message and the AI's reply are persisted, so a chat has history.

## Stack

**Backend** — FastAPI, SQLAlchemy (async) + Alembic, PostgreSQL with the `pgvector` extension, LangChain for chunking/embeddings/vector store, OpenAI for embeddings and chat completions. Dependencies managed with `uv`.

**Frontend** — React + TypeScript, Vite, Tailwind, React Router.

**Infra** — Docker Compose wires up the database, API, and web app together for local development.

## Running it

You'll need an OpenAI API key.

```bash
git clone https://github.com/stdab2/rag-pipeline.git
cd rag-pipeline
```

Create `api/.env`:

```env
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/pg_db
RAG_PIPELINE_POSTGRES_DB_URL=postgresql+asyncpg://postgres:postgres@db:5432/pg_db
RAG_PIPELINE_OPENAI_API_KEY=sk-...
RAG_PIPELINE_EMBEDDING_MODEL=text-embedding-3-small
```

`DATABASE_URL` is read by Alembic when running migrations, `RAG_PIPELINE_POSTGRES_DB_URL` is what the app itself connects with — they should point at the same database.

Create `web/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Then:

```bash
docker compose up --build
```

This starts Postgres (with pgvector), runs the Alembic migrations, and starts the API on `:8000` and the web app on `:5173`.

## Project structure

```
api/
  app/
    models/        SQLAlchemy models (Chat, Message, File)
    schemas/        Pydantic request/response schemas
    repositories/    DB access
    services/        business logic (file ingestion, chat, OpenAI calls)
    routers/         FastAPI route handlers
    context.py       app-wide dependency wiring (engine, vector store, services)
  alembic/           DB migrations

web/
  src/
    pages/           Upload, Files, Chat
    components/      shared UI pieces
```

## API

| Method | Route                        | Description                                        |
|--------|-------------------------------|-----------------------------------------------------|
| POST   | `/files/uploadfile`           | Upload a file, chunk + embed it (SSE progress)       |
| GET    | `/files`                      | List uploaded files                                  |
| DELETE | `/files`                      | Delete files (DB row, embeddings, and the file on disk) |
| POST   | `/files/{file_id}/reindex`    | Re-chunk and re-embed a file that's already on disk  |
| POST   | `/chat/message`               | Send a message, get an AI answer back               |
| GET    | `/chat/{chat_id}/messages`    | Get a chat's message history                        |
