from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator, model_validator


class JWTDecodeRequest(BaseModel):
    token: str = Field(min_length=1, max_length=8192)


class JWTDecodeResponse(BaseModel):
    header: dict[str, Any]
    payload: dict[str, Any]
    issued_at: datetime | None = None
    expires_at: datetime | None = None
    is_expired: bool | None = None


class Base64Request(BaseModel):
    mode: Literal["encode", "decode"]
    input: str = Field(min_length=0, max_length=65535)


class Base64Response(BaseModel):
    mode: Literal["encode", "decode"]
    output: str


class JSONYAMLRequest(BaseModel):
    mode: Literal["json-to-yaml", "yaml-to-json"]
    input: str = Field(min_length=1, max_length=200000)
    sort_keys: bool = False


class JSONYAMLResponse(BaseModel):
    mode: Literal["json-to-yaml", "yaml-to-json"]
    output: str


class HashGeneratorRequest(BaseModel):
    algorithm: Literal["md5", "sha1", "sha224", "sha256", "sha384", "sha512"] = "sha256"
    input: str = Field(min_length=0, max_length=200000)


class HashGeneratorResponse(BaseModel):
    algorithm: Literal["md5", "sha1", "sha224", "sha256", "sha384", "sha512"]
    input_length: int
    digest: str


class UUIDGeneratorRequest(BaseModel):
    count: int = Field(default=1, ge=1, le=100)
    uppercase: bool = False
    remove_hyphens: bool = False


class UUIDGeneratorResponse(BaseModel):
    count: int
    uuids: list[str]


class URLCodecRequest(BaseModel):
    mode: Literal["encode", "decode"]
    input: str = Field(min_length=0, max_length=65535)


class URLCodecResponse(BaseModel):
    mode: Literal["encode", "decode"]
    output: str


class TimestampConverterRequest(BaseModel):
    input: str = Field(min_length=1, max_length=128)


class TimestampConverterResponse(BaseModel):
    input: str
    detected_type: Literal["unix_seconds", "unix_milliseconds", "iso_datetime"]
    unix_seconds: int
    unix_milliseconds: int
    iso_utc: str


class JSONFormatterRequest(BaseModel):
    operation: Literal["pretty", "minify", "validate"]
    input: str = Field(min_length=1, max_length=200000)
    sort_keys: bool = False


class JSONFormatterResponse(BaseModel):
    operation: Literal["pretty", "minify", "validate"]
    valid: bool
    output: str | None = None


class CronToolRequest(BaseModel):
    mode: Literal["parse", "generate"] = "parse"
    expression: str | None = Field(default=None, max_length=256)
    minute: str = Field(default="*", min_length=1, max_length=64)
    hour: str = Field(default="*", min_length=1, max_length=64)
    day_of_month: str = Field(default="*", min_length=1, max_length=64)
    month: str = Field(default="*", min_length=1, max_length=64)
    day_of_week: str = Field(default="*", min_length=1, max_length=64)

    @model_validator(mode="after")
    def validate_mode(self) -> "CronToolRequest":
        if self.mode == "parse":
            if self.expression is None or not self.expression.strip():
                raise ValueError("Expression is required when mode is parse")
        return self


class CronToolResponse(BaseModel):
    mode: Literal["parse", "generate"]
    expression: str
    description: str
    minute: str
    hour: str
    day_of_month: str
    month: str
    day_of_week: str


class UnitConverterRequest(BaseModel):
    category: Literal["length", "weight", "temperature", "volume", "speed", "area"]
    value: float = Field(ge=-1e12, le=1e12)
    from_unit: str = Field(min_length=1, max_length=32)
    to_unit: str = Field(min_length=1, max_length=32)


class UnitConverterResponse(BaseModel):
    category: str
    input_value: float
    from_unit: str
    to_unit: str
    output_value: float


class SSLCheckerRequest(BaseModel):
    hostname: str = Field(min_length=1, max_length=253)


class SSLCheckerResponse(BaseModel):
    hostname: str
    issuer: str
    subject: str
    valid_from: datetime
    valid_to: datetime
    days_remaining: int
    sans: list[str]


class PasswordGeneratorRequest(BaseModel):
    mode: Literal["random", "passphrase"] = "random"

    length: int = Field(default=20, ge=8, le=128)
    include_lowercase: bool = True
    include_uppercase: bool = True
    include_numbers: bool = True
    include_symbols: bool = True

    word_count: int = Field(default=4, ge=3, le=12)
    separator: str = Field(default="-", min_length=1, max_length=3)
    capitalize_words: bool = False
    append_number: bool = False


class PasswordGeneratorResponse(BaseModel):
    mode: Literal["random", "passphrase"]
    value: str
    length: int


class ColorConverterRequest(BaseModel):
    input: str = Field(min_length=1, max_length=64)


class ColorConverterResponse(BaseModel):
    input: str
    hex: str
    hex_alpha: str
    rgb: str
    rgba: str


class PDFSplitRequest(BaseModel):
    page_range: str = Field(min_length=1, max_length=128)

    @field_validator("page_range")
    @classmethod
    def validate_page_range(cls, value: str) -> str:
        normalized = value.strip().replace(" ", "")
        if not normalized:
            raise ValueError("Page range is required")
        return normalized
