from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Intent = Literal[
    "spending_analysis",
    "budgeting",
    "subscriptions",
    "savings",
    "investing",
    "debt",
    "emotional_spending",
    "lifestyle_tradeoff",
    "financial_planning",
    "purchase_decision",
    "income_analysis",
    "cashflow_analysis",
    "recurring_expenses",
    "general_finance_question",
]

RiskLevel = Literal["low", "medium", "high"]


class FinancialSnapshot(BaseModel):
    model_config = ConfigDict(extra="ignore")

    totalSpent: float = 0.0
    monthlySpent: float = 0.0
    budgetAmount: float = 0.0
    budgetRemaining: float = 0.0
    budgetVariance: float = 0.0
    savingsRate: float | None = None
    discretionaryRatio: float = 0.0
    essentialRatio: float = 0.0
    debtToIncome: float | None = None
    recurringTotal: float = 0.0
    monthlyBurn: float | None = None
    runwayMonths: float | None = None
    categoryTotals: dict[str, float] = Field(default_factory=dict)
    categoryDeltas: dict[str, float] = Field(default_factory=dict)
    transactionCount: int = 0


class MemoryProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")

    monthlyIncome: float | None = None
    savingsTarget: float | None = None
    debtBalance: float | None = None
    priorities: list[str] = Field(default_factory=list)


class IntentResult(BaseModel):
    intent: Intent | None = None
    confidence: float = 0.0
    alternatives: list[Intent] = Field(default_factory=list)


class AssistantRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    snapshot: FinancialSnapshot = Field(default_factory=FinancialSnapshot)
    memory: MemoryProfile = Field(default_factory=MemoryProfile)
    intent_hint: IntentResult | None = None


class AssistantResponse(BaseModel):
    intent: Intent
    summary: str
    key_insight: str
    financial_impact: str
    recommendation: str
    risk_level: RiskLevel
    confidence: float = Field(ge=0.0, le=1.0)
    metrics_used: list[str] = Field(default_factory=list)
    follow_up_question: str = ""
