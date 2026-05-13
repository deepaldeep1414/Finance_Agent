import State from "../state.js";
import { detectCategory, normalizeMerchant, CATEGORIES, isRecurringCategory } from "../services/categorize.js";

const INR = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function initTransactionForms() {
  const form = document.getElementById("transaction-form");
  if (!form) return;

  const categorySelect = document.getElementById("tx-category");
  if (categorySelect && categorySelect.options.length <= 1) {
    for (const c of CATEGORIES) {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      categorySelect.appendChild(opt);
    }
  }

  const dateInput = document.getElementById("tx-date");
  if (dateInput && !dateInput.value) dateInput.value = todayISO();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const desc = document.getElementById("tx-description").value.trim();
    const amt = parseFloat(document.getElementById("tx-amount").value);
    const date = document.getElementById("tx-date").value || todayISO();
    const explicit = categorySelect.value || "";
    if (!desc || !Number.isFinite(amt) || amt <= 0) return;
    const category = explicit || detectCategory(desc);
    const tx = {
      id: String(Date.now()),
      description: normalizeMerchant(desc),
      amount: Math.round(amt * 100) / 100,
      category,
      date,
      recurring: isRecurringCategory(category),
    };
    State.data.transactions = [...State.data.transactions, tx];
    State.notify();
    form.reset();
    dateInput.value = todayISO();
  });
}

export function renderTransactions(state) {
  const container = document.getElementById("transaction-list");
  if (!container) return;
  const items = [...state.transactions].sort((a, b) => (a.date < b.date ? 1 : -1));
  if (items.length === 0) {
    container.innerHTML = `<li class="empty-row">No transactions yet.</li>`;
    return;
  }
  container.innerHTML = items
    .map(
      (t) => `
      <li class="tx-row">
        <div class="tx-main">
          <div class="tx-title">${escapeHTML(t.description)}</div>
          <div class="tx-meta">${escapeHTML(t.category)} · ${escapeHTML(t.date)}${t.recurring ? " · recurring" : ""}</div>
        </div>
        <div class="tx-amount">−${INR(t.amount)}</div>
        <button class="tx-delete" data-id="${escapeHTML(t.id)}" aria-label="Delete">×</button>
      </li>
    `,
    )
    .join("");

  container.querySelectorAll(".tx-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      State.data.transactions = State.data.transactions.filter((t) => t.id !== id);
      State.notify();
    });
  });
}

function escapeHTML(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
