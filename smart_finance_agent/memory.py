import re

class MemoryManager:
    def __init__(self):
        # Stores user profile
        self.user_profile = {
            "income": None,
            "expenses": None,
            "savings_goal": None,
            "risk_level": None
        }
        # Stores conversation history (sliding window)
        self.conversation_history = []
        self.max_history = 6
        
    def extract_user_data(self, user_input: str) -> dict:
        """
        Detects keywords like salary, expenses, goal and extracts values safely.
        Updates the user_profile in place and returns the updated fields.
        """
        updated_data = {}
        input_lower = user_input.lower()
        
        # 1. Extract Income / Salary
        if "salary" in input_lower or "income" in input_lower or "earn" in input_lower:
            match = re.search(r'(?:salary|income|earn)[^\d]*(\d+(?:,\d+)*(?:\.\d+)?)', input_lower)
            if match:
                val = match.group(1).replace(',', '')
                self.user_profile["income"] = float(val)
                updated_data["income"] = float(val)
                
        # 2. Extract Expenses / Spend
        if "expense" in input_lower or "spend" in input_lower or "rent" in input_lower:
            match = re.search(r'(?:expense|spend|rent)[^\d]*(\d+(?:,\d+)*(?:\.\d+)?)', input_lower)
            if match:
                val = match.group(1).replace(',', '')
                self.user_profile["expenses"] = float(val)
                updated_data["expenses"] = float(val)
                
        # 3. Extract Savings Goal
        if "goal" in input_lower or "save" in input_lower or "saving" in input_lower:
            match = re.search(r'(?:goal|save|saving)[^\d]*(\d+(?:,\d+)*(?:\.\d+)?)', input_lower)
            if match:
                val = match.group(1).replace(',', '')
                self.user_profile["savings_goal"] = float(val)
                updated_data["savings_goal"] = float(val)
                
        # 4. Extract Risk Level
        if "risk" in input_lower:
            if "high" in input_lower:
                self.user_profile["risk_level"] = "high"
                updated_data["risk_level"] = "high"
            elif "low" in input_lower:
                self.user_profile["risk_level"] = "low"
                updated_data["risk_level"] = "low"
            elif "medium" in input_lower or "moderate" in input_lower:
                self.user_profile["risk_level"] = "medium"
                updated_data["risk_level"] = "medium"
                
        return updated_data
        
    def add_message(self, role: str, content: str):
        """Adds a message to the sliding window conversation history."""
        self.conversation_history.append({"role": role, "content": content})
        if len(self.conversation_history) > self.max_history:
            self.conversation_history.pop(0)
            
    def get_memory_state_string(self) -> str:
        """Returns a formatted string of the current memory state for debugging."""
        state = "[Memory State]\n"
        for key, value in self.user_profile.items():
            state += f"{key}: {value}\n"
        return state.strip()
