from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from config.settings import GROQ_API_KEY

def run_finance_agent(user_input: str) -> str:
    """
    Core function to process user's financial queries using Groq LLM.
    
    Args:
        user_input (str): The user's financial question.
        
    Returns:
        str: The structured response from the AI agent.
    """
    if not user_input or not user_input.strip():
        return "Error: Input cannot be empty. Please provide a valid financial question."
        
    try:
        # Initialize the ChatGroq model
        # Using temperature 0 for factual, consistent financial advice
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0,
            groq_api_key=GROQ_API_KEY
        )
        
        # Define a strong system prompt enforcing practical, structured advice
        system_prompt = """You are an expert, practical, and highly realistic Financial Advisor AI.
Your goal is to provide structured, step-by-step, and actionable financial advice.

Constraints & Guidelines:
1. Be extremely practical and realistic. Avoid vague advice like "save more money".
2. Use bullet points and structured formats (e.g., Budget Breakdowns, Action Plans) when helpful.
3. If relevant, consider the Indian financial context (e.g., INR currency, PPF, FD, Mutual Funds, Tax Saving schemes like 80C) when the user mentions INR, Rs, or Indian context.
4. Give concrete examples whenever possible to explain concepts.
5. Risk Awareness: Always add a brief disclaimer that this is educational and not professional financial advice. Do NOT recommend specific risky stocks or crypto.
6. Explain concepts in simple terms that a beginner can understand.
"""
        
        # Prepare the messages
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_input)
        ]
        
        # Get response from the model
        response = llm.invoke(messages)
        return response.content
        
    except Exception as e:
        return f"An error occurred while processing your request: {str(e)}"
