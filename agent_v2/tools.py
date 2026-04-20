def savings_calculator(income, expenses):
    return max(0, income - expenses)

def budget_analyzer(budget_total, used):
    remaining = budget_total - used
    status = "healthy" if remaining > (budget_total * 0.2) else "at risk"
    return {"remaining": remaining, "status": status}

def can_afford(price, budget_remaining):
    price = float(price)
    if price > budget_remaining:
        return {"decision": "reject", "reason": f"Item price (${price:.2f}) exceeds remaining budget (${budget_remaining:.2f})."}
    else:
        return {"decision": "allow", "reason": f"You can afford this. Remaining after purchase: ${budget_remaining - price:.2f}."}

# Tools mapping for simple execution
TOOLS = {
    "can_afford": can_afford,
    "budget_analyzer": budget_analyzer
}
