from typing import Any

from redis.asyncio import Redis

from app.core.config import Settings


async def create_redis_client(settings: Settings) -> Redis:
    return Redis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
        socket_connect_timeout=2,
        socket_timeout=2,
    )


def get_redis_from_request(request: Any) -> Redis | None:
    return getattr(request.app.state, "redis", None)
