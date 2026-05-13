const BANNED_PATTERNS = [
  /\bgrandmaster\b/i,
  /\bdynasty\b/i,
  /\bwealth\s+architect\b/i,
  /\bgeo-?arbitrage\b/i,
  /\brecession\s+engineering\b/i,
  /\bcredit\s+engineering\b/i,
  /\bempire\b/i,
  /\blegacy\b/i,
  /\balpha\b/i,
  /\belite\b/i,
  /\bmillionaire\s+mindset\b/i,
  /\bfinancial\s+domination\b/i,
  /\barchitect(?:ing)?\s+your\s+future\b/i,
  /\bwealth\s+ecosystem\b/i,
  /\bfinancial\s+freedom\s+journey\b/i,
  /\bunlock\b/i,
  /\bmaster\s+your\s+finances\b/i,
  /\bwealth\s+journey\b/i,
  /\babundance\b/i,
  /\bfuture-?proof\b/i,
  /\bnext-?level\b/i,
  /\bdominate\b/i,
  /\bmaximize\s+your\s+destiny\b/i,
  /\bfinancial\s+empire\b/i,
];

function sanitize(value) {
  if (typeof value !== "string") return value;
  let s = value;
  for (const rx of BANNED_PATTERNS) s = s.replace(rx, "");
  return s.replace(/\s{2,}/g, " ").trim();
}

const FIELDS = ["summary", "key_insight", "financial_impact", "recommendation", "follow_up_question"];

function escape(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const RISK_LABEL = { low: "Low", medium: "Medium", high: "High" };

const INTENT_LABEL = {
  spending_analysis: "Spending analysis",
  budgeting: "Budgeting",
  subscriptions: "Subscriptions",
  savings: "Savings",
  investing: "Investing",
  debt: "Debt",
  emotional_spending: "Emotional spending",
  lifestyle_tradeoff: "Lifestyle tradeoff",
  financial_planning: "Financial planning",
  purchase_decision: "Purchase decision",
  income_analysis: "Income analysis",
  cashflow_analysis: "Cashflow",
  recurring_expenses: "Recurring expenses",
  general_finance_question: "Finance question",
};

export function normalizeResponse(resp) {
  const out = { ...resp };
  for (const f of FIELDS) out[f] = sanitize(out[f] || "");
  return out;
}

export function renderResponseHTML(resp) {
  const r = normalizeResponse(resp);
  const intentLabel = INTENT_LABEL[r.intent] || r.intent;
  const confidencePct = Math.round((r.confidence || 0) * 100);
  const riskClass = `risk-${r.risk_level}`;
  return `
    <article class="assistant-card">
      <header class="assistant-card-head">
        <span class="assistant-tag">${escape(intentLabel)}</span>
        <span class="assistant-risk ${escape(riskClass)}">${escape(RISK_LABEL[r.risk_level] || "Low")} risk</span>
        <span class="assistant-confidence">${confidencePct}% confidence</span>
      </header>
      <p class="assistant-summary">${escape(r.summary)}</p>
      <ul class="assistant-points">
        <li><strong>Insight.</strong> ${escape(r.key_insight)}</li>
        <li><strong>Impact.</strong> ${escape(r.financial_impact)}</li>
        <li><strong>Recommendation.</strong> ${escape(r.recommendation)}</li>
      </ul>
      ${r.follow_up_question ? `<p class="assistant-followup">${escape(r.follow_up_question)}</p>` : ""}
    </article>
  `.trim();
}
