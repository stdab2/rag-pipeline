FROM python:3.14-slim

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

ENV UV_PYTHON_DOWNLOADS=never \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    PYTHONDONTWRITEBYTECODE=1

COPY pyproject.toml uv.lock .python-version ./

RUN uv sync --frozen --no-cache

COPY . .

CMD ["uv", "run", "fastapi", "dev", "app/main.py", "--host", "0.0.0.0"]