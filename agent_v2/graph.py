import json
import os
from typing import TypedDict, Annotated, List, Dict, Any
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from memory import MemorySystem
from rag import retrieve_knowledge
from tools import can_afford, budget_analyzer
from dotenv import load_dotenv

# Load env vars
load_dotenv(os.path.join(os.path.dirname(__dirname), '.env'))

# Fallback or dummy key for local testing
if not os.getenv("GROQ_API_KEY") or "your_groq_api_key_here" in os.getenv("GROQ_API_KEY"):
    os.environ["GROQ_API_KEY"] = "mock_key_for_demo_if_needed"

# Try to initialize Groq, if it fails, we use a fallback mock pattern
try:
    llm = ChatGroq(model="llama3-8b-8192", temperature=0)
    USE_LLM = True
except Exception:
    USE_LLM = False

memory = MemorySystem()

class AgentState(TypedDict):
    query: str
    price: float
    context: str
    decision: str
    reason: str
    action: str
    expenses: List[Dict]
    budget: Dict
    analysis: str
    insights: List[str]
    confidence: float

# ================================
# PHASE 5: LANGGRAPH NODES
# ================================

def query_classifier_node(state: AgentState):
    """Fast routing node (optimized performance)"""
    query = state["query"].lower()
    if state["price"] > 0 and ("afford" in query or "buy" in query or "purchase" in query):
        return "tool_node"
    elif any(k in query for k in ["save", "invest", "rule", "debt", "emergency", "retirement", "credit", "wealth", "strategy", "plan", "tax", "inflation", "house", "insurance", "side hustle", "net worth", "allocation", "fire", "crypto", "volatility", "estate", "business", "will", "geo", "arbitrage", "recession", "generation", "child", "education", "predict"]):
        return "rag_node"
    elif state["action"] == "analyze_finances" or any(k in query for k in ["summarize", "overview", "spend", "history"]):
        return "multi_agent_analysis_node"
    else:
        return "complex_pipeline"

def tool_node(state: AgentState):
    """Phase 4: Deterministic Tools - Zero LLM Math"""
    expenses = state.get("expenses", [])
    budget = state.get("budget", {})
    total_spent = sum(float(e.get("amount", 0)) for e in expenses)
    remaining = float(budget.get("total", 0)) - total_spent
    
    result = can_afford(state["price"], remaining)
    state["decision"] = "YES" if result["decision"] == "allow" else "NO"
    state["reason"] = result["reason"]
    return state

def rag_node(state: AgentState):
    """Phase 3: High-Recall RAG"""
    docs = retrieve_knowledge(state["query"])
    state["decision"] = "INFO"
    state["reason"] = f"Financial Knowledge Retrieved: {' | '.join(docs)}"
    return state

def multi_agent_analysis_node(state: AgentState):
    """Phase 7: Multi-Agent System (Supervisor controlled)"""
    expenses = state.get("expenses", [])
    budget = state.get("budget", {})
    total_spent = sum(float(e.get("amount", 0)) for e in expenses)
    remaining = float(budget.get("total", 0)) - total_spent
    
    # Expense Analyst Agent component
    cat_totals = {}
    for e in expenses:
        cat_totals[e.get("category", "other")] = cat_totals.get(e.get("category", "other"), 0) + float(e.get("amount", 0))
    
    highest_cat = max(cat_totals, key=cat_totals.get) if cat_totals else "none"
    
    # Risk Manager Agent component
    risk_status = budget_analyzer(float(budget.get("total", 0)), total_spent)["status"]
    
    # Supervisor Agent enforces structure
    state["analysis"] = f"Total Spent: ${total_spent:.2f}. Remaining: ${remaining:.2f}."
    state["insights"] = [
        f"Risk Status: {risk_status.upper()}",
        f"Highest spending category is '{highest_cat}'.",
        "Consider cutting back if risk is high."
    ]
    return state

def complex_pipeline_node(state: AgentState):
    """General AI fallback / Phase 1: Core Agent"""
    if USE_LLM:
        try:
            system_prompt = """You are a highly skilled Financial Advisor AI. 
            Your goal is to provide accurate, actionable, and personalized financial advice.
            
            RULES:
            1. NEVER hallucinate numbers or data. Use only the provided context and history.
            2. If you don't know something, admit it and suggest a general safe rule.
            3. Always prioritize financial safety (emergency funds first).
            4. Be encouraging but realistic.
            5. Use the user's spending history to provide specific examples when possible.
            
            KNOWLEDGE BASE:
            - 50/30/20 Rule (Needs/Wants/Savings)
            - Emergency Funds (3-6 months)
            - Compound Interest benefits
            - Debt payoff strategies (Snowball vs Avalanche)
            - Tax Optimization (401k, Harvesting)
            - Asset Allocation (Risk Tolerance)
            - Inflation Protection (Stocks, Real Estate)
            - Life Events (Housing, Insurance)
            - FIRE Movement (Financial Independence)
            - Behavioral Finance (FOMO, Volatility)
            - Advanced Vehicles (Crypto, Trusts, LLCs)
            - Grandmaster Topics (Geo-arbitrage, Recession Prep, Credit Engineering)
            - Generational Wealth (529s, Education, Inheritance)
            """
            
            msg = llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"User Query: {state['query']} \n Context: {state['context']} \n Spending History: {json.dumps(state['expenses'])}")
            ])
            state["reason"] = msg.content
        except Exception:
            state["reason"] = "Could not process request via LLM. Please verify your Groq API Key."
    else:
        state["reason"] = "LLM not configured (missing valid Groq API key). Running in fast-mode only."
    
    state["decision"] = "NEUTRAL"
    return state

def reflection_node(state: AgentState):
    """Phase 6: Reflection & Accuracy System"""
    query = state["query"].lower()
    reason = state["reason"].lower()
    
    # Calculate Accuracy/Confidence Score
    score = 1.0
    
    # Penalize for vague answers on specific queries
    if any(k in query for k in ["how much", "total", "balance"]) and not any(char.isdigit() for char in state["reason"]):
        score -= 0.3
    
    # Penalize for missing safety warnings on high-risk topics
    if any(k in query for k in ["crypto", "invest", "buy"]) and "risk" not in reason:
        score -= 0.2
        
    state["confidence"] = max(0.1, score)
    
    if state["confidence"] < 0.8:
        state["reason"] = f"[Accuracy Warning: {state['confidence']*100}%] " + state["reason"] + "\n\nNote: I am still refining my advice for this specific topic. Please consult a human professional for high-stakes decisions."
    
    return state

# ================================
# BUILD LANGGRAPH WORKFLOW
# ================================

workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("query_classifier", lambda s: s) # Passthrough for branching
workflow.add_node("tool_node", tool_node)
workflow.add_node("rag_node", rag_node)
workflow.add_node("multi_agent_analysis_node", multi_agent_analysis_node)
workflow.add_node("complex_pipeline_node", complex_pipeline_node)
workflow.add_node("reflection_node", reflection_node)

# Add edges
workflow.set_entry_point("query_classifier")

workflow.add_conditional_edges(
    "query_classifier",
    query_classifier_node,
    {
        "tool_node": "tool_node",
        "rag_node": "rag_node",
        "multi_agent_analysis_node": "multi_agent_analysis_node",
        "complex_pipeline": "complex_pipeline_node"
    }
)

workflow.add_edge("tool_node", END)
workflow.add_edge("rag_node", END)
workflow.add_edge("multi_agent_analysis_node", END)
workflow.add_edge("complex_pipeline_node", "reflection_node")
workflow.add_edge("reflection_node", END)

# Compile the Graph
app = workflow.compile()

# ================================
# EXPOSED ENTRY POINT
# ================================

def run_agent(action, payload):
    memory.update(payload.get("expenses", []), payload.get("budget", {}))
    
    initial_state = AgentState(
        query=payload.get("query", ""),
        price=float(payload.get("price", 0)),
        context=memory.get_context(),
        decision="",
        reason="",
        action=action,
        expenses=payload.get("expenses", []),
        budget=payload.get("budget", {}),
        analysis="",
        insights=[],
        confidence=1.0
    )
    
    # Run through the compiled LangGraph pipeline
    final_state = app.invoke(initial_state)
    
    if action == "analyze_finances":
        return {
            "analysis": final_state["analysis"],
            "insights": final_state["insights"]
        }
    else:
        return {
            "decision": final_state["decision"],
            "reason": final_state["reason"],
            "confidence": final_state.get("confidence", 1.0)
        }
