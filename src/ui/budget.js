import State from "../state.js";

export function initBudgetForm() {
  const form = document.getElementById("budget-form");
  if (!form) return;
  const amountInput = document.getElementById("budget-amount");
  const periodInput = document.getElementById("budget-period");
  amountInput.value = State.data.budget.amount || "";
  periodInput.value = State.data.budget.period || "Monthly";
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const amount = parseFloat(amountInput.value);
    const period = periodInput.value || "Monthly";
    if (!Number.isFinite(amount) || amount <= 0) return;
    State.data.budget = { amount, period };
    State.notify();
  });
}
