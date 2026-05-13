const PAGES = ["dashboard", "transactions", "budget", "copilot", "memory"];

export function initSidebar({ onNavigate }) {
  const buttons = document.querySelectorAll(".nav-link[data-page]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.page;
      if (!PAGES.includes(target)) return;
      onNavigate(target);
      buttons.forEach((b) => b.classList.toggle("is-active", b === btn));
      document.querySelectorAll(".page").forEach((p) => {
        p.classList.toggle("is-active", p.id === `page-${target}`);
      });
    });
  });
}
