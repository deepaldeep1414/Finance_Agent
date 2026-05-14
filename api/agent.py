"""
Finance AI Agent — clean rewrite.

Architecture:
  1. Intent classification  (regex + keyword, zero latency)
  2. Tool routing           (deterministic math, no LLM)
  3. RAG retrieval          (keyword lookup, no vector DB)
  4. LLM call               (Groq / Llama-3.3, only when needed)
  5. Confidence scoring     (rule-based post-processing)

No LangGraph, no Node.js, no subprocess. Just clean Python.
"""

import os
import re
import json
import httpx
from typing import Any, Dict, List

from api.rag import retrieve
from api.tools import can_afford, spending_summary, budget_status

# ─── Groq client (thin wrapper, no SDK dependency required) ───────────────────

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """You are a Fiduciary Grandmaster Financial Advisor AI operating in the Indian financial context (INR, PPF, NPS, ELSS, etc.).

RULES:
1. Be specific and actionable — never give vague advice like "save more money".
2. Use the user's actual spending data provided in context when making recommendations.
3. Always add a brief risk disclaimer for volatile assets (crypto, equities).
4. Format responses clearly: use numbered steps or bullet points where helpful.
5. If key data (income, savings goal) is missing, ask for it explicitly.
6. NEVER hallucinate numbers. Only cite figures from the context provided.
7. Keep responses concise (under 300 words) unless a detailed breakdown is requested.
"""


def _call_groq(messages: List[Dict]) -> str:
    """Direct HTTP call to Groq. Returns assistant text or an error string."""
    if not GROQ_API_KEY or GROQ_API_KEY in ("", "your_key_here"):
        return (
            "⚠️ Groq API key not configured. Set GROQ_API_KEY in your .env file. "
            "The deterministic tools (affordability checks, budget analysis) work without an API key."
        )
    try:
        resp = httpx.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "temperature": 0,
                "max_tokens": 600,
                "messages": messages,
            },
            timeout=20,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()
    except httpx.HTTPStatusError as e:
        return f"Groq API error {e.response.status_code}: {e.response.text[:200]}"
    except Exception as e:
        return f"Request failed: {str(e)}"


# ─── Intent classification ─────────────────────────────────────────────────────

_AFFORD_RE = re.compile(
    r"(afford|can i buy|should i buy|purchase|buy)", re.I
)
_ANALYSIS_KW = {
    "summarize", "overview", "analysis", "analyze", "analyse",
    "spend", "spending", "history", "breakdown",
}
_ADVISORY_KW = {
    "save", "saving", "invest", "rule", "debt", "emergency",
    "retirement", "credit", "wealth", "strategy", "plan", "tax",
    "inflation", "insurance", "side hustle", "net worth",
    "allocation", "fire", "crypto", "volatility", "estate",
    "business", "geo", "arbitrage", "recession", "generation",
    "child", "education", "predict", "fomo", "lifestyle",
    "house", "home", "mortgage",
}


def _classify(query: str, price: float, action: str) -> str:
    q = query.lower()
    if action == "analyze_finances" or any(k in q for k in _ANALYSIS_KW):
        return "analyze"
    if price > 0 or _AFFORD_RE.search(q):
        return "affordability"
    if any(k in q for k in _ADVISORY_KW):
        return "advisory"
    return "general"


# ─── Main agent entry point ────────────────────────────────────────────────────

def run_agent(
    action: str,
    query: str,
    price: float,
    expenses: List[Dict],
    budget: Dict,
) -> Dict[str, Any]:

    intent = _classify(query, price, action)
    summary = spending_summary(expenses, budget)

    # ── 1. AFFORDABILITY (deterministic) ──────────────────────────────────────
    if intent == "affordability":
        result = can_afford(price, summary["remaining"])
        decision = "YES" if result["decision"] == "allow" else "NO"
        return {
            "decision": decision,
            "reason": result["reason"],
            "confidence": 0.99,
        }

    # ── 2. SPENDING ANALYSIS (deterministic + optional LLM insight) ────────────
    if intent == "analyze":
        breakdown_lines = [
            f"  • {cat}: ₹{amt:,.2f}" for cat, amt in summary["category_breakdown"].items()
        ]
        analysis_text = (
            f"Total Spent: ₹{summary['total_spent']:,.2f}  |  "
            f"Remaining: ₹{summary['remaining']:,.2f}  |  "
            f"Budget Used: {summary['pct_used']}%"
        )
        insights = [
            f"Risk Status: {summary['status'].upper().replace('_', ' ')}",
            f"Top Spending Category: {summary['top_category']}",
            f"Transactions Logged: {summary['transaction_count']}",
        ]
        if breakdown_lines:
            insights.append("Category Breakdown:\n" + "\n".join(breakdown_lines))
        if summary["pct_used"] >= 80:
            insights.append("⚠️ You've used 80%+ of your budget. Consider pausing non-essential spending.")
        elif summary["pct_used"] >= 50:
            insights.append("📊 You're at the halfway mark. Keep an eye on discretionary categories.")
        else:
            insights.append("✅ Budget health looks good. Stay consistent.")
        return {"analysis": analysis_text, "insights": insights}

    # ── 3. ADVISORY — RAG + LLM ───────────────────────────────────────────────
    if intent == "advisory":
        knowledge = retrieve(query)
        context_block = "\n\n".join(f"[Knowledge]: {k}" for k in knowledge)
        user_context = (
            f"User's Budget: ₹{budget.get('total', 0):,.2f} ({budget.get('period', 'monthly')})\n"
            f"Total Spent: ₹{summary['total_spent']:,.2f}\n"
            f"Remaining: ₹{summary['remaining']:,.2f}\n"
            f"Top Spending Category: {summary['top_category']}\n"
        )
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"USER FINANCIAL CONTEXT:\n{user_context}\n\n"
                    f"RELEVANT KNOWLEDGE BASE:\n{context_block}\n\n"
                    f"USER QUESTION: {query}"
                ),
            },
        ]
        answer = _call_groq(messages)
        return {"decision": "INFO", "reason": answer, "confidence": 0.87}

    # ── 4. GENERAL — pure LLM ─────────────────────────────────────────────────
    user_context = (
        f"Budget: ₹{budget.get('total', 0):,.2f}, "
        f"Spent: ₹{summary['total_spent']:,.2f}, "
        f"Remaining: ₹{summary['remaining']:,.2f}"
    )
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"Financial Context: {user_context}\n\nQuestion: {query}",
        },
    ]
    answer = _call_groq(messages)
    return {"decision": "NEUTRAL", "reason": answer, "confidence": 0.82}