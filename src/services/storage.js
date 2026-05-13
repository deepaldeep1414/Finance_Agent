const KEY = "financeCopilot/v1";

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveState(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable */
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}
