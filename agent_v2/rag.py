# Dummy RAG implementation for high-recall without heavy dependencies
# In a real app this would use a vector DB like Chroma or FAISS.

FINANCE_KNOWLEDGE = {
    "emergency fund": "An emergency fund should cover 3 to 6 months of living expenses. Keep it in a liquid, high-yield savings account.",
    "50/30/20 rule": "Allocate 50% of income to needs (rent, bills), 30% to wants (dining, hobbies), and 20% to savings and debt repayment.",
    "debt snowball": "Pay off smallest debts first to build psychological momentum, then move to larger ones.",
    "index funds": "Index funds provide broad market exposure, low fees, and are great for long-term wealth building.",
    "retirement": "Aim to save 15% of your gross income for retirement. Utilize tax-advantaged accounts like 401(k) or IRA.",
    "investing": "Diversify your portfolio across stocks, bonds, and real estate to manage risk while seeking returns.",
    "credit score": "Maintain a high credit score by paying bills on time and keeping credit utilization below 30%.",
    "frugality": "Focus on value-based spending. Cut costs on things that don't bring joy to save for what does.",
    "compound interest": "The 'eighth wonder of the world'. Small amounts invested regularly can grow significantly over decades.",
    "net worth": "Calculated by subtracting total liabilities from total assets. Track it quarterly to measure progress.",
    "tax optimization": "Minimize tax liability through 401(k) contributions, Tax-Loss Harvesting, and utilizing long-term capital gains rates.",
    "asset allocation": "Balance risk and reward by apportioning a portfolio's assets according to an individual's goals, risk tolerance, and investment horizon.",
    "inflation": "Protect against inflation by investing in assets that appreciate over time, like stocks, real estate, and TIPS (Treasury Inflation-Protected Securities).",
    "house buying": "Aim for a 20% down payment to avoid PMI. Keep your total monthly housing cost below 28% of your gross income.",
    "lifestyle creep": "The tendency to increase spending as income rises. Avoid this by automating your savings increases with every raise.",
    "insurance": "Ensure you have adequate health, term life, and disability insurance to protect your financial foundation.",
    "side hustle": "Diversify income streams through freelancing or passive income projects to accelerate financial independence (FIRE).",
    "FIRE movement": "Financial Independence, Retire Early. Concepts include 'FatFIRE' (high spending), 'LeanFIRE' (extreme frugality), and 'CoastFIRE' (invested enough that you don't need to save more).",
    "market volatility": "Stay the course during downturns. Market timing is nearly impossible; time IN the market beats timing the market.",
    "FOMO": "Fear Of Missing Out. Avoid speculative 'hype' investments. Stick to your long-term plan and diversification strategy.",
    "cryptocurrency": "High-risk, high-reward asset. Limit exposure to 1-5% of your total portfolio. Prioritize established assets like Bitcoin and Ethereum.",
    "estate planning": "Ensure your legacy is protected. Create a will, name beneficiaries, and consider a trust for complex asset distribution.",
    "emergency fund v2": "Once debt-free, expand your emergency fund to 6-12 months if you are self-employed or in a volatile industry.",
    "business structure": "Consider an LLC to protect personal assets if freelancing. Track all business expenses for tax deductions (Schedule C).",
    "opportunity cost": "The loss of potential gain from other alternatives when one alternative is chosen. Always consider what your money could be doing elsewhere.",
    "geo-arbitrage": "Lowering your cost of living by moving to a location with a lower cost of living while maintaining your income level. Popular in digital nomadism.",
    "credit engineering": "Optimize your credit score by using the 'all zero but one' method for utilization, requesting credit limit increases, and never closing old accounts.",
    "recession prep": "Build an extra-large cash buffer, pay down high-interest debt, and focus on non-cyclical, defensive stocks (Healthcare, Utilities).",
    "generational wealth": "Use 529 plans for education, set up UTMA/UGMA accounts for children, and utilize the annual gift tax exclusion to pass down wealth.",
    "predictive analytics": "Analyze historical spending patterns to forecast future expenses. For example, if you overspend every December, start a 'Sinking Fund' in January.",
    "fiduciary standard": "The highest legal and ethical standard. As your agent, I aim to provide advice that is purely in your best interest, free of conflicts."
}

def retrieve_knowledge(query, top_k=3):
    query = query.lower()
    results = []
    for key, val in FINANCE_KNOWLEDGE.items():
        if key in query:
            results.append(val)
    if not results:
        results.append("General rule: Keep expenses below income and save consistently.")
    return results[:top_k]
