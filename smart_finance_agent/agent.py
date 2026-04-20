from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_groq import ChatGroq
from config import GROQ_API_KEY, MODEL_NAME, TEMPERATURE
from memory import MemoryManager

def get_finance_advice(user_input: str, memory: MemoryManager) -> str:
    """
    Extracts user data, updates memory, and sends the context to the LLM.
    """
    if not user_input or not user_input.strip():
        return "Please provide a valid financial question."
        
    try:
        # 1. Extract user data -> update memory profile
        memory.extract_user_data(user_input)
        
        # Add user message to history
        memory.add_message("user", user_input.strip())
        
        # 2. Retrieve relevant stored memory
        profile = memory.user_profile
        
        # 3. Build system prompt
        system_prompt = (
            "You are a professional financial advisor.\n"
            "Use ONLY the provided user data in the memory context.\n"
            "If required data to give specific advice (like income, expenses, or goals) is missing, explicitly ask for it.\n"
            "Do NOT assume or guess any financial values. Do NOT infer values like income, savings, or risk level unless explicitly given.\n"
            "Always structure your answer with:\n"
            "1. Quick Summary\n"
            "2. Detailed Explanation\n"
            "3. Actionable Steps\n\n"
            "--- MEMORY CONTEXT ---\n"
            f"Income: {profile['income']}\n"
            f"Expenses: {profile['expenses']}\n"
            f"Savings Goal: {profile['savings_goal']}\n"
            f"Risk Level: {profile['risk_level']}\n"
            "----------------------"
        )
        
        # Initialize the ChatGroq model
        chat = ChatGroq(
            groq_api_key=GROQ_API_KEY,
            model_name=MODEL_NAME,
            temperature=TEMPERATURE
        )
        
        # Construct the messages starting with the system prompt
        messages = [SystemMessage(content=system_prompt)]
        
        # Append conversation history
        for msg in memory.conversation_history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))
                
        # 4. Send to LLM
        response = chat.invoke(messages)
        content = response.content
        
        # Add assistant message to history
        memory.add_message("assistant", content)
        
        return content
        
    except Exception as e:
        return f"An error occurred while fetching advice: {e}"
