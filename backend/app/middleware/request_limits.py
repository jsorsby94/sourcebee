from __future__ import annotations

from uuid import uuid4

from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from app.core.analytics import emit_backend_event


class _PayloadTooLarge(Exception):
    pass


class RequestSizeLimitMiddleware:
    def __init__(
        self, app: ASGIApp, max_json_body_size: int, max_multipart_body_size: int
    ) -> None:
        self.app = app
        self.max_json_body_size = max_json_body_size
        self.max_multipart_body_size = max_multipart_body_size

    @staticmethod
    def _header_value(scope: Scope, name: str) -> str | None:
        key = name.encode("latin-1")
        for header_name, header_value in scope.get("headers", []):
            if header_name.lower() == key:
                return header_value.decode("latin-1")
        return None

    @staticmethod
    def _request_id(scope: Scope) -> str:
        request_id = RequestSizeLimitMiddleware._header_value(scope, "x-request-id")
        if request_id:
            return request_id
        return str(uuid4())

    async def _send_invalid_content_length(
        self, scope: Scope, receive: Receive, send: Send
    ) -> None:
        request = Request(scope, receive=receive)
        await emit_backend_event(
            request,
            event_type="request_rejected_invalid_content_length",
            status_code=400,
            meta={"reason": "invalid_content_length"},
        )

        response = JSONResponse(
            status_code=400,
            content={
                "error": {
                    "code": "invalid_content_length",
                    "message": "Invalid Content-Length header",
                    "request_id": self._request_id(scope),
                }
            },
        )
        await response(scope, receive, send)

    async def _send_payload_too_large(
        self, scope: Scope, receive: Receive, send: Send, size_limit: int
    ) -> None:
        request = Request(scope, receive=receive)
        await emit_backend_event(
            request,
            event_type="request_rejected_payload_too_large",
            status_code=413,
            meta={"size_limit": size_limit},
        )

        response = JSONResponse(
            status_code=413,
            content={
                "error": {
                    "code": "payload_too_large",
                    "message": "Request body exceeds allowed size",
                    "request_id": self._request_id(scope),
                }
            },
        )
        await response(scope, receive, send)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        method = str(scope.get("method", "")).upper()
        if method not in {"POST", "PUT", "PATCH"}:
            await self.app(scope, receive, send)
            return

        content_type = (self._header_value(scope, "content-type") or "").lower()
        size_limit = (
            self.max_multipart_body_size
            if "multipart/form-data" in content_type
            else self.max_json_body_size
        )

        content_length_raw = self._header_value(scope, "content-length")
        if content_length_raw is not None:
            try:
                declared_size = int(content_length_raw)
            except ValueError:
                await self._send_invalid_content_length(scope, receive, send)
                return

            if declared_size > size_limit:
                await self._send_payload_too_large(scope, receive, send, size_limit)
                return

        received_bytes = 0

        async def limited_receive():
            nonlocal received_bytes
            message = await receive()
            if message["type"] == "http.request":
                received_bytes += len(message.get("body", b""))
                if received_bytes > size_limit:
                    raise _PayloadTooLarge()
            return message

        try:
            await self.app(scope, limited_receive, send)
        except _PayloadTooLarge:
            await self._send_payload_too_large(scope, receive, send, size_limit)
