KNOWLEDGE: dict[str, str] = {
    "emergency fund": (
        "An emergency fund should cover 3–6 months of living expenses. "
        "Keep it in a liquid high-yield savings account, NOT invested in stocks."
    ),
    "50/30/20": (
        "The 50/30/20 rule: allocate 50 % of net income to Needs (rent, food, bills), "
        "30 % to Wants (dining, hobbies), and 20 % to Savings & Debt repayment."
    ),
    "debt snowball": (
        "Pay the smallest debt first for psychological wins, then roll that payment "
        "into the next smallest. Contrast: debt avalanche targets highest interest first."
    ),
    "index fund": (
        "Index funds track a market index (e.g. Nifty 50, S&P 500). They offer broad "
        "diversification, ultra-low fees, and historically beat most active managers long-term."
    ),
    "retirement": (
        "Target saving 15 % of gross income for retirement. Use tax-advantaged accounts "
        "first: PPF, NPS, 401(k)/IRA. Compound interest does the heavy lifting — start early."
    ),
    "credit score": (
        "Maintain a high credit score: pay on time (35 % weight), keep utilisation < 30 % "
        "(30 % weight), keep oldest accounts open, limit hard enquiries."
    ),
    "compound interest": (
        "Compound interest means earning returns on your returns. ₹10 000 at 12 % for "
        "30 years grows to ~₹3 00 000. Time in the market beats timing the market."
    ),
    "net worth": (
        "Net Worth = Total Assets − Total Liabilities. Track it quarterly. "
        "Growing net worth, not income, is the real measure of financial progress."
    ),
    "tax optimization": (
        "Minimize taxes via: 80C deductions (PPF, ELSS, LIC) up to ₹1.5 L, NPS 80CCD(1B) "
        "extra ₹50 k, HRA exemption, Tax-Loss Harvesting on equity investments."
    ),
    "inflation": (
        "Inflation erodes purchasing power. Beat it by holding equities, real estate, "
        "and inflation-linked bonds (RBI Floating Rate Bonds, I-Bonds). Avoid holding "
        "excess cash in low-interest accounts."
    ),
    "lifestyle creep": (
        "Lifestyle creep = spending rises with income. Counter it by automating a savings "
        "increase with every raise before your expenses can adjust upward."
    ),
    "fire": (
        "FIRE (Financial Independence, Retire Early): save aggressively (50–70 % of income), "
        "invest in low-cost index funds, target 25× annual expenses (4 % safe withdrawal rule). "
        "Variants: LeanFIRE (frugal), FatFIRE (high spending), CoastFIRE (enough invested to coast)."
    ),
    "crypto": (
        "Cryptocurrency is high-risk, high-volatility. Limit exposure to 1–5 % of total portfolio. "
        "Stick to established assets (BTC, ETH). NEVER invest money you cannot afford to lose. "
        "Regulatory risk is real — treat as speculative, not savings."
    ),
    "geo arbitrage": (
        "Geo-arbitrage: earn in a high-income currency while living in a low-cost-of-living region. "
        "Popular with digital nomads. Can 2–3× your effective purchasing power and dramatically "
        "accelerate FIRE timelines."
    ),
    "credit engineering": (
        "To engineer an 800+ score: keep all cards at 0 balance except one (< 5 % utilisation), "
        "request limit increases every 6 months, never close your oldest card, avoid hard pulls."
    ),
    "recession prep": (
        "Recession-proof your finances: 8–12 month cash buffer, eliminate high-interest debt, "
        "focus on defensive stocks (Healthcare, Utilities, Consumer Staples), keep job skills sharp."
    ),
    "generational wealth": (
        "Build generational wealth via: 529 / education savings plans, UTMA/UGMA accounts for minors, "
        "annual gift-tax exclusion (currently $18 000/year in US), term life insurance, and a will/trust."
    ),
    "estate planning": (
        "Estate planning essentials: a valid Will, beneficiary designations on ALL accounts, "
        "a Living Trust for complex estates, healthcare proxy, and durable power of attorney."
    ),
    "side hustle": (
        "Side hustle principles: pick a skill the market pays for, track ALL income/expenses "
        "for tax deductions, reinvest early profits, aim to replace 50 % of salary before quitting day job."
    ),
    "house buying": (
        "House buying rule of thumb: 20 % down payment (avoid PMI), total EMI ≤ 28 % of gross income, "
        "total debt ≤ 36 % of gross income. Renting is not 'throwing money away' — compare rent vs buy carefully."
    ),
    "market volatility": (
        "During volatile markets: don't panic sell, don't try to time the market, keep investing (SIP/DCA), "
        "rebalance annually. Volatility is the price of long-term equity returns."
    ),
    "fomo": (
        "FOMO (Fear Of Missing Out) causes impulsive, speculative investments. "
        "Antidote: write your Investment Policy Statement, stick to it, avoid financial social media."
    ),
}


def retrieve(query: str, top_k: int = 3) -> list[str]:
    """Return the most relevant knowledge chunks for a query."""
    q = query.lower()
    results = []

    # Exact-key matches first
    for key, val in KNOWLEDGE.items():
        if key in q:
            results.append(val)
            if len(results) >= top_k:
                return results

    # Partial word matches if we need more
    if len(results) < top_k:
        for key, val in KNOWLEDGE.items():
            if val not in results:
                words = key.split()
                if any(w in q for w in words):
                    results.append(val)
                    if len(results) >= top_k:
                        return results

    if not results:
        results.append(
            "Core rule: spend less than you earn, invest the difference consistently "
            "in low-cost diversified index funds, maintain an emergency fund."
        )
    return results[:top_k]