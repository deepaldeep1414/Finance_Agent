from __future__ import annotations

from .schemas import FinancialSnapshot


def top_category(snapshot: FinancialSnapshot) -> tuple[str, float] | None:
    if not snapshot.categoryTotals:
        return None
    return max(snapshot.categoryTotals.items(), key=lambda kv: kv[1])


def biggest_mover(snapshot: FinancialSnapshot) -> tuple[str, float] | None:
    if not snapshot.categoryDeltas:
        return None
    return max(snapshot.categoryDeltas.items(), key=lambda kv: abs(kv[1]))


def headroom(snapshot: FinancialSnapshot, monthly_income: float | None) -> float:
    if snapshot.budgetAmount > 0:
        return snapshot.budgetRemaining
    if monthly_income is not None:
        return monthly_income - snapshot.monthlySpent
    return 0.0


def risk_level(snapshot: FinancialSnapshot) -> str:
    if snapshot.budgetVariance > 0.15 or snapshot.discretionaryRatio > 0.5:
        return "high"
    if snapshot.budgetVariance > 0 or (snapshot.savingsRate is not None and snapshot.savingsRate < 0.1):
        return "medium"
    return "low"
