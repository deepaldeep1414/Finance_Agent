"""
Simple in-memory data store.
In production you'd swap this for SQLite / Postgres — same interface.
"""
import time
from typing import List, Dict, Any


class DataStore:
    def __init__(self):
        self._expenses: List[Dict[str, Any]] = []
        self._budget: Dict[str, Any] = {"total": 0, "used": 0, "period": "monthly"}

    # ── Expenses ──────────────────────────────────────────────────────────────

    def add_expense(self, amount: float, category: str, date: str, title: str) -> Dict:
        expense = {
            "id": int(time.time() * 1000),
            "amount": float(amount),
            "category": category,
            "date": date,
            "title": title,
        }
        self._expenses.append(expense)
        self._budget["used"] = self._budget.get("used", 0) + float(amount)
        return expense

    def get_expenses(self) -> List[Dict]:
        return list(self._expenses)

    # ── Budget ────────────────────────────────────────────────────────────────

    def set_budget(self, total: float, period: str = "monthly") -> Dict:
        self._budget["total"] = float(total)
        self._budget["period"] = period
        return dict(self._budget)

    def get_budget(self) -> Dict:
        return dict(self._budget)


# Singleton store — shared across all requests in one process
store = DataStore()