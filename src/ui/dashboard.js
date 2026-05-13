import { computeSnapshot, topCategory } from "../services/analysis.js";
import { memorySummary } from "../services/memory.js";

const INR = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const PCT = (n) => `${Math.round((Number(n) || 0) * 100)}%`;

const COLORS = {
  Food: "#2dd4bf",
  Travel: "#60a5fa",
  Shopping: "#a78bfa",
  Bills: "#f59e0b",
  Health: "#34d399",
  Entertainment: "#f472b6",
  Subscriptions: "#fb923c",
  Other: "#94a3b8",
};

function renderChart(container, totals, total) {
  if (!container) return;
  if (total === 0) {
    container.innerHTML = `<div class="chart-empty">No transactions in the current month.</div>`;
    return;
  }
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const slices = [];
  const legend = [];
  for (const [cat, amt] of Object.entries(totals)) {
    if (!amt) continue;
    const pct = amt / total;
    const dash = `${pct * circumference} ${circumference}`;
    slices.push(
      `<circle cx="50" cy="50" r="${radius}" fill="transparent" stroke="${COLORS[cat] || COLORS.Other}" stroke-width="14" stroke-dasharray="${dash}" stroke-dashoffset="${-offset}"></circle>`,
    );
    legend.push(
      `<li><span class="legend-dot" style="background:${COLORS[cat] || COLORS.Other}"></span>${cat}<span class="legend-value">${INR(amt)} · ${PCT(pct)}</span></li>`,
    );
    offset += pct * circumference;
  }
  container.innerHTML = `
    <svg viewBox="0 0 100 100" class="chart-svg" aria-label="Spending breakdown" role="img">
      <g transform="rotate(-90 50 50)">${slices.join("")}</g>
      <text x="50" y="48" text-anchor="middle" class="chart-center-top">${INR(total)}</text>
      <text x="50" y="58" text-anchor="middle" class="chart-center-bottom">this month</text>
    </svg>
    <ul class="chart-legend">${legend.join("")}</ul>
  `;
}

export function renderDashboard(state) {
  const snapshot = computeSnapshot(state);
  const greeting = document.getElementById("greeting");
  if (greeting) greeting.textContent = state.user ? `Hello, ${state.user}.` : "Hello.";

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText("stat-budget", INR(snapshot.budgetAmount));
  setText("stat-spent", INR(snapshot.monthlySpent));
  setText("stat-remaining", INR(snapshot.budgetRemaining));
  setText(
    "stat-status",
    snapshot.budgetAmount === 0
      ? "No budget set"
      : snapshot.budgetVariance > 0
      ? "Over budget"
      : snapshot.budgetVariance > -0.2
      ? "On pace"
      : "Comfortably under",
  );
  setText("stat-savings-rate", snapshot.savingsRate === null ? "—" : PCT(snapshot.savingsRate));
  setText("stat-discretionary", PCT(snapshot.discretionaryRatio));
  setText("stat-recurring", INR(snapshot.recurringTotal));

  const remainingCard = document.getElementById("card-remaining");
  if (remainingCard) {
    remainingCard.classList.remove("is-warning", "is-danger");
    if (snapshot.budgetAmount > 0) {
      if (snapshot.budgetVariance > 0) remainingCard.classList.add("is-danger");
      else if (snapshot.budgetVariance > -0.2) remainingCard.classList.add("is-warning");
    }
  }

  renderChart(document.getElementById("chart-area"), snapshot.categoryTotals, snapshot.monthlySpent);

  const top = topCategory(snapshot);
  setText("stat-top-category", top ? `${top.category} · ${INR(top.amount)}` : "—");

  setText("memory-summary", memorySummary(state.memory));
}
