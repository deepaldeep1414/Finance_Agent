import { loadState, saveState } from "./services/storage.js";

const initialState = () => ({
  user: null,
  joinDate: new Date().toISOString().split("T")[0],
  transactions: [],
  budget: { amount: 0, period: "Monthly" },
  memory: {
    monthlyIncome: null,
    savingsTarget: null,
    debtBalance: null,
    priorities: [],
  },
  chat: [],
  theme: "dark",
});

const listeners = new Set();

const State = {
  data: { ...initialState(), ...(loadState() || {}) },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  notify() {
    for (const fn of listeners) fn(this.data);
    saveState(this.data);
  },
  reset() {
    this.data = initialState();
    this.notify();
  },
};

export default State;
