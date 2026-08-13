import {
  articleImageSrc,
  getTechFeed,
  getTechHome,
  getTechModels,
  joinWaitlist,
} from "./api.js";

const PLAY =
  "https://play.google.com/store/apps/details?id=com.prod.contentnews";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function relativeTime(epochMs) {
  if (!epochMs) return "";
  const mins = Math.max(0, Math.floor((Date.now() - Number(epochMs)) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function storyCard(article) {
  const href = article.storyUrl || `/story/${encodeURIComponent(article.id)}`;
  const img = articleImageSrc(article);
  const imgTag = img
    ? `<img src="${escapeHtml(img)}" alt="" loading="lazy" />`
    : "";
  const summary = escapeHtml((article.summary || "").slice(0, 140));
  return `<a class="story-card" href="${escapeHtml(href)}">
    ${imgTag}
    <div class="body">
      <span class="kicker">${escapeHtml(article.publisherName || article.category || "")} · ${relativeTime(article.publishedAtEpochMillis)}</span>
      <h3>${escapeHtml(article.headline)}</h3>
      <p>${summary}</p>
    </div>
  </a>`;
}

function modelCard(model) {
  return `<a class="model-card" href="${escapeHtml(model.pageUrl || `/models/${model.slug}`)}">
    <div class="vendor">${escapeHtml(model.vendor)} · ${escapeHtml(model.pricing)}</div>
    <h3>${escapeHtml(model.name)}</h3>
    <p class="tiny">${escapeHtml(model.bestFor || model.simpleTake || "")}</p>
    <span class="badge">${escapeHtml(model.status || "ga")}</span>
  </a>`;
}

function renderList(el, html) {
  if (!el) return;
  el.innerHTML = html || `<p class="status">Nothing here yet. Check back after the next ingest.</p>`;
}

function detectPlatform() {
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  return "desktop";
}

async function loadHome() {
  const data = await getTechHome();
  const heroEl = document.getElementById("hero");
  if (heroEl && data.hero) {
    const a = data.hero;
    const img = articleImageSrc(a);
    heroEl.innerHTML = `
      <a class="hero" href="${escapeHtml(a.storyUrl)}">
        ${img ? `<img src="${escapeHtml(img)}" alt="" />` : ""}
        <div class="hero-copy">
          <p class="kicker">Latest · ${escapeHtml(a.publisherName || "")}</p>
          <h1>${escapeHtml(a.headline)}</h1>
          <p>${escapeHtml(a.summary || "")}</p>
        </div>
      </a>`;
  }
  renderList(document.getElementById("latest"), (data.latest || []).map(storyCard).join(""));
  renderList(document.getElementById("blogs"), (data.blogs || []).map(storyCard).join(""));
  renderList(document.getElementById("videos"), (data.videos || []).map(storyCard).join(""));
  renderList(document.getElementById("space"), (data.space || []).map(storyCard).join(""));
  renderList(document.getElementById("models"), (data.models || []).slice(0, 8).map(modelCard).join(""));
}

async function loadSection(section) {
  const data = await getTechFeed(section, 24);
  renderList(document.getElementById("feed"), (data.articles || []).map(storyCard).join(""));
  const title = document.getElementById("page-title");
  if (title && data.title) title.textContent = data.title;
}

async function loadModels() {
  const data = await getTechModels();
  renderList(document.getElementById("models"), (data.models || []).map(modelCard).join(""));
}

function wireWaitlist() {
  const form = document.getElementById("waitlist-form");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = form.querySelector("input[name=email]")?.value || "";
    const note = document.getElementById("waitlist-note");
    try {
      const result = await joinWaitlist(email, "ios");
      if (note) note.textContent = result.message || "You're on the list.";
      form.reset();
    } catch (err) {
      if (note) note.textContent = err.message || "Could not join the waitlist.";
    }
  });
  const copyBtn = document.getElementById("copy-link");
  copyBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("https://tech.eyenewz.com/get");
      copyBtn.textContent = "Copied";
    } catch {
      copyBtn.textContent = "Copy failed";
    }
  });
}

function applyPlatform() {
  const platform = detectPlatform();
  document.body.classList.add(`is-${platform}`);
  if (platform === "android" && document.body.dataset.page === "get") {
    window.location.replace(PLAY);
  }
}

const page = document.body.dataset.page || "home";
applyPlatform();
wireWaitlist();

const status = document.getElementById("status");
const run = async () => {
  try {
    if (page === "home") await loadHome();
    else if (page === "models") await loadModels();
    else if (["news", "blogs", "videos", "space"].includes(page)) await loadSection(page);
    if (status) status.hidden = true;
  } catch (err) {
    if (status) status.textContent = err.message || "Could not load EyeNewz Tech.";
  }
};

if (["home", "news", "blogs", "videos", "space", "models"].includes(page)) {
  run();
}
