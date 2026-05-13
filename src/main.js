import State from "./state.js";
import { initSidebar } from "./ui/sidebar.js";
import { renderDashboard } from "./ui/dashboard.js";
import { renderTransactions, initTransactionForms } from "./ui/transactions.js";
import { initBudgetForm } from "./ui/budget.js";
import { initChat, renderInitialChat } from "./ui/chat.js";
import { renderMemoryPanel, initMemoryForm } from "./ui/memory.js";
import { initAuth } from "./ui/auth.js";

function rerender(state) {
  renderDashboard(state);
  renderTransactions(state);
  renderMemoryPanel(state);
}

function boot() {
  initAuth();
  initSidebar({ onNavigate: () => rerender(State.data) });
  initTransactionForms();
  initBudgetForm();
  initMemoryForm();
  initChat();
  renderInitialChat(State.data);
  rerender(State.data);
  State.subscribe(rerender);
}

document.addEventListener("DOMContentLoaded", boot);
