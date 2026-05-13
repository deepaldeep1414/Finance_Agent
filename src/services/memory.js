const INCOME_RX = /(?:salary|income|earn|earnings|paycheck)[^\d-]*([0-9][0-9,]*(?:\.[0-9]+)?)/i;
const SAVINGS_TARGET_RX = /(?:save|saving|savings)\s+(?:target|goal|of)?[^\d-]*([0-9][0-9,]*(?:\.[0-9]+)?)/i;
const DEBT_RX = /(?:debt|loan|emi|credit\s*card)\s+(?:of)?[^\d-]*([0-9][0-9,]*(?:\.[0-9]+)?)/i;

const PRIORITY_HINTS = [
  ["emergency_fund", /\bemergency\s+fund\b/i],
  ["retirement", /\bretirement\b/i],
  ["fire", /\b(fire|financial\s+independence)\b/i],
  ["house", /\b(house|home|down\s*payment)\b/i],
  ["debt_payoff", /\b(payoff|pay\s*off)\b/i],
  ["travel", /\b(travel|vacation)\b/i],
];

function num(s) {
  const v = parseFloat(String(s).replace(/,/g, ""));
  return Number.isFinite(v) ? v : null;
}

export function extractMemoryUpdates(text, profile) {
  const updated = { ...profile };
  const m = String(text || "");

  const income = m.match(INCOME_RX);
  if (income) {
    const v = num(income[1]);
    if (v !== null) updated.monthlyIncome = v;
  }

  const sav = m.match(SAVINGS_TARGET_RX);
  if (sav) {
    const v = num(sav[1]);
    if (v !== null) updated.savingsTarget = v;
  }

  const debt = m.match(DEBT_RX);
  if (debt) {
    const v = num(debt[1]);
    if (v !== null) updated.debtBalance = v;
  }

  const newPriorities = new Set(updated.priorities || []);
  for (const [tag, rx] of PRIORITY_HINTS) if (rx.test(m)) newPriorities.add(tag);
  updated.priorities = [...newPriorities];

  return updated;
}

export function memorySummary(profile) {
  const parts = [];
  if (profile.monthlyIncome) parts.push(`Income ₹${profile.monthlyIncome.toLocaleString("en-IN")}/mo`);
  if (profile.savingsTarget) parts.push(`Savings target ₹${profile.savingsTarget.toLocaleString("en-IN")}`);
  if (profile.debtBalance) parts.push(`Debt ₹${profile.debtBalance.toLocaleString("en-IN")}`);
  if (profile.priorities && profile.priorities.length) parts.push(`Priorities: ${profile.priorities.join(", ")}`);
  return parts.length ? parts.join(" · ") : "No financial profile captured yet.";
}
