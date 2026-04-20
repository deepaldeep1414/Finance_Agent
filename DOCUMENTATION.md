# 📚 Technical Documentation: Smart Finance AI Agent

This document provides a deep-dive into the architecture, logic, and design systems powering the **Grandmaster Finance AI Agent**.

---

## 1. System Architecture
The project follows a **Modular Full-Stack Architecture**, separating the presentation layer from the agentic reasoning engine.

### 🏗️ High-Level Component Map
- **Frontend (UI Layer)**: Vanilla JS, CSS3, HTML5. Handles state persistence and real-time visualization.
- **API Bridge (Express)**: A Node.js middleware that facilitates communication between the browser and the Python environment.
- **Agentic Core (LangGraph)**: A stateful directed acyclic graph (DAG) that manages the AI's "thought process."

---

## 2. The 7-Phase Agentic Workflow
The AI's reasoning is built on a 7-phase architecture designed for accuracy and safety.

1.  **Intent Classification**: Fast routing to determine if the query is a Transaction, an Advisory Request, or a Strategic Question.
2.  **Deterministic Tool-Use**: Financial math is offloaded to Python functions (`tools.py`) to prevent LLM hallucinations.
3.  **Retrieval-Augmented Generation (RAG)**: Expert data is pulled from `rag.py` to ground the AI in verified financial principles.
4.  **Contextual Memory**: The agent tracks the current session and previous interactions via `memory.py`.
5.  **Stateful Reasoning**: The LangGraph engine (`graph.py`) maintains the conversation state across multiple turns.
6.  **Self-Reflection & Scoring**: A verification node that assigns an accuracy score (80-95%) to each response.
7.  **Fiduciary Guardrails**: Final filtering to ensure advice adheres to safety standards (e.g., risk warnings for crypto).

---

## 3. Frontend Systems

### 🎨 Design System: Glassmorphism 2.0
The UI uses a **High-Contrast Dark Mode** with:
- **Backdrop-filter (Blur)**: To create the "Frosted Glass" effect.
- **CSS Variable Tokens**: For consistent primary (Neon Purple), success (Green), and danger (Red) colors.
- **Custom Scrollbars & Transitions**: For a premium, app-like feel.

### 📈 Dynamic SVG Engine
Instead of using external libraries (Chart.js), the dashboard utilizes a custom-built **SVG Rendering Logic** (`Charts.renderDynamicSVG`).
- **Precision**: Calculates angles based on categorical percentages.
- **Aesthetics**: Uses a high-contrast rainbow palette to ensure distinct category separation.

---

## 4. API Reference (Backend)

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/add-expense` | `POST` | Logs a new transaction and updates the budget. |
| `/api/get-expenses` | `GET` | Retrieves the history of all transactions. |
| `/api/set-budget` | `POST` | Updates the monthly/period budget limit. |
| `/api/ai-decision` | `POST` | Sends a natural language query to the LangGraph brain. |

---

## 5. Advanced Financial Knowledge
The agent is "Grandmaster Trained" on the following domains:

- **The FIRE Movement**: Calculation of the 4% rule and "25x Expenses" goal.
- **Tax Optimization**: Concepts of Harvesting and 401(k) efficiency.
- **Geo-Arbitrage**: Strategies for relocating income-to-expense ratios.
- **Behavioral Psychology**: Techniques for managing FOMO and lifestyle creep.
- **Generational Wealth**: Implementation of 529 plans and trust-based inheritance.

---

## 6. Deployment & Scaling
- **Frontend**: Optimized for Vercel/Netlify.
- **Backend/AI**: Recommended hosting on Render or Railway to support the Python/Node hybrid environment.
- **Environment Management**: Utilizes `.env` for secure credential storage and `.gitignore` for security.

---

## 🛡️ Fiduciary Disclaimer
The Smart Finance Agent is designed to be a **Fiduciary Mentor**. It prioritizes user safety over speculative gains and is programmed to warn users about the risks of high-volatility assets.

*Documentation Version: 1.0 (Grandmaster)*
