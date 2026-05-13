from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    groq_api_key: str | None = Field(default=None)
    model_name: str = Field(default="llama-3.3-70b-versatile")
    temperature: float = Field(default=0.0)
    request_timeout: float = Field(default=12.0)
    enable_llm: bool = Field(default=True)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
