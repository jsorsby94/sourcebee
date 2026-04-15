from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_json_body_size: int, max_multipart_body_size: int) -> None:
        super().__init__(app)
        self.max_json_body_size = max_json_body_size
        self.max_multipart_body_size = max_multipart_body_size

    async def dispatch(self, request: Request, call_next):
        if request.method in {"POST", "PUT", "PATCH"}:
            content_type = request.headers.get("content-type", "").lower()
            size_limit = self.max_multipart_body_size if "multipart/form-data" in content_type else self.max_json_body_size

            content_length = request.headers.get("content-length")
            if content_length is not None:
                try:
                    if int(content_length) > size_limit:
                        request_id = getattr(request.state, "request_id", str(uuid4()))
                        return JSONResponse(
                            status_code=413,
                            content={
                                "error": {
                                    "code": "payload_too_large",
                                    "message": "Request body exceeds allowed size",
                                    "request_id": request_id,
                                }
                            },
                        )
                except ValueError:
                    return JSONResponse(
                        status_code=400,
                        content={
                            "error": {
                                "code": "invalid_content_length",
                                "message": "Invalid Content-Length header",
                                "request_id": getattr(request.state, "request_id", str(uuid4())),
                            }
                        },
                    )

        return await call_next(request)
