class MemorySystem:
    def __init__(self):
        self.user_data = {}
        
    def update(self, expenses, budget):
        self.user_data["expenses"] = expenses
        self.user_data["budget"] = budget
        
    def get_context(self):
        budget = self.user_data.get("budget", {"total": 0, "used": 0})
        remaining = float(budget.get("total", 0)) - float(budget.get("used", 0))
        return f"User Budget: {budget.get('total', 0)}, Used: {budget.get('used', 0)}, Remaining: {remaining}."
