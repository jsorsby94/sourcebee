import json
from typing import Any

import yaml

from app.core.errors import AppError


def _yaml_error_message(exc: yaml.YAMLError) -> str:
    mark = getattr(exc, "problem_mark", None)
    if mark is None:
        return "Invalid YAML input"
    return f"Invalid YAML at line {mark.line + 1}, column {mark.column + 1}"


def convert_json_yaml(
    mode: str, input_text: str, sort_keys: bool = False
) -> dict[str, str]:
    if mode == "json-to-yaml":
        try:
            parsed = json.loads(input_text)
        except json.JSONDecodeError as exc:
            message = (
                f"Invalid JSON at line {exc.lineno}, column {exc.colno}: {exc.msg}"
            )
            raise AppError(400, "invalid_json", message) from exc

        output = yaml.safe_dump(
            parsed,
            sort_keys=sort_keys,
            allow_unicode=True,
            default_flow_style=False,
        )
        return {"mode": "json-to-yaml", "output": output}

    if mode == "yaml-to-json":
        try:
            parsed: Any = yaml.safe_load(input_text)
        except yaml.YAMLError as exc:
            raise AppError(400, "invalid_yaml", _yaml_error_message(exc)) from exc

        output = json.dumps(parsed, indent=2, ensure_ascii=False, sort_keys=sort_keys)
        return {"mode": "yaml-to-json", "output": output}

    raise AppError(400, "invalid_mode", "Mode must be json-to-yaml or yaml-to-json")
