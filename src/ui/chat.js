import State from "../state.js";
import { classifyIntent } from "../services/intent.js";
import { computeSnapshot } from "../services/analysis.js";
import { generateResponse } from "../services/insights.js";
import { renderResponseHTML, normalizeResponse } from "../services/render.js";
import { extractMemoryUpdates } from "../services/memory.js";
import { requestRemoteResponse } from "../services/llm.js";

const SUGGESTIONS = [
  "Where is my money going this month?",
  "Can I afford a 45000 phone?",
  "Review my recurring subscriptions",
  "What is my savings rate?",
  "Can I spend more on dating?",
];

function renderTurn(role, html) {
  const win = document.getElementById("chat-stream");
  if (!win) return;
  const turn = document.createElement("div");
  turn.className = `chat-turn chat-${role}`;
  turn.innerHTML = html;
  win.appendChild(turn);
  win.scrollTop = win.scrollHeight;
}

function escapeHTML(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderSuggestions(container, handler) {
  if (!container) return;
  container.innerHTML = SUGGESTIONS.map(
    (s) => `<button class="chip" type="button">${escapeHTML(s)}</button>`,
  ).join("");
  container.querySelectorAll(".chip").forEach((btn) =>
    btn.addEventListener("click", () => handler(btn.textContent || "")),
  );
}

async function runQuery(text) {
  const memoryNext = extractMemoryUpdates(text, State.data.memory);
  const memoryChanged = JSON.stringify(memoryNext) !== JSON.stringify(State.data.memory);
  if (memoryChanged) {
    State.data.memory = memoryNext;
    State.notify();
  }

  const intentResult = classifyIntent(text);
  const snapshot = computeSnapshot(State.data);
  const local = generateResponse({ intentResult, snapshot, memory: State.data.memory, query: text });
  const remote = await requestRemoteResponse({ query: text, snapshot, memory: State.data.memory, intentResult });
  const chosen = remote && remote.summary ? remote : local;
  const normalized = normalizeResponse(chosen);

  State.data.chat = [
    ...State.data.chat,
    { role: "user", text, response: null, ts: Date.now() },
    { role: "assistant", text: normalized.summary, response: normalized, ts: Date.now() },
  ].slice(-40);
  State.notify();

  renderTurn("assistant", renderResponseHTML(normalized));
}

export function initChat() {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const suggestions = document.getElementById("chat-suggestions");
  if (!form || !input) return;

  renderSuggestions(suggestions, (text) => {
    input.value = text;
    form.requestSubmit();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    renderTurn("user", `<p>${escapeHTML(text)}</p>`);
    await runQuery(text);
  });
}

export function renderInitialChat(state) {
  const win = document.getElementById("chat-stream");
  if (!win || win.childElementCount > 0) return;
  if (state.chat && state.chat.length > 0) {
    for (const turn of state.chat) {
      if (turn.role === "user") renderTurn("user", `<p>${escapeHTML(turn.text)}</p>`);
      else if (turn.response) renderTurn("assistant", renderResponseHTML(turn.response));
    }
    return;
  }
  renderTurn(
    "assistant",
    `<p class="welcome">Finance Copilot. Ask about spending, budgeting, subscriptions, savings, or a specific purchase. Answers are grounded in the data you've logged.</p>`,
  );
}
