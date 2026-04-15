import logging
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from redis.exceptions import RedisError

from app.api.routes.health import router as health_router
from app.api.routes.tools import router as tools_router
from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.logging import setup_logging
from app.core.redis import create_redis_client
from app.middleware.request_id import RequestIDMiddleware
from app.middleware.request_limits import RequestSizeLimitMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    redis_client = None

    try:
        redis_client = await create_redis_client(settings)
        await redis_client.ping()
        logger.info("redis_connected")
    except Exception:  # noqa: BLE001
        logger.warning("redis_unavailable_startup")
        redis_client = None

    app.state.redis = redis_client
    yield

    if redis_client is not None:
        try:
            await redis_client.close()
        except RedisError:
            logger.warning("redis_close_failed")


def _error_response(status_code: int, code: str, message: str, request_id: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message, "request_id": request_id}},
    )


def create_app() -> FastAPI:
    settings: Settings = get_settings()
    setup_logging(settings.log_level)

    app = FastAPI(
        title="Simple Tools Hub Backend",
        docs_url=None if settings.is_production else "/docs",
        redoc_url=None if settings.is_production else "/redoc",
        openapi_url=None if settings.is_production else "/openapi.json",
        lifespan=lifespan,
    )

    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(
        RequestSizeLimitMiddleware,
        max_json_body_size=settings.request_body_max_bytes,
        max_multipart_body_size=settings.file_request_max_bytes,
    )
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "X-Request-ID"],
    )

    app.include_router(health_router, prefix="/api")
    app.include_router(tools_router, prefix="/api")

    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", str(uuid4()))
        logger.warning(
            f"app_error:{exc.code}",
            extra={"request_id": request_id, "path": request.url.path},
        )
        return _error_response(exc.status_code, exc.code, exc.message, request_id)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", str(uuid4()))
        logger.warning(
            "validation_error",
            extra={"request_id": request_id, "path": request.url.path},
        )
        return _error_response(422, "invalid_request", "Request validation failed", request_id)

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", str(uuid4()))
        logger.exception(
            "unexpected_error",
            extra={"request_id": request_id, "path": request.url.path},
        )
        return _error_response(500, "internal_error", "An internal error occurred", request_id)

    return app


app = create_app()
