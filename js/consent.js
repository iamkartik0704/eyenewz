(() => {
  const KEY = "eyenewz_consent_v1";
  if (localStorage.getItem(KEY)) return;

  const bar = document.createElement("div");
  bar.className = "consent-bar";
  bar.setAttribute("role", "dialog");
  bar.setAttribute("aria-label", "Privacy preferences");
  bar.innerHTML = `
    <p>
      We use essential cookies to run EyeNewz. Optional analytics load only if you accept.
      See our <a href="/privacy">Privacy Policy</a>.
    </p>
    <div class="consent-actions">
      <button type="button" class="consent-btn consent-essential" data-choice="essential">Essential only</button>
      <button type="button" class="consent-btn consent-accept" data-choice="accepted">Accept</button>
    </div>
  `;
  document.body.appendChild(bar);

  bar.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-choice]");
    if (!btn) return;
    const choice = btn.getAttribute("data-choice");
    localStorage.setItem(KEY, choice);
    // Hook for future analytics: only init when choice === "accepted"
    window.__EYENEWZ_CONSENT__ = choice;
    bar.remove();
  });
})();
