from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    app_env: Literal["development", "production", "test"] = "development"
    log_level: str = "INFO"

    redis_url: str = "redis://redis:6379/0"

    rate_limit_default_per_minute: int = Field(default=120, ge=1, le=5000)
    rate_limit_ssl_per_minute: int = Field(default=30, ge=1, le=1000)
    rate_limit_file_per_minute: int = Field(default=30, ge=1, le=1000)
    rate_limit_pdf_per_minute: int = Field(default=15, ge=1, le=1000)

    ssl_cache_ttl_seconds: int = Field(default=300, ge=5, le=3600)

    request_body_max_bytes: int = Field(default=32768, ge=1024, le=1_048_576)
    file_request_max_bytes: int = Field(default=26_214_400, ge=1_048_576, le=104_857_600)

    ssl_connect_timeout_seconds: float = Field(default=4.0, ge=1.0, le=20.0)
    ssl_total_timeout_seconds: float = Field(default=8.0, ge=2.0, le=30.0)

    pdf_max_pages: int = Field(default=200, ge=1, le=5000)
    pdf_merge_max_files: int = Field(default=20, ge=1, le=100)

    image_max_pixels: int = Field(default=40_000_000, ge=1_000_000, le=200_000_000)
    image_max_dimension: int = Field(default=10_000, ge=256, le=50_000)

    cors_allowed_origins: str = "http://localhost:3004"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
