from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", case_sensitive=False, extra="ignore"
    )

    app_env: Literal["development", "production", "test"] = "development"
    log_level: str = "INFO"

    mongodb_url: str = "mongodb://mongodb:27017"
    mongodb_db_name: str = "simple_tools_hub_dev_analytics"

    ingest_max_bytes: int = Field(default=16_384, ge=1_024, le=262_144)
    dashboard_default_window_hours: int = Field(default=24, ge=1, le=720)

    @property
    def env_label(self) -> str:
        if self.app_env == "production":
            return "prod"
        if self.app_env == "test":
            return "test"
        return "dev"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
