import logging

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class AppException(Exception):
    def __init__(self, message: str, status_code: int = 400, code: str = "BAD_REQUEST"):
        self.message = message
        self.status_code = status_code
        self.code = code


async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"data": None, "error": {"code": exc.code, "message": exc.message}},
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_error = errors[0] if errors else {}
    message = first_error.get("msg", str(exc))
    code = "VALIDATION_ERROR"
    return JSONResponse(
        status_code=422,
        content={
            "data": None,
            "error": {"code": code, "message": message},
        },
    )


async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception serving %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"data": None, "error": "Internal server error"},
    )
