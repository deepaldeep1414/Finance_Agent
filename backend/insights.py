from __future__ import annotations

import re
from typing import Callable

from .analysis import biggest_mover, headroom, risk_level, top_category
from .schemas import AssistantResponse, FinancialSnapshot, Intent, IntentResult, MemoryProfile


def _inr(value: float) -> str:
    return f"₹{round(value):,}"


def _pct(value: float) -> str:
    return f"{round(value * 100)}%"


def _empty_response(intent: Intent) -> AssistantResponse:
    return AssistantResponse(
        intent=intent,
        summary="Not enough transaction data to ground this answer.",
        key_insight="Log a few expenses and a monthly budget so the analysis can use real numbers.",
        financial_impact="—",
        recommendation="Add 5–10 recent transactions and set a monthly budget to enable grounded analysis.",
        risk_level="low",
        confidence=0.4,
        metrics_used=[],
        follow_up_question="What's your typical monthly income and budget?",
    )


def _spending(snapshot: FinancialSnapshot, memory: MemoryProfile, query: str) -> AssistantResponse:
    if snapshot.transactionCount == 0:
        return _empty_response("spending_analysis")
    top = top_category(snapshot)
    mover = biggest_mover(snapshot)
    mover_line = (
        f"{mover[0]} {'up' if mover[1] > 0 else 'down'} {_inr(abs(mover[1]))} vs last month."
        if mover and abs(mover[1]) > 0
        else "No major month-over-month change yet."
    )
    insight = (
        f"Largest category is {top[0]} at {_inr(top[1])} "
        f"({_pct(top[1] / snapshot.monthlySpent if snapshot.monthlySpent else 0)} of the month). {mover_line}"
        if top
        else mover_line
    )
    return AssistantResponse(
        intent="spending_analysis",
        summary=f"This month: {_inr(snapshot.monthlySpent)} across {snapshot.transactionCount} transactions.",
        key_insight=insight,
        financial_impact=(
            f"Discretionary spending is {_pct(snapshot.discretionaryRatio)} of the month; "
            f"recurring is {_inr(snapshot.recurringTotal)}."
        ),
        recommendation=(
            f"Cap {top[0]} at the prior-month level for the next 30 days and reassess."
            if top
            else "Continue tracking; one more month of data will reveal trends."
        ),
        risk_level=risk_level(snapshot),
        confidence=0.82,
        metrics_used=["monthlySpent", "categoryTotals", "categoryDeltas", "discretionaryRatio", "recurringTotal"],
        follow_up_question="Want a per-category breakdown or a 30-day spending cap?",
    )


def _budgeting(snapshot: FinancialSnapshot, memory: MemoryProfile, query: str) -> AssistantResponse:
    if snapshot.budgetAmount == 0:
        return AssistantResponse(
            intent="budgeting",
            summary="No monthly budget is set, so variance can't be measured.",
            key_insight=f"Month-to-date spend is {_inr(snapshot.monthlySpent)}.",
            financial_impact="Without a budget, overspend can compound silently.",
            recommendation="Set a monthly budget based on the last 1–2 months of spend.",
            risk_level="medium",
            confidence=0.7,
            metrics_used=["monthlySpent"],
            follow_up_question="Want a suggested budget based on your recent spending?",
        )
    variance = snapshot.budgetVariance
    remaining = snapshot.budgetRemaining
    if variance > 0.1:
        rec = "Pause non-essential categories for the rest of the month."
    elif variance > 0:
        rec = "Tighten the top discretionary category for the next two weeks."
    else:
        rec = "Maintain current pace; consider directing the surplus to savings."
    return AssistantResponse(
        intent="budgeting",
        summary=(
            f"Spent {_inr(snapshot.monthlySpent)} of {_inr(snapshot.budgetAmount)} "
            f"({_pct(min(1.0, snapshot.monthlySpent / snapshot.budgetAmount))})."
        ),
        key_insight=(
            f"Over budget by {_inr(abs(remaining))} ({_pct(variance)})."
            if variance > 0
            else f"Under budget with {_inr(remaining)} remaining ({_pct(-variance)} headroom)."
        ),
        financial_impact=(
            "Continued pace will overshoot end-of-month target." if variance > 0 else "Track stays viable."
        ),
        recommendation=rec,
        risk_level=risk_level(snapshot),
        confidence=0.86,
        metrics_used=["monthlySpent", "budgetAmount", "budgetVariance", "discretionaryRatio"],
        follow_up_question=(
            "Want a list of cuts to bring this back on track?"
            if variance > 0
            else "Want to route the surplus to a savings target?"
        ),
    )


def _subscriptions(snapshot: FinancialSnapshot, memory: MemoryProfile, query: str) -> AssistantResponse:
    recurring = snapshot.recurringTotal
    annualized = recurring * 12
    share = recurring / snapshot.monthlySpent if snapshot.monthlySpent > 0 else 0.0
    if recurring == 0:
        return AssistantResponse(
            intent="subscriptions",
            summary="No recurring expenses detected in the current month.",
            key_insight="Mark services like Netflix or rent as recurring to track fixed costs.",
            financial_impact="—",
            recommendation="Tag known fixed transactions so the assistant can audit subscriptions.",
            risk_level="low",
            confidence=0.6,
            metrics_used=["recurringTotal"],
            follow_up_question="Which transactions should I treat as recurring?",
        )
    return AssistantResponse(
        intent="subscriptions",
        summary=f"Recurring monthly outflow: {_inr(recurring)} (~{_inr(annualized)} annualized).",
        key_insight=f"Recurring is {_pct(share)} of monthly spend.",
        financial_impact=f"Cancelling one {_inr(round(recurring / 4))} subscription saves {_inr(round(recurring * 3))} per year.",
        recommendation="Audit the recurring list and cancel any service unused in the last 30 days.",
        risk_level="medium" if share > 0.4 else "low",
        confidence=0.8,
        metrics_used=["recurringTotal", "monthlySpent"],
        follow_up_question="Want to flag specific transactions as recurring?",
    )


def _savings(snapshot: FinancialSnapshot, memory: MemoryProfile, query: str) -> AssistantResponse:
    if memory.monthlyIncome is None:
        return AssistantResponse(
            intent="savings",
            summary="Savings rate needs income to be computed.",
            key_insight=f"Monthly spend so far: {_inr(snapshot.monthlySpent)}.",
            financial_impact="—",
            recommendation="Share your monthly income to ground savings analysis.",
            risk_level="low",
            confidence=0.5,
            metrics_used=["monthlySpent"],
            follow_up_question="What's your typical monthly take-home income?",
        )
    sr = (
        snapshot.savingsRate
        if snapshot.savingsRate is not None
        else max(0.0, (memory.monthlyIncome - snapshot.monthlySpent) / memory.monthlyIncome)
    )
    if sr >= 0.2:
        insight = "Above the 20% benchmark — healthy."
        risk = "low"
        rec = "Direct surplus into an emergency fund until it covers 3–6 months of essentials."
    elif sr >= 0.1:
        insight = "Below 20% — there's room to push higher."
        risk = "medium"
        rec = "Trim the top discretionary category by ~10–15% to raise the rate."
    else:
        insight = "Below 10% — fragile against shocks."
        risk = "high"
        rec = "Trim the top discretionary category by ~10–15% to raise the rate."
    return AssistantResponse(
        intent="savings",
        summary=f"Estimated savings rate: {_pct(sr)} of income.",
        key_insight=insight,
        financial_impact=(
            f"Income {_inr(memory.monthlyIncome)} − spend {_inr(snapshot.monthlySpent)} "
            f"= {_inr(memory.monthlyIncome - snapshot.monthlySpent)} this month."
        ),
        recommendation=rec,
        risk_level=risk,
        confidence=0.85,
        metrics_used=["savingsRate", "monthlySpent"],
        follow_up_question="Want a concrete plan to lift the savings rate by 5 points?" if sr < 0.2 else "Want a target emergency-fund size?",
    )


def _investing(snapshot: FinancialSnapshot, memory: MemoryProfile, query: str) -> AssistantResponse:
    sr_msg = (
        f"Current savings rate {_pct(snapshot.savingsRate or 0)} — only invest beyond an emergency buffer."
        if snapshot.savingsRate is not None
        else "Set income and a 3-month emergency target before investing."
    )
    return AssistantResponse(
        intent="investing",
        summary="Investing analysis needs cashflow context to be honest.",
        key_insight=sr_msg,
        financial_impact="—",
        recommendation="Cover 3 months of essentials first; then a low-cost broad index fund is a reasonable default.",
        risk_level="medium",
        confidence=0.6,
        metrics_used=["savingsRate", "monthlySpent"],
        follow_up_question="What's the goal — retirement, a near-term purchase, or general wealth building?",
    )


def _debt(snapshot: FinancialSnapshot, memory: MemoryProfile, query: str) -> AssistantResponse:
    if memory.debtBalance is None:
        return AssistantResponse(
            intent="debt",
            summary="No debt balance on file.",
            key_insight="Add the outstanding debt amount to plan payoff math.",
            financial_impact="—",
            recommendation="Share the balance and APR to model payoff.",
            risk_level="low",
            confidence=0.4,
            metrics_used=[],
            follow_up_question="What's the outstanding balance and interest rate?",
        )
    dti = snapshot.debtToIncome
    return AssistantResponse(
        intent="debt",
        summary=f"Outstanding debt: {_inr(memory.debtBalance)}.",
        key_insight=(
            f"Debt-to-annual-income ratio: {_pct(dti)}." if dti is not None else "Debt-to-income needs monthly income."
        ),
        financial_impact="Higher-interest debt erodes savings rate every month.",
        recommendation="Snowball if motivation is the bottleneck; avalanche (highest-APR first) if pure cost matters.",
        risk_level="high" if dti is not None and dti > 0.5 else "medium",
        confidence=0.75,
        metrics_used=["debtToIncome"],
        follow_up_question="Want a snowball vs. avalanche comparison on these balances?",
    )


def _emotional(snapshot: FinancialSnapshot, memory: MemoryProfile, query: str) -> AssistantResponse:
    top = top_category(snapshot)
    return AssistantResponse(
        intent="emotional_spending",
        summary="Emotional spending shows up in spikes rather than averages.",
        key_insight=(
            f"{top[0]} is the largest line this month at {_inr(top[1])} — worth checking for impulse buys."
            if top
            else "Not enough data to spot impulse patterns."
        ),
        financial_impact="Untracked impulse spending often hides ₹2–5k/month.",
        recommendation="Add a 24-hour rule for any non-essential purchase above a set threshold.",
        risk_level="medium",
        confidence=0.6,
        metrics_used=["categoryTotals", "discretionaryRatio"],
        follow_up_question="Want to set an impulse-purchase threshold (e.g. ₹2000)?",
    )


def _lifestyle(snapshot: FinancialSnapshot, memory: MemoryProfile, query: str) -> AssistantResponse:
    if snapshot.budgetAmount == 0 and memory.monthlyIncome is None:
        return AssistantResponse(
            intent="lifestyle_tradeoff",
            summary="Tradeoff analysis needs either income or a budget to be honest.",
            key_insight=f"Discretionary spend this month: {_inr(snapshot.monthlySpent * snapshot.discretionaryRatio)}.",
            financial_impact="—",
            recommendation="Set a monthly budget or share income to ground this answer.",
            risk_level="low",
            confidence=0.4,
            metrics_used=["discretionaryRatio"],
            follow_up_question="What's the monthly amount you'd want to allocate to this category?",
        )
    available = headroom(snapshot, memory.monthlyIncome)
    safe = max(0.0, available * 0.3)
    return AssistantResponse(
        intent="lifestyle_tradeoff",
        summary=f"Available headroom this month: {_inr(available)}.",
        key_insight=(
            f"Discretionary spend already at {_pct(snapshot.discretionaryRatio)} of total. "
            f"Comfortable extra room is around {_inr(safe)}."
        ),
        financial_impact=(
            "Adding to this category would push the month over target."
            if available <= 0
            else f"Spending {_inr(safe)} keeps the savings rate intact."
        ),
        recommendation=(
            "Hold until next month or offset from another discretionary category."
            if available <= 0
            else f"Cap the extra spend at {_inr(safe)} and revisit at month-end."
        ),
        risk_level=(
            "high"
            if available <= 0
            else "medium"
            if snapshot.discretionaryRatio > 0.45
            else "low"
        ),
        confidence=0.78,
        metrics_used=["budgetRemaining", "discretionaryRatio", "monthlySpent"],
        follow_up_question="Want a specific weekly cap so it stays in the comfort zone?",
    )


def _planning(snapshot: FinancialSnapshot, memory: MemoryProfile, query: str) -> AssistantResponse:
    insight = f"Target on file: {_inr(memory.savingsTarget)}." if memory.savingsTarget else "No savings target captured yet."
    impact = (
        f"At {_pct(snapshot.savingsRate)} savings rate, monthly contribution is "
        f"{_inr((memory.monthlyIncome or 0) * snapshot.savingsRate)}."
        if snapshot.savingsRate is not None
        else "—"
    )
    return AssistantResponse(
        intent="financial_planning",
        summary="Planning needs a target and a horizon.",
        key_insight=insight,
        financial_impact=impact,
        recommendation="Pick one concrete goal (amount + date) and back into the monthly contribution.",
        risk_level="low",
        confidence=0.6,
        metrics_used=["savingsRate"],
        follow_up_question="What goal amount and target date should we plan against?",
    )


def _purchase(snapshot: FinancialSnapshot, memory: MemoryProfile, query: str) -> AssistantResponse:
    match = re.search(r"([0-9][0-9,]*(?:\.[0-9]+)?)", query or "")
    price = float(match.group(1).replace(",", "")) if match else None
    if price is None:
        return AssistantResponse(
            intent="purchase_decision",
            summary="Need a price to evaluate the purchase.",
            key_insight=f"Current month headroom: {_inr(headroom(snapshot, memory.monthlyIncome))}.",
            financial_impact="—",
            recommendation="Share the price (e.g. \"can I afford a 45000 phone\").",
            risk_level="low",
            confidence=0.4,
            metrics_used=["budgetRemaining"],
            follow_up_question="What's the price?",
        )
    available = headroom(snapshot, memory.monthlyIncome)
    fits = available > 0 and price <= available * 0.5
    stretches = price > available and price < available * 1.5
    summary = (
        f"{_inr(price)} fits within current headroom of {_inr(available)}."
        if fits
        else (
            f"{_inr(price)} stretches the month's headroom of {_inr(available)}."
            if stretches
            else f"{_inr(price)} exceeds available headroom of {_inr(available)}."
        )
    )
    rec = (
        "Proceed if it aligns with priorities."
        if fits
        else (
            "Delay 30 days or offset by trimming another category."
            if stretches
            else "Skip or save toward it over the next 1–2 months."
        )
    )
    return AssistantResponse(
        intent="purchase_decision",
        summary=summary,
        key_insight=(
            f"Purchase would consume {_pct(price / available) if available > 0 else 'more than 100%'} of remaining room."
        ),
        financial_impact=f"Post-purchase remaining: {_inr(available - price)}.",
        recommendation=rec,
        risk_level="low" if fits else "medium" if stretches else "high",
        confidence=0.82,
        metrics_used=["budgetRemaining", "monthlySpent"],
        follow_up_question="Want a 1–2 month sinking-fund plan for this?",
    )


def _income(snapshot: FinancialSnapshot, memory: MemoryProfile, query: str) -> AssistantResponse:
    if memory.monthlyIncome is None:
        return AssistantResponse(
            intent="income_analysis",
            summary="No income captured yet.",
            key_insight="Share your monthly take-home to ground income-side analysis.",
            financial_impact="—",
            recommendation="Tell me your monthly income (e.g. \"my salary is 90000\").",
            risk_level="low",
            confidence=0.4,
            metrics_used=[],
            follow_up_question="What's your typical monthly income?",
        )
    return AssistantResponse(
        intent="income_analysis",
        summary=f"Monthly income on file: {_inr(memory.monthlyIncome)}.",
        key_insight=f"Spend ratio this month: {_pct(snapshot.monthlySpent / memory.monthlyIncome)}.",
        financial_impact=f"Net this month: {_inr(memory.monthlyIncome - snapshot.monthlySpent)}.",
        recommendation="Keep total spend under 80% of income to maintain a 20% savings rate.",
        risk_level="high" if snapshot.monthlySpent > memory.monthlyIncome * 0.9 else "low",
        confidence=0.8,
        metrics_used=["monthlySpent", "savingsRate"],
        follow_up_question="Want to break the spend down vs income by category?",
    )


def _cashflow(snapshot: FinancialSnapshot, memory: MemoryProfile, query: str) -> AssistantResponse:
    if memory.monthlyIncome is None:
        return AssistantResponse(
            intent="cashflow_analysis",
            summary="Cashflow needs both income and outflow to be honest.",
            key_insight=f"Outflow this month: {_inr(snapshot.monthlySpent)}.",
            financial_impact="—",
            recommendation="Share monthly income to compute net cashflow and runway.",
            risk_level="low",
            confidence=0.5,
            metrics_used=["monthlySpent"],
            follow_up_question="What's your monthly income?",
        )
    net = memory.monthlyIncome - snapshot.monthlySpent
    return AssistantResponse(
        intent="cashflow_analysis",
        summary=f"Net monthly cashflow: {_inr(net)} ({_pct(net / memory.monthlyIncome)} of income).",
        key_insight=(
            f"Recurring fixed costs: {_inr(snapshot.recurringTotal)}; "
            f"discretionary: {_pct(snapshot.discretionaryRatio)}."
        ),
        financial_impact=(
            "Negative cashflow — drawing down reserves." if net < 0 else "Positive cashflow — available to allocate."
        ),
        recommendation=(
            "Cut the top discretionary category until cashflow turns positive."
            if net < 0
            else "Direct surplus to a savings or debt target."
        ),
        risk_level="high" if net < 0 else "low",
        confidence=0.84,
        metrics_used=["monthlyBurn", "recurringTotal", "discretionaryRatio"],
        follow_up_question="Want a 90-day cashflow projection?",
    )


def _recurring(snapshot: FinancialSnapshot, memory: MemoryProfile, query: str) -> AssistantResponse:
    if snapshot.recurringTotal == 0:
        return AssistantResponse(
            intent="recurring_expenses",
            summary="No recurring outflows detected this month.",
            key_insight="Tag bills, rent, or subscriptions as recurring to track fixed costs.",
            financial_impact="—",
            recommendation="Mark known fixed transactions as recurring.",
            risk_level="low",
            confidence=0.6,
            metrics_used=["recurringTotal"],
            follow_up_question="Which categories should I treat as recurring?",
        )
    share = snapshot.recurringTotal / snapshot.monthlySpent if snapshot.monthlySpent > 0 else 0.0
    return AssistantResponse(
        intent="recurring_expenses",
        summary=f"Recurring outflows: {_inr(snapshot.recurringTotal)} this month.",
        key_insight=f"That's {_pct(share)} of monthly spend locked in.",
        financial_impact=f"Annualized: {_inr(snapshot.recurringTotal * 12)}.",
        recommendation="Audit each line at least quarterly; cancel anything unused for 30 days.",
        risk_level="medium" if share > 0.5 else "low",
        confidence=0.82,
        metrics_used=["recurringTotal", "monthlySpent"],
        follow_up_question="Want a list of likely subscription line items?",
    )


def _general(snapshot: FinancialSnapshot, memory: MemoryProfile, query: str) -> AssistantResponse:
    return AssistantResponse(
        intent="general_finance_question",
        summary="Happy to explain the concept; analysis below uses your data where possible.",
        key_insight=(
            f"Context: {_inr(snapshot.monthlySpent)} spent this month across {snapshot.transactionCount} transactions."
            if snapshot.transactionCount > 0
            else "Add transactions and income for personalized analysis."
        ),
        financial_impact="—",
        recommendation="Ask a more specific question to get a grounded answer.",
        risk_level="low",
        confidence=0.55,
        metrics_used=["monthlySpent"] if snapshot.transactionCount > 0 else [],
        follow_up_question="Want to apply the concept to your numbers?",
    )


def _clarification(intent_result: IntentResult) -> AssistantResponse:
    guesses = " or ".join(intent_result.alternatives[:2]) if intent_result.alternatives else ""
    return AssistantResponse(
        intent="general_finance_question",
        summary="Not enough signal to classify the question confidently.",
        key_insight=f"Possible angles: {guesses}." if guesses else "The question is ambiguous.",
        financial_impact="—",
        recommendation="Rephrase with the specific category, time window, or amount in question.",
        risk_level="low",
        confidence=max(0.2, intent_result.confidence),
        metrics_used=[],
        follow_up_question="Are you asking about a specific category, a budget cap, or a one-off purchase?",
    )


_HANDLERS: dict[Intent, Callable[[FinancialSnapshot, MemoryProfile, str], AssistantResponse]] = {
    "spending_analysis": _spending,
    "budgeting": _budgeting,
    "subscriptions": _subscriptions,
    "savings": _savings,
    "investing": _investing,
    "debt": _debt,
    "emotional_spending": _emotional,
    "lifestyle_tradeoff": _lifestyle,
    "financial_planning": _planning,
    "purchase_decision": _purchase,
    "income_analysis": _income,
    "cashflow_analysis": _cashflow,
    "recurring_expenses": _recurring,
    "general_finance_question": _general,
}


def build_response(
    *,
    intent_result: IntentResult,
    snapshot: FinancialSnapshot,
    memory: MemoryProfile,
    query: str,
) -> AssistantResponse:
    if intent_result.intent is None:
        return _clarification(intent_result)
    handler = _HANDLERS.get(intent_result.intent)
    if handler is None:
        return _clarification(intent_result)
    base = handler(snapshot, memory, query)
    scaled = min(0.95, base.confidence * (0.6 + intent_result.confidence * 0.4))
    return base.model_copy(update={"confidence": scaled})
