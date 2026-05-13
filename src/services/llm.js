const ENDPOINT = "/api/finance";

export async function requestRemoteResponse({ query, snapshot, memory, intentResult }) {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, snapshot, memory, intent_hint: intentResult }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
  }
}
