import { topCategory, biggestMover } from "./analysis.js";

const INR = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const PCT = (n) => `${Math.round((Number(n) || 0) * 100)}%`;

function risk({ budgetVariance, discretionaryRatio, savingsRate }) {
  if (budgetVariance > 0.15 || discretionaryRatio > 0.5) return "high";
  if (budgetVariance > 0 || (savingsRate !== null && savingsRate < 0.1)) return "medium";
  return "low";
}

function emptyState(intent, snapshot) {
  return {
    intent,
    summary: "There isn't enough transaction data yet to ground this answer.",
    key_insight: "Log a few expenses and a monthly budget so the analysis can use real numbers.",
    financial_impact: "—",
    recommendation: "Add 5–10 recent transactions and set a monthly budget to enable grounded analysis.",
    risk_level: "low",
    confidence: 0.4,
    metrics_used: [],
    follow_up_question: "What's your typical monthly income and budget?",
  };
}

function metricsList(...names) {
  return names.filter(Boolean);
}

function spendingAnalysis(snapshot, memory) {
  if (snapshot.transactionCount === 0) return emptyState("spending_analysis", snapshot);
  const top = topCategory(snapshot);
  const mover = biggestMover(snapshot);
  const moverLine =
    mover && Math.abs(mover.delta) > 0
      ? `${mover.category} ${mover.delta > 0 ? "up" : "down"} ${INR(Math.abs(mover.delta))} vs last month.`
      : "No major month-over-month change yet.";
  return {
    intent: "spending_analysis",
    summary: `This month: ${INR(snapshot.monthlySpent)} across ${snapshot.transactionCount} transactions.`,
    key_insight: top
      ? `Largest category is ${top.category} at ${INR(top.amount)} (${PCT(top.amount / snapshot.monthlySpent)} of the month). ${moverLine}`
      : moverLine,
    financial_impact: `Discretionary spending is ${PCT(snapshot.discretionaryRatio)} of the month; recurring is ${INR(snapshot.recurringTotal)}.`,
    recommendation: top
      ? `Cap ${top.category} at the prior-month level for the next 30 days and reassess.`
      : "Continue tracking; one more month of data will reveal trends.",
    risk_level: risk(snapshot),
    confidence: 0.82,
    metrics_used: metricsList("monthlySpent", "categoryTotals", "categoryDeltas", "discretionaryRatio", "recurringTotal"),
    follow_up_question: "Want a per-category breakdown or a 30-day spending cap?",
  };
}

function budgeting(snapshot) {
  if (snapshot.budgetAmount === 0) {
    return {
      intent: "budgeting",
      summary: "No monthly budget is set, so variance can't be measured.",
      key_insight: `Month-to-date spend is ${INR(snapshot.monthlySpent)}.`,
      financial_impact: "Without a budget, overspend can compound silently.",
      recommendation: "Set a monthly budget on the Budget page based on the last 1–2 months of spend.",
      risk_level: "medium",
      confidence: 0.7,
      metrics_used: ["monthlySpent"],
      follow_up_question: "Want a suggested budget based on your recent spending?",
    };
  }
  const variance = snapshot.budgetVariance;
  const remaining = snapshot.budgetRemaining;
  return {
    intent: "budgeting",
    summary: `Spent ${INR(snapshot.monthlySpent)} of ${INR(snapshot.budgetAmount)} (${PCT(Math.min(1, snapshot.monthlySpent / snapshot.budgetAmount))}).`,
    key_insight:
      variance > 0
        ? `Over budget by ${INR(Math.abs(remaining))} (${PCT(variance)}).`
        : `Under budget with ${INR(remaining)} remaining (${PCT(-variance)} headroom).`,
    financial_impact: variance > 0 ? "Continued pace will overshoot end-of-month target." : "Track stays viable.",
    recommendation:
      variance > 0.1
        ? "Pause non-essential categories for the rest of the month."
        : variance > 0
        ? "Tighten the top discretionary category for the next two weeks."
        : "Maintain current pace; consider directing the surplus to savings.",
    risk_level: risk(snapshot),
    confidence: 0.86,
    metrics_used: ["monthlySpent", "budgetAmount", "budgetVariance", "discretionaryRatio"],
    follow_up_question: variance > 0 ? "Want a list of cuts to bring this back on track?" : "Want to route the surplus to a savings target?",
  };
}

function subscriptions(snapshot) {
  const recurring = snapshot.recurringTotal;
  const annualized = recurring * 12;
  return {
    intent: "subscriptions",
    summary: `Recurring monthly outflow: ${INR(recurring)} (~${INR(annualized)} annualized).`,
    key_insight:
      recurring > 0
        ? `Recurring is ${PCT(snapshot.monthlySpent > 0 ? recurring / snapshot.monthlySpent : 0)} of monthly spend.`
        : "No recurring expenses detected in the current month.",
    financial_impact: recurring > 0 ? `Cancelling one ${INR(Math.round(recurring / 4))} subscription saves ${INR(Math.round(recurring * 3))} per year.` : "—",
    recommendation:
      recurring > 0
        ? "Audit the recurring list and cancel any service unused in the last 30 days."
        : "Mark services like Netflix or rent as recurring to track fixed costs.",
    risk_level: recurring > snapshot.monthlySpent * 0.4 ? "medium" : "low",
    confidence: 0.8,
    metrics_used: ["recurringTotal", "monthlySpent"],
    follow_up_question: "Want to flag specific transactions as recurring?",
  };
}

function savings(snapshot, memory) {
  if (!memory.monthlyIncome) {
    return {
      intent: "savings",
      summary: "Savings rate needs income to be computed.",
      key_insight: `Monthly spend so far: ${INR(snapshot.monthlySpent)}.`,
      financial_impact: "—",
      recommendation: "Share your monthly income (e.g. \"my salary is 80000\") to ground savings analysis.",
      risk_level: "low",
      confidence: 0.5,
      metrics_used: ["monthlySpent"],
      follow_up_question: "What's your typical monthly take-home income?",
    };
  }
  const sr =
    snapshot.savingsRate !== null && snapshot.savingsRate !== undefined
      ? snapshot.savingsRate
      : Math.max(0, (memory.monthlyIncome - snapshot.monthlySpent) / memory.monthlyIncome);
  return {
    intent: "savings",
    summary: `Estimated savings rate: ${PCT(sr)} of income.`,
    key_insight:
      sr >= 0.2
        ? "Above the 20% benchmark — healthy."
        : sr >= 0.1
        ? "Below 20% — there's room to push higher."
        : "Below 10% — fragile against shocks.",
    financial_impact: `Income ${INR(memory.monthlyIncome)} − spend ${INR(snapshot.monthlySpent)} = ${INR(memory.monthlyIncome - snapshot.monthlySpent)} this month.`,
    recommendation: sr < 0.2 ? "Trim the top discretionary category by ~10–15% to raise the rate." : "Direct surplus into an emergency fund until it covers 3–6 months of essentials.",
    risk_level: sr < 0.1 ? "high" : sr < 0.2 ? "medium" : "low",
    confidence: 0.85,
    metrics_used: ["savingsRate", "monthlySpent"],
    follow_up_question: sr < 0.2 ? "Want a concrete plan to lift the savings rate by 5 points?" : "Want a target emergency-fund size?",
  };
}

function investing(snapshot, memory) {
  return {
    intent: "investing",
    summary: "Investing analysis needs cashflow context to be honest.",
    key_insight:
      snapshot.savingsRate !== null
        ? `Current savings rate ${PCT(snapshot.savingsRate)} — only invest beyond an emergency buffer.`
        : "Set income and a 3-month emergency target before investing.",
    financial_impact: "—",
    recommendation: "Cover 3 months of essentials first; then a low-cost broad index fund is a reasonable default.",
    risk_level: "medium",
    confidence: 0.6,
    metrics_used: ["savingsRate", "monthlySpent"],
    follow_up_question: "What's the goal — retirement, a near-term purchase, or general wealth building?",
  };
}

function debt(snapshot, memory) {
  if (!memory.debtBalance) {
    return {
      intent: "debt",
      summary: "No debt balance on file.",
      key_insight: "Add the outstanding debt amount to plan payoff math.",
      financial_impact: "—",
      recommendation: "Share the balance and APR (e.g. \"credit card debt 60000 at 36%\") to model payoff.",
      risk_level: "low",
      confidence: 0.4,
      metrics_used: [],
      follow_up_question: "What's the outstanding balance and interest rate?",
    };
  }
  const dti = snapshot.debtToIncome;
  return {
    intent: "debt",
    summary: `Outstanding debt: ${INR(memory.debtBalance)}.`,
    key_insight: dti !== null ? `Debt-to-annual-income ratio: ${PCT(dti)}.` : "Debt-to-income needs monthly income.",
    financial_impact: "Higher-interest debt erodes savings rate every month.",
    recommendation: "Snowball if motivation is the bottleneck; avalanche (highest-APR first) if pure cost matters.",
    risk_level: dti !== null && dti > 0.5 ? "high" : "medium",
    confidence: 0.75,
    metrics_used: ["debtToIncome"],
    follow_up_question: "Want a snowball vs. avalanche comparison on these balances?",
  };
}

function emotionalSpending(snapshot) {
  const top = topCategory(snapshot);
  return {
    intent: "emotional_spending",
    summary: "Emotional spending shows up in spikes rather than averages.",
    key_insight: top
      ? `${top.category} is the largest line this month at ${INR(top.amount)} — worth checking for impulse buys.`
      : "Not enough data to spot impulse patterns.",
    financial_impact: "Untracked impulse spending often hides ₹2–5k/month.",
    recommendation: "Add a 24-hour rule for any non-essential purchase above a set threshold.",
    risk_level: "medium",
    confidence: 0.6,
    metrics_used: ["categoryTotals", "discretionaryRatio"],
    follow_up_question: "Want to set an impulse-purchase threshold (e.g. ₹2000) that triggers a prompt?",
  };
}

function lifestyleTradeoff(snapshot, memory) {
  if (snapshot.budgetAmount === 0 && !memory.monthlyIncome) {
    return {
      intent: "lifestyle_tradeoff",
      summary: "Tradeoff analysis needs either income or a budget to be honest.",
      key_insight: `Discretionary spend this month: ${INR(snapshot.monthlySpent * snapshot.discretionaryRatio)}.`,
      financial_impact: "—",
      recommendation: "Set a monthly budget or share your income to ground this answer.",
      risk_level: "low",
      confidence: 0.4,
      metrics_used: ["discretionaryRatio"],
      follow_up_question: "What's the monthly amount you'd want to allocate to this category?",
    };
  }
  const headroom = snapshot.budgetAmount > 0 ? snapshot.budgetRemaining : memory.monthlyIncome - snapshot.monthlySpent;
  const safe = Math.max(0, headroom * 0.3);
  return {
    intent: "lifestyle_tradeoff",
    summary: `Available headroom this month: ${INR(headroom)}.`,
    key_insight: `Discretionary spend already at ${PCT(snapshot.discretionaryRatio)} of total. Comfortable extra room is around ${INR(safe)}.`,
    financial_impact: headroom <= 0 ? "Adding to this category would push the month over target." : `Spending ${INR(safe)} keeps the savings rate intact.`,
    recommendation: headroom <= 0 ? "Hold until next month or offset from another discretionary category." : `Cap the extra spend at ${INR(safe)} and revisit at month-end.`,
    risk_level: headroom <= 0 ? "high" : snapshot.discretionaryRatio > 0.45 ? "medium" : "low",
    confidence: 0.78,
    metrics_used: ["budgetRemaining", "discretionaryRatio", "monthlySpent"],
    follow_up_question: "Want a specific weekly cap so it stays in the comfort zone?",
  };
}

function financialPlanning(snapshot, memory) {
  return {
    intent: "financial_planning",
    summary: "Planning needs a target and a horizon.",
    key_insight:
      memory.savingsTarget
        ? `Target on file: ${INR(memory.savingsTarget)}.`
        : "No savings target captured yet.",
    financial_impact: snapshot.savingsRate !== null ? `At ${PCT(snapshot.savingsRate)} savings rate, monthly contribution is ${INR((memory.monthlyIncome || 0) * snapshot.savingsRate)}.` : "—",
    recommendation: "Pick one concrete goal (amount + date) and back into the monthly contribution.",
    risk_level: "low",
    confidence: 0.6,
    metrics_used: ["savingsRate"],
    follow_up_question: "What goal amount and target date should we plan against?",
  };
}

function purchaseDecision(snapshot, memory, query) {
  const m = String(query || "").match(/([0-9][0-9,]*(?:\.[0-9]+)?)/);
  const price = m ? parseFloat(m[1].replace(/,/g, "")) : null;
  if (!price) {
    return {
      intent: "purchase_decision",
      summary: "Need a price to evaluate the purchase.",
      key_insight: `Current month headroom: ${INR(snapshot.budgetAmount ? snapshot.budgetRemaining : (memory.monthlyIncome || 0) - snapshot.monthlySpent)}.`,
      financial_impact: "—",
      recommendation: "Share the price (e.g. \"can I afford a 45000 phone\").",
      risk_level: "low",
      confidence: 0.4,
      metrics_used: ["budgetRemaining"],
      follow_up_question: "What's the price?",
    };
  }
  const headroom = snapshot.budgetAmount > 0 ? snapshot.budgetRemaining : (memory.monthlyIncome || 0) - snapshot.monthlySpent;
  const fitsBudget = headroom > 0 && price <= headroom * 0.5;
  const stretches = price > headroom && price < headroom * 1.5;
  return {
    intent: "purchase_decision",
    summary: fitsBudget ? `${INR(price)} fits within current headroom of ${INR(headroom)}.` : stretches ? `${INR(price)} stretches the month's headroom of ${INR(headroom)}.` : `${INR(price)} exceeds available headroom of ${INR(headroom)}.`,
    key_insight: `Purchase would consume ${headroom > 0 ? PCT(price / headroom) : "more than 100%"} of remaining room.`,
    financial_impact: `Post-purchase remaining: ${INR(headroom - price)}.`,
    recommendation: fitsBudget ? "Proceed if it aligns with priorities." : stretches ? "Delay 30 days or offset by trimming another category." : "Skip or save toward it over the next 1–2 months.",
    risk_level: fitsBudget ? "low" : stretches ? "medium" : "high",
    confidence: 0.82,
    metrics_used: ["budgetRemaining", "monthlySpent"],
    follow_up_question: "Want a 1–2 month sinking-fund plan for this?",
  };
}

function incomeAnalysis(snapshot, memory) {
  if (!memory.monthlyIncome) {
    return {
      intent: "income_analysis",
      summary: "No income captured yet.",
      key_insight: "Share your monthly take-home to ground income-side analysis.",
      financial_impact: "—",
      recommendation: "Tell me your monthly income (e.g. \"my salary is 90000\").",
      risk_level: "low",
      confidence: 0.4,
      metrics_used: [],
      follow_up_question: "What's your typical monthly income?",
    };
  }
  return {
    intent: "income_analysis",
    summary: `Monthly income on file: ${INR(memory.monthlyIncome)}.`,
    key_insight: `Spend ratio this month: ${PCT(snapshot.monthlySpent / memory.monthlyIncome)}.`,
    financial_impact: `Net this month: ${INR(memory.monthlyIncome - snapshot.monthlySpent)}.`,
    recommendation: "Keep total spend under 80% of income to maintain a 20% savings rate.",
    risk_level: snapshot.monthlySpent > memory.monthlyIncome * 0.9 ? "high" : "low",
    confidence: 0.8,
    metrics_used: ["monthlySpent", "savingsRate"],
    follow_up_question: "Want to break the spend down vs income by category?",
  };
}

function cashflowAnalysis(snapshot, memory) {
  if (!memory.monthlyIncome) {
    return {
      intent: "cashflow_analysis",
      summary: "Cashflow needs both income and outflow to be honest.",
      key_insight: `Outflow this month: ${INR(snapshot.monthlySpent)}.`,
      financial_impact: "—",
      recommendation: "Share monthly income to compute net cashflow and runway.",
      risk_level: "low",
      confidence: 0.5,
      metrics_used: ["monthlySpent"],
      follow_up_question: "What's your monthly income?",
    };
  }
  const net = memory.monthlyIncome - snapshot.monthlySpent;
  return {
    intent: "cashflow_analysis",
    summary: `Net monthly cashflow: ${INR(net)} (${PCT(net / memory.monthlyIncome)} of income).`,
    key_insight: `Recurring fixed costs: ${INR(snapshot.recurringTotal)}; discretionary: ${PCT(snapshot.discretionaryRatio)}.`,
    financial_impact: net < 0 ? "Negative cashflow — drawing down reserves." : "Positive cashflow — available to allocate.",
    recommendation: net < 0 ? "Cut the top discretionary category until cashflow turns positive." : "Direct surplus to a savings or debt target.",
    risk_level: net < 0 ? "high" : "low",
    confidence: 0.84,
    metrics_used: ["monthlyBurn", "recurringTotal", "discretionaryRatio"],
    follow_up_question: "Want a 90-day cashflow projection?",
  };
}

function recurringExpenses(snapshot) {
  if (snapshot.recurringTotal === 0) {
    return {
      intent: "recurring_expenses",
      summary: "No recurring outflows detected this month.",
      key_insight: "Tag bills, rent, or subscriptions as recurring to track fixed costs.",
      financial_impact: "—",
      recommendation: "Mark known fixed transactions (rent, utilities, subscriptions) as recurring.",
      risk_level: "low",
      confidence: 0.6,
      metrics_used: ["recurringTotal"],
      follow_up_question: "Which categories should I treat as recurring?",
    };
  }
  return {
    intent: "recurring_expenses",
    summary: `Recurring outflows: ${INR(snapshot.recurringTotal)} this month.`,
    key_insight: `That's ${PCT(snapshot.monthlySpent > 0 ? snapshot.recurringTotal / snapshot.monthlySpent : 0)} of monthly spend locked in.`,
    financial_impact: `Annualized: ${INR(snapshot.recurringTotal * 12)}.`,
    recommendation: "Audit each line at least quarterly; cancel anything unused for 30 days.",
    risk_level: snapshot.recurringTotal > snapshot.monthlySpent * 0.5 ? "medium" : "low",
    confidence: 0.82,
    metrics_used: ["recurringTotal", "monthlySpent"],
    follow_up_question: "Want a list of likely subscription line items?",
  };
}

function generalFinanceQuestion(snapshot, memory) {
  return {
    intent: "general_finance_question",
    summary: "Happy to explain the concept; the analysis below uses your data where possible.",
    key_insight: snapshot.transactionCount > 0 ? `Context: ${INR(snapshot.monthlySpent)} spent this month across ${snapshot.transactionCount} transactions.` : "Add transactions and income for personalized analysis.",
    financial_impact: "—",
    recommendation: "Ask a more specific question (e.g. \"what is my savings rate\" or \"can I afford a 30000 phone\") to get a grounded answer.",
    risk_level: "low",
    confidence: 0.55,
    metrics_used: snapshot.transactionCount > 0 ? ["monthlySpent"] : [],
    follow_up_question: "Want to apply the concept to your numbers?",
  };
}

function clarification(intentResult, snapshot) {
  const guesses = (intentResult.alternatives || []).slice(0, 2).join(" or ");
  return {
    intent: "general_finance_question",
    summary: "Not enough signal to classify the question confidently.",
    key_insight: guesses ? `Possible angles: ${guesses}.` : "The question is ambiguous.",
    financial_impact: "—",
    recommendation: "Rephrase with the specific category, time window, or amount in question.",
    risk_level: "low",
    confidence: Math.max(0.2, intentResult.confidence || 0.2),
    metrics_used: [],
    follow_up_question: "Are you asking about a specific category, a budget cap, or a one-off purchase?",
  };
}

const HANDLERS = {
  spending_analysis: spendingAnalysis,
  budgeting: budgeting,
  subscriptions: subscriptions,
  savings: savings,
  investing: investing,
  debt: debt,
  emotional_spending: emotionalSpending,
  lifestyle_tradeoff: lifestyleTradeoff,
  financial_planning: financialPlanning,
  purchase_decision: purchaseDecision,
  income_analysis: incomeAnalysis,
  cashflow_analysis: cashflowAnalysis,
  recurring_expenses: recurringExpenses,
  general_finance_question: generalFinanceQuestion,
};

export function generateResponse({ intentResult, snapshot, memory, query }) {
  if (!intentResult.intent) return clarification(intentResult, snapshot);
  const handler = HANDLERS[intentResult.intent];
  if (!handler) return clarification(intentResult, snapshot);
  const baseline = handler(snapshot, memory, query);
  return { ...baseline, confidence: Math.min(0.95, baseline.confidence * (0.6 + intentResult.confidence * 0.4)) };
}
