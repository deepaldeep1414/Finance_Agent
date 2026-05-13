import State from "../state.js";

function showApp() {
  document.getElementById("login-view").classList.remove("is-active");
  document.getElementById("app-view").classList.add("is-active");
}

function showLogin() {
  document.getElementById("login-view").classList.add("is-active");
  document.getElementById("app-view").classList.remove("is-active");
}

export function initAuth() {
  const form = document.getElementById("login-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("login-name").value.trim();
    if (!name) return;
    State.data.user = name;
    if (!State.data.joinDate) State.data.joinDate = new Date().toISOString().split("T")[0];
    State.notify();
    showApp();
  });

  document.querySelectorAll("[data-action='logout']").forEach((btn) =>
    btn.addEventListener("click", () => {
      State.data.user = null;
      State.notify();
      showLogin();
    }),
  );

  if (State.data.user) showApp();
  else showLogin();
}
