# Finance Copilot — Technical Documentation

## System overview

Finance Copilot is a personal-finance assistant built around three layered concerns:

1. **Intent classification** — semantic similarity over a small set of canonical prototypes.
2. **Financial analysis** — deterministic computation of metrics from logged transactions, budget, and stored profile.
3. **Insight generation and rendering** — a structured `AssistantResponse` is produced per request and rendered through a single template that enforces tone and removes banned phrasing.

The frontend is a self-sufficient static SPA. The backend (FastAPI) is optional: when a `GROQ_API_KEY` is configured it produces structured LLM responses that satisfy the same schema; otherwise it returns the same deterministic answer the frontend would produce locally.

## Response schema

| Field | Type | Description |
| --- | --- | --- |
| `intent` | enum | One of the 14 supported intents. |
| `summary` | string | Single-sentence headline, ≤ 3 sentences. |
| `key_insight` | string | The grounded observation behind the summary. |
| `financial_impact` | string | Numerical impact line (uses ₹). |
| `recommendation` | string | Concrete next action. |
| `risk_level` | `low` \| `medium` \| `high` | Derived from variance, discretionary ratio, savings rate. |
| `confidence` | number | 0–1 model-or-rule confidence. |
| `metrics_used` | array | Names of the metrics referenced in the answer. |
| `follow_up_question` | string | A single clarifying question for continuity. |

## Supported intents

`spending_analysis`, `budgeting`, `subscriptions`, `savings`, `investing`, `debt`, `emotional_spending`, `lifestyle_tradeoff`, `financial_planning`, `purchase_decision`, `income_analysis`, `cashflow_analysis`, `recurring_expenses`, `general_finance_question`.

## Intent classification

Both the frontend (`src/services/intent.js`) and backend (`backend/intent.py`) tokenize the query, expand tokens through a synonym map, build a sparse count vector, and compute cosine similarity against per-intent prototype vectors built from canonical example phrases. A top-score threshold (0.18) and an ambiguity margin (0.05) decide between a confident classification and a clarification fallback.

## Financial analysis

`computeSnapshot` derives a `FinancialSnapshot`:

- `monthlySpent`, `totalSpent`, `transactionCount`
- `budgetAmount`, `budgetRemaining`, `budgetVariance`
- `savingsRate` (if income is known), `discretionaryRatio`, `essentialRatio`
- `recurringTotal`, `debtToIncome`
- `categoryTotals` and month-over-month `categoryDeltas`

Insights consume the snapshot and never invent figures.

## Fallback behavior

When `classifyIntent` returns no intent above threshold, the system asks a concise clarification. When required data is missing (income, debt balance, price), the response sets `confidence ≤ 0.5` and prompts for the missing input.

## Tone enforcement

The renderer applies a list of banned-phrase regexes (`grandmaster`, `dynasty`, `wealth architect`, etc.) and strips matches before display. The system prompt for the LLM is a fiduciary-planner brief; the deterministic engine never produces motivational copy.

## Memory

Memory captures `monthlyIncome`, `savingsTarget`, `debtBalance`, and tag-based `priorities`. Updates are extracted from chat input via tight regexes and via the Profile panel. The store is intentionally minimal and never represents a relationship.

## Backend endpoints

- `POST /api/intent` → `IntentResult`
- `POST /api/finance` → `AssistantResponse`
- `GET /api/health` → status

## Limitations

- Currency is rendered as INR; multi-currency support is not implemented.
- The synonym list is hand-curated rather than embedding-derived; full semantic embeddings would require a model in the runtime.
- The memory store is per-process and not persistent server-side; persistence lives in browser `localStorage`.
