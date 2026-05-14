"""
Deterministic financial calculation tools.
No LLM involved — pure Python math for accuracy.
"""
from typing import Dict, Any


def can_afford(price: float, budget_remaining: float) -> Dict[str, Any]:
    if price <= 0:
        return {"decision": "reject", "reason": "Invalid price."}
    if price > budget_remaining:
        return {
            "decision": "reject",
            "reason": (
                f"Item costs ₹{price:,.2f} but you only have ₹{budget_remaining:,.2f} remaining. "
                f"You are ₹{price - budget_remaining:,.2f} short."
            ),
        }
    after = budget_remaining - price
    pct = (price / budget_remaining * 100) if budget_remaining > 0 else 0
    return {
        "decision": "allow",
        "reason": (
            f"You can afford this. It uses {pct:.1f}% of your remaining budget. "
            f"After purchase you'll have ₹{after:,.2f} left."
        ),
    }


def budget_status(total: float, used: float) -> Dict[str, Any]:
    remaining = total - used
    if total <= 0:
        return {"status": "no_budget", "remaining": 0, "pct_used": 0}
    pct = used / total * 100
    if pct >= 100:
        status = "over_budget"
    elif pct >= 80:
        status = "at_risk"
    elif pct >= 50:
        status = "moderate"
    else:
        status = "healthy"
    return {"status": status, "remaining": remaining, "pct_used": round(pct, 1)}


def category_totals(expenses: list) -> Dict[str, float]:
    totals: Dict[str, float] = {}
    for e in expenses:
        cat = e.get("category", "Other")
        totals[cat] = totals.get(cat, 0) + float(e.get("amount", 0))
    return totals


def spending_summary(expenses: list, budget: dict) -> Dict[str, Any]:
    total_spent = sum(float(e.get("amount", 0)) for e in expenses)
    cats = category_totals(expenses)
    top_cat = max(cats, key=cats.get) if cats else "none"
    bstatus = budget_status(float(budget.get("total", 0)), total_spent)
    return {
        "total_spent": total_spent,
        "remaining": bstatus["remaining"],
        "pct_used": bstatus["pct_used"],
        "status": bstatus["status"],
        "top_category": top_cat,
        "category_breakdown": cats,
        "transaction_count": len(expenses),
    }