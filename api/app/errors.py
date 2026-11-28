import logging
from enum import StrEnum
from typing import Any

import openai
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class ErrorCode(StrEnum):
    # Generic
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED"
    HTTP_ERROR = "HTTP_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    # Files
    FILE_NOT_FOUND = "FILE_NOT_FOUND"
    UNSUPPORTED_FILE_TYPE = "UNSUPPORTED_FILE_TYPE"
    INVALID_FILE_NAME = "INVALID_FILE_NAME"
    # Chat
    CHAT_NOT_FOUND = "CHAT_NOT_FOUND"
    # External services
    AI_PROVIDER_ERROR = "AI_PROVIDER_ERROR"


class ErrorBody(BaseModel):
    code: ErrorCode
    message: str
    details: dict[str, Any] | list[Any] | None = None


class ErrorResponse(BaseModel):
    error: ErrorBody


class AppError(Exception):
    status_code: int = 500

    def __init__(
        self,
        code: ErrorCode,
        message: str,
        details: dict[str, Any] | list[Any] | None = None,
    ):
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details


class BadRequestError(AppError):
    status_code = 400


class NotFoundError(AppError):
    status_code = 404


class UnsupportedMediaTypeError(AppError):
    status_code = 415


class ExternalServiceError(AppError):
    status_code = 502


def error_payload(exc: Exception) -> tuple[int, ErrorResponse]:
    if isinstance(exc, AppError):
        body = ErrorBody(code=exc.code, message=exc.message, details=exc.details)
        return exc.status_code, ErrorResponse(error=body)

    if isinstance(exc, openai.APIError):
        logger.warning("AI provider error: %s", exc)
        body = ErrorBody(
            code=ErrorCode.AI_PROVIDER_ERROR,
            message="The AI provider failed to respond",
        )
        return 502, ErrorResponse(error=body)

    logger.exception("Unhandled error", exc_info=exc)
    body = ErrorBody(
        code=ErrorCode.INTERNAL_ERROR, message="An unexpected error occurred"
    )
    return 500, ErrorResponse(error=body)


def sse_error_event(exc: Exception) -> str:
    _, body = error_payload(exc)
    return f"event: error\ndata: {body.model_dump_json()}\n\n"


def _json(status_code: int, body: ErrorResponse, headers=None) -> JSONResponse:
    return JSONResponse(
        status_code=status_code, content=body.model_dump(mode="json"), headers=headers
    )


async def _app_error_handler(request: Request, exc: Exception) -> JSONResponse:
    return _json(*error_payload(exc))


async def _validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    details = [
        {
            "field": ".".join(str(part) for part in error["loc"]),
            "message": error["msg"],
            "type": error["type"],
        }
        for error in exc.errors()
    ]
    body = ErrorBody(
        code=ErrorCode.VALIDATION_ERROR, message="Invalid request", details=details
    )
    return _json(422, ErrorResponse(error=body))


_HTTP_STATUS_CODES = {
    404: ErrorCode.NOT_FOUND,
    405: ErrorCode.METHOD_NOT_ALLOWED,
}


async def _http_error_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    code = _HTTP_STATUS_CODES.get(exc.status_code, ErrorCode.HTTP_ERROR)
    message = exc.detail if isinstance(exc.detail, str) else "HTTP error"
    body = ErrorBody(code=code, message=message)
    return _json(exc.status_code, ErrorResponse(error=body), headers=exc.headers)


def register_error_handlers(app: FastAPI) -> None:
    """Must be called before adding CORSMiddleware, so CORS headers are also
    set on 500 responses (CORS has to be the outermost middleware)."""
    app.add_exception_handler(AppError, _app_error_handler)
    app.add_exception_handler(openai.APIError, _app_error_handler)
    app.add_exception_handler(RequestValidationError, _validation_error_handler)
    app.add_exception_handler(StarletteHTTPException, _http_error_handler)

    @app.middleware("http")
    async def catch_unhandled_errors(request: Request, call_next):
        try:
            return await call_next(request)
        except Exception as exc:
            return _json(*error_payload(exc))
