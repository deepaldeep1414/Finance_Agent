from __future__ import annotations

import math
import re
from collections import Counter
from typing import Iterable

from .schemas import Intent, IntentResult

_STOPWORDS: frozenset[str] = frozenset(
    {
        "the","a","an","is","are","was","were","be","been","being","do","does","did",
        "have","has","had","i","me","my","mine","you","your","yours","we","our","ours",
        "they","them","their","this","that","these","those","of","to","for","with",
        "in","on","at","by","from","as","it","its","or","and","but","if","then","so",
        "can","could","should","would","will","shall","may","might","must","just",
        "any","some","more","less","much","many","how","what","when","where","why","who",
        "about","into","than","too","very","also","over","under","up","down","out","off",
    }
)

_SYNONYMS: dict[str, list[str]] = {
    "spend": ["spent","spending","expense","expenses","expenditure","outflow","outflows","cost","costs","paid","paying"],
    "save": ["saving","savings","stash","reserve"],
    "budget": ["budgeting","cap","caps","allocation","allocations","envelope"],
    "invest": ["investing","investment","investments","portfolio","stocks","bonds","equities","etf","etfs","401k","ira"],
    "debt": ["loan","loans","mortgage","emi","emis","borrowed","owe","owed","liability","liabilities"],
    "subscription": ["subscriptions","membership","memberships"],
    "income": ["salary","earnings","wage","wages","paycheck","paychecks","earn","earning"],
    "cashflow": ["burn","runway","liquidity"],
    "purchase": ["buy","buying","afford","purchase","purchasing"],
    "emotional": ["stressed","stress","anxious","anxiety","guilt","guilty","impulse","impulsive"],
    "lifestyle": ["dating","nightlife","clubs","clubbing","hobby","hobbies","leisure"],
    "planning": ["planning","goal","goals","milestone","milestones"],
    "recurring": ["recurring","weekly","utilities"],
    "analyze": ["analyze","analysis","review","breakdown","summary","summarize","overview","trend","trends"],
}

_INTENT_PROTOTYPES: dict[Intent, list[str]] = {
    "spending_analysis": [
        "show me my spending breakdown",
        "where is my money going",
        "analyze my expenses",
        "what did i spend the most on",
        "give me a spending summary",
        "review my recent expenses",
        "biggest category this month",
        "trend in my spending",
    ],
    "budgeting": [
        "help me set a budget",
        "is my budget realistic",
        "am i over budget",
        "how much budget remaining",
        "should i raise or lower my budget",
        "envelope budgeting",
        "monthly budget allocation",
    ],
    "subscriptions": [
        "which subscriptions am i paying for",
        "cancel a subscription",
        "review my recurring subscriptions",
        "netflix spotify prime membership",
        "auto-pay services running",
    ],
    "savings": [
        "how much should i save",
        "what is my savings rate",
        "emergency fund target",
        "boost my savings",
        "save more each month",
    ],
    "investing": [
        "should i invest in index funds",
        "portfolio allocation",
        "what to do with extra cash",
        "401k vs ira",
        "stocks bonds split",
    ],
    "debt": [
        "how do i pay off debt",
        "debt snowball or avalanche",
        "credit card balance",
        "loan repayment plan",
        "should i refinance",
    ],
    "emotional_spending": [
        "i shop when i am stressed",
        "impulse buying",
        "retail therapy",
        "i spend when i feel sad",
        "guilt after spending",
    ],
    "lifestyle_tradeoff": [
        "can i spend more on dating",
        "can i afford to go out more",
        "is my social spending too high",
        "balance fun and saving",
        "spending on hobbies vs goals",
    ],
    "financial_planning": [
        "how do i reach financial independence",
        "retirement planning",
        "long term goals",
        "savings milestone plan",
        "fire timeline",
        "help me think about retirement",
        "plan for the future",
    ],
    "purchase_decision": [
        "can i afford a 80000 laptop",
        "should i buy a new phone",
        "is this purchase a good idea",
        "afford a 50000 jacket",
    ],
    "income_analysis": [
        "review my income",
        "is my salary enough",
        "income variability",
        "side income breakdown",
    ],
    "cashflow_analysis": [
        "what is my monthly cashflow",
        "how is my cashflow",
        "cashflow this month",
        "net inflow vs outflow",
        "burn rate",
        "runway in months",
        "liquidity position",
    ],
    "recurring_expenses": [
        "list my recurring bills",
        "monthly fixed costs",
        "rent utilities and emi totals",
        "recurring outflows",
        "how much do i pay in rent and utilities",
        "weekly recurring charges",
    ],
    "general_finance_question": [
        "what is the 50 30 20 rule",
        "how does compound interest work",
        "explain credit score",
        "what is an etf",
    ],
}

_MIN_CONFIDENCE = 0.22
_AMBIGUITY_MARGIN = 0.05

_TOKEN_RX = re.compile(r"[a-z0-9]+")


def _expand(token: str) -> Iterable[str]:
    for key, group in _SYNONYMS.items():
        if token == key or token in group:
            yield key
            yield from group
            yield token
            return
    yield token


def _tokenize(text: str) -> list[str]:
    raw = _TOKEN_RX.findall(text.lower())
    out: set[str] = set()
    for t in raw:
        if t in _STOPWORDS:
            continue
        for e in _expand(t):
            out.add(e)
    return list(out)


def _cosine(a: Counter[str], b: Counter[str]) -> float:
    if not a or not b:
        return 0.0
    dot = sum(a[k] * b[k] for k in a if k in b)
    na = math.sqrt(sum(v * v for v in a.values()))
    nb = math.sqrt(sum(v * v for v in b.values()))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


_PROTOTYPE_VECTORS: dict[Intent, list[Counter[str]]] = {
    intent: [Counter(_tokenize(example)) for example in examples]
    for intent, examples in _INTENT_PROTOTYPES.items()
}


def _best_score(query_vec: Counter[str], example_vecs: list[Counter[str]]) -> float:
    best = 0.0
    for ex in example_vecs:
        score = _cosine(query_vec, ex)
        if score > best:
            best = score
    return best


def classify_intent(query: str) -> IntentResult:
    vec: Counter[str] = Counter(_tokenize(query))
    scored: list[tuple[Intent, float]] = sorted(
        ((intent, _best_score(vec, examples)) for intent, examples in _PROTOTYPE_VECTORS.items()),
        key=lambda x: x[1],
        reverse=True,
    )
    if not scored:
        return IntentResult(intent=None, confidence=0.0, alternatives=[])
    top, top_score = scored[0]
    if top_score < _MIN_CONFIDENCE:
        alternatives = [intent for intent, _ in scored[:3]]
        return IntentResult(intent=None, confidence=top_score, alternatives=alternatives)
    second = scored[1] if len(scored) > 1 else None
    if second and top_score - second[1] < _AMBIGUITY_MARGIN:
        return IntentResult(
            intent=top,
            confidence=min(1.0, top_score),
            alternatives=[top, second[0]],
        )
    return IntentResult(intent=top, confidence=min(1.0, top_score), alternatives=[top])
