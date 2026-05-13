import State from "../state.js";

const INR = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

export function renderMemoryPanel(state) {
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  setText("memory-income", state.memory.monthlyIncome ? INR(state.memory.monthlyIncome) : "—");
  setText("memory-target", state.memory.savingsTarget ? INR(state.memory.savingsTarget) : "—");
  setText("memory-debt", state.memory.debtBalance ? INR(state.memory.debtBalance) : "—");
  setText(
    "memory-priorities",
    state.memory.priorities && state.memory.priorities.length ? state.memory.priorities.join(", ") : "—",
  );
}

export function initMemoryForm() {
  const form = document.getElementById("memory-form");
  if (!form) return;
  const income = document.getElementById("memory-input-income");
  const target = document.getElementById("memory-input-target");
  const debt = document.getElementById("memory-input-debt");

  income.value = State.data.memory.monthlyIncome || "";
  target.value = State.data.memory.savingsTarget || "";
  debt.value = State.data.memory.debtBalance || "";

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const next = { ...State.data.memory };
    const i = parseFloat(income.value);
    const t = parseFloat(target.value);
    const d = parseFloat(debt.value);
    next.monthlyIncome = Number.isFinite(i) && i > 0 ? i : null;
    next.savingsTarget = Number.isFinite(t) && t > 0 ? t : null;
    next.debtBalance = Number.isFinite(d) && d > 0 ? d : null;
    State.data.memory = next;
    State.notify();
  });
}
