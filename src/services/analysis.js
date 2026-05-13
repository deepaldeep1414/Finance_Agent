import { isRecurringCategory } from "./categorize.js";

function inMonth(dateStr, ref) {
  return dateStr && dateStr.slice(0, 7) === ref;
}

function monthRef(d = new Date()) {
  return d.toISOString().slice(0, 7);
}

function previousMonthRef() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return monthRef(d);
}

function sum(arr, fn) {
  return arr.reduce((acc, x) => acc + (fn ? fn(x) : x), 0);
}

export function computeSnapshot(state) {
  const txs = state.transactions || [];
  const budget = state.budget || { amount: 0, period: "Monthly" };
  const memory = state.memory || {};

  const currentMonth = monthRef();
  const prevMonth = previousMonthRef();

  const monthTxs = txs.filter((t) => inMonth(t.date, currentMonth));
  const prevTxs = txs.filter((t) => inMonth(t.date, prevMonth));

  const totalSpent = sum(txs, (t) => Number(t.amount) || 0);
  const monthlySpent = sum(monthTxs, (t) => Number(t.amount) || 0);

  const categoryTotals = {};
  for (const t of monthTxs) {
    const c = t.category || "Other";
    categoryTotals[c] = (categoryTotals[c] || 0) + Number(t.amount || 0);
  }
  const prevCategoryTotals = {};
  for (const t of prevTxs) {
    const c = t.category || "Other";
    prevCategoryTotals[c] = (prevCategoryTotals[c] || 0) + Number(t.amount || 0);
  }
  const categoryDeltas = {};
  for (const c of new Set([...Object.keys(categoryTotals), ...Object.keys(prevCategoryTotals)])) {
    const a = categoryTotals[c] || 0;
    const b = prevCategoryTotals[c] || 0;
    categoryDeltas[c] = a - b;
  }

  const recurringTotal = sum(
    monthTxs.filter((t) => t.recurring || isRecurringCategory(t.category)),
    (t) => Number(t.amount || 0),
  );

  const essentialCategories = new Set(["Bills", "Health", "Food"]);
  const essentialSpend = sum(
    monthTxs.filter((t) => essentialCategories.has(t.category)),
    (t) => Number(t.amount || 0),
  );
  const discretionarySpend = monthlySpent - essentialSpend;

  const essentialRatio = monthlySpent > 0 ? essentialSpend / monthlySpent : 0;
  const discretionaryRatio = monthlySpent > 0 ? discretionarySpend / monthlySpent : 0;

  const income = memory.monthlyIncome;
  const savingsRate = income && income > 0 ? Math.max(0, (income - monthlySpent) / income) : null;
  const monthlyBurn = monthlySpent;
  const runwayMonths = income && monthlyBurn > 0 ? null : null;
  const debtToIncome = income && income > 0 && memory.debtBalance ? memory.debtBalance / (income * 12) : null;

  const budgetAmount = Number(budget.amount || 0);
  const budgetRemaining = budgetAmount - monthlySpent;
  const budgetVariance = budgetAmount > 0 ? (monthlySpent - budgetAmount) / budgetAmount : 0;

  return {
    totalSpent,
    monthlySpent,
    budgetAmount,
    budgetRemaining,
    budgetVariance,
    savingsRate,
    discretionaryRatio,
    essentialRatio,
    debtToIncome,
    recurringTotal,
    monthlyBurn,
    runwayMonths,
    categoryTotals,
    categoryDeltas,
    transactionCount: monthTxs.length,
  };
}

export function topCategory(snapshot) {
  let max = null;
  for (const [cat, amt] of Object.entries(snapshot.categoryTotals)) {
    if (!max || amt > max.amount) max = { category: cat, amount: amt };
  }
  return max;
}

export function biggestMover(snapshot) {
  let mover = null;
  for (const [cat, delta] of Object.entries(snapshot.categoryDeltas)) {
    if (!mover || Math.abs(delta) > Math.abs(mover.delta)) mover = { category: cat, delta };
  }
  return mover;
}
