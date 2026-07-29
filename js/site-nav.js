(() => {
  const header = document.querySelector(".site-header");
  const nav = document.querySelector(".site-nav");
  if (!header || !nav) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "nav-toggle";
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", "site-nav");
  btn.setAttribute("aria-label", "Menu");
  btn.innerHTML =
    '<span class="nav-toggle-bars" aria-hidden="true"></span>';

  if (!nav.id) nav.id = "site-nav";
  header.querySelector(".header-inner")?.appendChild(btn);

  const backdrop = document.createElement("div");
  backdrop.className = "nav-backdrop";
  backdrop.hidden = true;
  document.body.appendChild(backdrop);

  function openNav() {
    document.body.classList.add("nav-open");
    btn.setAttribute("aria-expanded", "true");
    backdrop.hidden = false;
  }

  function closeNav() {
    document.body.classList.remove("nav-open");
    btn.setAttribute("aria-expanded", "false");
    backdrop.hidden = true;
  }

  btn.addEventListener("click", () => {
    if (document.body.classList.contains("nav-open")) closeNav();
    else openNav();
  });
  backdrop.addEventListener("click", closeNav);
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeNav));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNav();
  });
})();
