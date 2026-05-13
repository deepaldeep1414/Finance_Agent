# Finance Copilot

A grounded, analytical personal-finance assistant. The frontend ships as a static SPA; the backend is an optional FastAPI service that adds LLM-grounded responses.

## Architecture

```
index.html            single-page entry
style.css             single stylesheet
src/
  main.js             bootstrap
  state.js            typed app state
  types.js            JSDoc typedefs
  services/
    intent.js         semantic intent classifier (TF–IDF cosine)
    analysis.js       deterministic financial metrics
    insights.js       structured AssistantResponse generation
    memory.js         conversational memory extraction
    categorize.js     category + recurrence detection
    render.js         renderer with banned-phrase sanitization
    storage.js        localStorage layer
    llm.js            optional backend client
  ui/
    sidebar.js
    dashboard.js
    transactions.js
    budget.js
    memory.js
    chat.js
    auth.js
backend/
  app.py              FastAPI app
  schemas.py          pydantic AssistantResponse, FinancialSnapshot, IntentResult
  intent.py           semantic classifier (mirror of frontend)
  analysis.py         deterministic helpers
  insights.py         structured response generation
  llm.py              Groq client, JSON-structured output
  memory.py           in-process MemoryStore
  prompts.py          system prompt + output instruction
  config.py           pydantic-settings
```

## Behavior

1. Intent classification uses TF–IDF cosine similarity over canonical prototypes for each of the 14 supported intents.
2. Financial metrics are computed before insights are generated: monthly spend, budget variance, savings rate, discretionary ratio, recurring total, category totals and deltas, debt-to-income.
3. Every response is rendered from a strict `AssistantResponse` schema:
   ```json
   {
     "intent": "spending_analysis",
     "summary": "",
     "key_insight": "",
     "financial_impact": "",
     "recommendation": "",
     "risk_level": "low",
     "confidence": 0.0,
     "metrics_used": [],
     "follow_up_question": ""
   }
   ```
4. Ambiguous queries return a clarification with possible angles rather than a canned speech.
5. The renderer strips any banned phrasing before display.

## Run the frontend

```
python3 -m http.server 8080
# open http://localhost:8080
```

## Run the backend

```
pip install -r requirements.txt
GROQ_API_KEY=...  uvicorn backend.app:app --port 8000 --reload
```

If `GROQ_API_KEY` is unset, the backend falls back to the deterministic insight engine.

## Deployment

Netlify publishes the repo root as a static SPA. The backend is independent and not required for the frontend to function.
