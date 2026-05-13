const CATEGORY_PATTERNS = {
  Food: ["food","restaurant","dinner","lunch","breakfast","cafe","coffee","starbucks","dominos","pizza","burger","mcd","mcdonald","kfc","zomato","swiggy","eat","meal","snack","groceries","grocery","supermarket","bigbasket","blinkit"],
  Travel: ["uber","ola","taxi","cab","bus","train","flight","airport","hotel","stay","travel","trip","vacation","tour","petrol","diesel","fuel"],
  Shopping: ["shopping","mall","store","shop","amazon","flipkart","myntra","ajio","clothes","shoes","jacket","shirt","dress","electronics","phone","laptop","gadget"],
  Bills: ["bill","electricity","water","gas","internet","wifi","broadband","mobile","recharge","dth","rent","emi","loan","insurance","tax"],
  Health: ["hospital","doctor","medicine","pharmacy","medical","health","fitness","gym","yoga","clinic","dentist","healthcare"],
  Entertainment: ["movie","cinema","theatre","netflix","prime","hotstar","disney","spotify","music","concert","event","game","pub","bar","party"],
  Subscriptions: ["subscription","membership","netflix","spotify","prime","hotstar","disney","icloud","dropbox","github","openai"],
};

const RECURRING_CATEGORIES = new Set(["Bills", "Subscriptions"]);

const MERCHANT_NORMAL = {
  dominos: "Domino's Pizza",
  starbucks: "Starbucks",
  mcdonalds: "McDonald's",
  mcd: "McDonald's",
  uber: "Uber",
  ola: "Ola",
  amazon: "Amazon",
  flipkart: "Flipkart",
  zomato: "Zomato",
  swiggy: "Swiggy",
  bigbasket: "BigBasket",
  blinkit: "Blinkit",
  netflix: "Netflix",
  spotify: "Spotify",
};

function lower(s) {
  return String(s || "").toLowerCase();
}

export function detectCategory(description) {
  const d = lower(description);
  for (const [cat, words] of Object.entries(CATEGORY_PATTERNS)) {
    for (const w of words) if (d.includes(w)) return cat;
  }
  return "Other";
}

export function normalizeMerchant(description) {
  const d = lower(description);
  for (const [k, v] of Object.entries(MERCHANT_NORMAL)) {
    if (d.includes(k)) return v;
  }
  return description
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isRecurringCategory(category) {
  return RECURRING_CATEGORIES.has(category);
}

export const CATEGORIES = Object.keys(CATEGORY_PATTERNS).concat("Other");
