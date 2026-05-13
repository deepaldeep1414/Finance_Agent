from __future__ import annotations

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import Settings, get_settings
from .insights import build_response
from .intent import classify_intent
from .llm import LLMUnavailable, generate_structured_response
from .schemas import AssistantRequest, AssistantResponse, IntentResult


def create_app() -> FastAPI:
    app = FastAPI(title="Finance Copilot API", version="1.0.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/api/intent", response_model=IntentResult)
    async def intent(req: AssistantRequest) -> IntentResult:
        return classify_intent(req.query)

    @app.post("/api/finance", response_model=AssistantResponse)
    async def finance(req: AssistantRequest, settings: Settings = Depends(get_settings)) -> AssistantResponse:
        hint = req.intent_hint or classify_intent(req.query)
        try:
            return await generate_structured_response(
                req.model_copy(update={"intent_hint": hint}),
                settings,
            )
        except LLMUnavailable:
            return build_response(
                intent_result=hint,
                snapshot=req.snapshot,
                memory=req.memory,
                query=req.query,
            )

    @app.exception_handler(Exception)
    async def fallback_handler(_request, exc: Exception) -> JSONResponse:
        return JSONResponse(status_code=500, content={"detail": "internal_error", "error": str(exc)[:200]})

    return app


app = create_app()
