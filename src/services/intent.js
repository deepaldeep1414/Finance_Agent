const STOPWORDS = new Set([
  "the","a","an","is","are","was","were","be","been","being","do","does","did",
  "have","has","had","i","me","my","mine","you","your","yours","we","our","ours",
  "they","them","their","this","that","these","those","of","to","for","with",
  "in","on","at","by","from","as","it","its","or","and","but","if","then","so",
  "can","could","should","would","will","shall","may","might","must","just",
  "any","some","more","less","much","many","how","what","when","where","why","who",
  "about","into","than","too","very","also","over","under","up","down","out","off",
]);

const SYNONYMS = {
  spend: ["spent","spending","expense","expenses","expenditure","outflow","outflows","cost","costs","paid","paying"],
  save: ["saving","savings","stash","reserve"],
  budget: ["budgeting","cap","caps","allocation","allocations","envelope"],
  invest: ["investing","investment","investments","portfolio","stocks","bonds","equities","etf","etfs","401k","ira"],
  debt: ["loan","loans","mortgage","emi","emis","borrowed","owe","owed","liability","liabilities"],
  subscription: ["subscriptions","membership","memberships"],
  income: ["salary","earnings","wage","wages","paycheck","paychecks","earn","earning"],
  cashflow: ["burn","runway","liquidity"],
  purchase: ["buy","buying","afford","purchase","purchasing"],
  emotional: ["stressed","stress","anxious","anxiety","guilt","guilty","impulse","impulsive"],
  lifestyle: ["dating","nightlife","clubs","clubbing","hobby","hobbies","leisure"],
  planning: ["planning","goal","goals","milestone","milestones"],
  recurring: ["recurring","weekly","utilities"],
  analyze: ["analyze","analysis","review","breakdown","summary","summarize","overview","trend","trends"],
};

const INTENT_PROTOTYPES = {
  spending_analysis: [
    "show me my spending breakdown",
    "where is my money going",
    "analyze my expenses",
    "what did i spend the most on",
    "give me a spending summary",
    "review my recent expenses",
    "biggest category this month",
    "trend in my spending",
  ],
  budgeting: [
    "help me set a budget",
    "is my budget realistic",
    "am i over budget",
    "how much budget remaining",
    "should i raise or lower my budget",
    "envelope budgeting",
    "monthly budget allocation",
  ],
  subscriptions: [
    "which subscriptions am i paying for",
    "cancel a subscription",
    "review my recurring subscriptions",
    "netflix spotify prime membership",
    "auto-pay services running",
  ],
  savings: [
    "how much should i save",
    "what is my savings rate",
    "emergency fund target",
    "boost my savings",
    "save more each month",
  ],
  investing: [
    "should i invest in index funds",
    "portfolio allocation",
    "what to do with extra cash",
    "401k vs ira",
    "stocks bonds split",
  ],
  debt: [
    "how do i pay off debt",
    "debt snowball or avalanche",
    "credit card balance",
    "loan repayment plan",
    "should i refinance",
  ],
  emotional_spending: [
    "i shop when i am stressed",
    "impulse buying",
    "retail therapy",
    "i spend when i feel sad",
    "guilt after spending",
  ],
  lifestyle_tradeoff: [
    "can i spend more on dating",
    "can i afford to go out more",
    "is my social spending too high",
    "balance fun and saving",
    "spending on hobbies vs goals",
  ],
  financial_planning: [
    "how do i reach financial independence",
    "retirement planning",
    "long term goals",
    "savings milestone plan",
    "fire timeline",
    "help me think about retirement",
    "plan for the future",
  ],
  purchase_decision: [
    "can i afford a 80000 laptop",
    "should i buy a new phone",
    "is this purchase a good idea",
    "afford a 50000 jacket",
  ],
  income_analysis: [
    "review my income",
    "is my salary enough",
    "income variability",
    "side income breakdown",
  ],
  cashflow_analysis: [
    "what is my monthly cashflow",
    "how is my cashflow",
    "cashflow this month",
    "net inflow vs outflow",
    "burn rate",
    "runway in months",
    "liquidity position",
  ],
  recurring_expenses: [
    "list my recurring bills",
    "monthly fixed costs",
    "rent utilities and emi totals",
    "recurring outflows",
    "how much do i pay in rent and utilities",
    "weekly recurring charges",
  ],
  general_finance_question: [
    "what is the 50 30 20 rule",
    "how does compound interest work",
    "explain credit score",
    "what is an etf",
  ],
};

function expand(token) {
  for (const [key, list] of Object.entries(SYNONYMS)) {
    if (token === key || list.includes(token)) return [key, ...list, token];
  }
  return [token];
}

function tokenize(text) {
  const raw = String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t));
  const out = new Set();
  for (const t of raw) for (const e of expand(t)) out.add(e);
  return [...out];
}

function vectorize(tokens) {
  const v = new Map();
  for (const t of tokens) v.set(t, (v.get(t) || 0) + 1);
  return v;
}

function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [, w] of a) na += w * w;
  for (const [, w] of b) nb += w * w;
  if (!na || !nb) return 0;
  const smaller = a.size < b.size ? a : b;
  const other = smaller === a ? b : a;
  for (const [k, w] of smaller) {
    const ow = other.get(k);
    if (ow) dot += w * ow;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

const PROTOTYPE_VECTORS = Object.fromEntries(
  Object.entries(INTENT_PROTOTYPES).map(([intent, examples]) => [
    intent,
    examples.map((e) => vectorize(tokenize(e))),
  ]),
);

const MIN_CONFIDENCE = 0.22;
const AMBIGUITY_MARGIN = 0.05;

function bestScoreFor(queryVec, exampleVecs) {
  let best = 0;
  for (const v of exampleVecs) {
    const s = cosine(queryVec, v);
    if (s > best) best = s;
  }
  return best;
}

export function classifyIntent(query) {
  const vec = vectorize(tokenize(query));
  const scored = Object.entries(PROTOTYPE_VECTORS)
    .map(([intent, examples]) => ({ intent, score: bestScoreFor(vec, examples) }))
    .sort((a, b) => b.score - a.score);

  const top = scored[0];
  const second = scored[1];

  if (!top || top.score < MIN_CONFIDENCE) {
    return { intent: null, confidence: top ? top.score : 0, alternatives: scored.slice(0, 3).map((s) => s.intent) };
  }

  const ambiguous = second && top.score - second.score < AMBIGUITY_MARGIN;
  return {
    intent: top.intent,
    confidence: Math.min(1, top.score),
    alternatives: ambiguous ? [top.intent, second.intent] : [top.intent],
  };
}

export const SUPPORTED_INTENTS = Object.keys(INTENT_PROTOTYPES);
