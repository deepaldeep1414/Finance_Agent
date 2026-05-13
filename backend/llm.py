from __future__ import annotations

import json
import re
from typing import Any

import httpx

from .config import Settings
from .prompts import OUTPUT_INSTRUCTION, SYSTEM_PROMPT
from .schemas import AssistantRequest, AssistantResponse

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


class LLMUnavailable(Exception):
    pass


def _extract_json(text: str) -> dict[str, Any]:
    match = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if not match:
        raise LLMUnavailable("model did not return JSON")
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError as exc:
        raise LLMUnavailable(str(exc)) from exc


def _build_user_message(req: AssistantRequest) -> str:
    snapshot = req.snapshot.model_dump()
    memory = req.memory.model_dump()
    intent_hint = req.intent_hint.model_dump() if req.intent_hint else None
    payload = {
        "query": req.query,
        "snapshot": snapshot,
        "memory": memory,
        "intent_hint": intent_hint,
    }
    return f"{json.dumps(payload, separators=(',', ':'))}\n\n{OUTPUT_INSTRUCTION}"


async def generate_structured_response(req: AssistantRequest, settings: Settings) -> AssistantResponse:
    if not settings.enable_llm or not settings.groq_api_key:
        raise LLMUnavailable("llm disabled or api key missing")

    payload = {
        "model": settings.model_name,
        "temperature": settings.temperature,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_message(req)},
        ],
        "response_format": {"type": "json_object"},
    }
    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
            res = await client.post(GROQ_URL, json=payload, headers=headers)
    except httpx.HTTPError as exc:
        raise LLMUnavailable(str(exc)) from exc

    if res.status_code >= 400:
        raise LLMUnavailable(f"groq status {res.status_code}: {res.text[:200]}")

    body = res.json()
    content = body.get("choices", [{}])[0].get("message", {}).get("content")
    if not content:
        raise LLMUnavailable("empty content from model")

    data = _extract_json(content)
    return AssistantResponse.model_validate(data)
