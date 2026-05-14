"""
Smart Finance AI Agent - FastAPI Backend
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

from api.agent import run_agent
from api.store import store

app = FastAPI(title="Smart Finance AI Agent", version="2.0.0")

# ─── CORS — fixes OPTIONS 405 preflight errors ────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Models ───────────────────────────────────────────────────────────────────

class ExpenseRequest(BaseModel):
    amount: float
    category: str
    date: str
    title: str

class BudgetRequest(BaseModel):
    total: float
    period: Optional[str] = "monthly"

class AIDecisionRequest(BaseModel):
    query: str
    price: Optional[float] = 0.0

class ChatRequest(BaseModel):
    message: str


# ─── Expense Endpoints ────────────────────────────────────────────────────────

@app.post("/api/add-expense")
def add_expense(req: ExpenseRequest):
    expense = store.add_expense(req.amount, req.category, req.date, req.title)
    return {"success": True, "expense": expense, "budget": store.get_budget()}

@app.get("/api/get-expenses")
def get_expenses():
    return store.get_expenses()

@app.post("/api/set-budget")
def set_budget(req: BudgetRequest):
    budget = store.set_budget(req.total, req.period)
    return {"success": True, "budget": budget}


# ─── AI Endpoints ─────────────────────────────────────────────────────────────

@app.post("/api/ai-decision")
def ai_decision(req: AIDecisionRequest):
    result = run_agent(
        action="ai_decision",
        query=req.query,
        price=req.price,
        expenses=store.get_expenses(),
        budget=store.get_budget(),
    )
    return result

@app.post("/api/analyze")
def analyze():
    result = run_agent(
        action="analyze_finances",
        query="",
        price=0.0,
        expenses=store.get_expenses(),
        budget=store.get_budget(),
    )
    return result

@app.post("/api/chat")
def chat(req: ChatRequest):
    result = run_agent(
        action="chat",
        query=req.message,
        price=0.0,
        expenses=store.get_expenses(),
        budget=store.get_budget(),
    )
    return {"response": result.get("reason", "I couldn't process that.")}


# ─── Static Files ─────────────────────────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

@app.get("/")
def root():
    p = os.path.join(BASE_DIR, "index.html")
    if os.path.exists(p):
        return FileResponse(p)
    return {"message": "API running — place index.html next to main.py"}

@app.get("/style.css")
def serve_css():
    p = os.path.join(BASE_DIR, "style.css")
    if os.path.exists(p):
        return FileResponse(p, media_type="text/css")
    raise HTTPException(404)

@app.get("/script.js")
def serve_js():
    p = os.path.join(BASE_DIR, "script.js")
    if os.path.exists(p):
        return FileResponse(p, media_type="application/javascript")
    raise HTTPException(404)

@app.get("/{filename:path}")
def serve_static(filename: str):
    if filename.startswith(("api/", "docs", "openapi")):
        raise HTTPException(404)
    p = os.path.join(BASE_DIR, filename)
    if os.path.exists(p) and os.path.isfile(p):
        return FileResponse(p)
    raise HTTPException(404)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)