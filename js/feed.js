/** EyeNewz web feed — orchestration, search, engagement, deep links. */

import {
  getArticle,
  getFeed,
  search as searchApi,
  sendEvent,
  syncPrefs,
} from "./api.js";
import {
  blockPublisher,
  boostTopic,
  getBlockedPublishers,
  getDeviceId,
  getHiddenCategories,
  getMarket,
  getSavedIds,
  hideCategory,
  isNotInterested,
  markNotInterested,
  prefsPayload,
  setMarket as storeSetMarket,
  toggleLiked,
  toggleSaved,
  undoNotInterested,
} from "./store.js";
import {
  cardHtml,
  escapeHtml,
  expandCardContent,
  resolveImage,
  safeHttpUrl,
  storyPermalink,
} from "./card.js";

const PAGE_SIZE = 12;

const feedList = document.getElementById("feed-list");
const feedStatus = document.getElementById("feed-status");
const feedTitle = document.getElementById("feed-title");
const loadMoreBtn = document.getElementById("load-more");
const navToggle = document.getElementById("nav-toggle");
const navBackdrop = document.getElementById("nav-backdrop");
const signinModal = document.getElementById("signin-modal");
const openSignin = document.getElementById("open-signin");
const searchInput = document.getElementById("feed-search");
const searchInputMobile = document.getElementById("feed-search-mobile");
const searchClear = document.getElementById("search-clear");
const toastEl = document.getElementById("feed-toast");

function allSearchInputs() {
  return [searchInput, searchInputMobile].filter(Boolean);
}

function setSearchInputs(value) {
  allSearchInputs().forEach((el) => {
    el.value = value;
  });
}

let nextCursor = null;
let loading = false;
let activeCategory = "";
let activeLabel = "For You";
let activeMarket = getMarket();
let activeMode = "feed"; // feed | search | saved
let searchQuery = "";
let searchDebounce = null;
const seenIds = new Set();
const seenImageUrls = new Set();
const articleCache = new Map();
const expandedIds = new Set();

const MARKET_DEFAULTS = {
  global: {
    forYouCategory: "WorldNews,Technology,DeveloperTools,Science,Space",
    forYouLabel: "For You · Global",
  },
  india: {
    forYouCategory: "",
    forYouLabel: "For You · India",
  },
};

function setStatus(message, isError) {
  if (!message) {
    feedStatus.hidden = true;
    feedStatus.textContent = "";
    feedStatus.classList.remove("is-error");
    return;
  }
  feedStatus.hidden = false;
  feedStatus.textContent = message;
  feedStatus.classList.toggle("is-error", Boolean(isError));
}

function showToast(message, { undoId } = {}) {
  if (!toastEl) return;
  toastEl.hidden = false;
  toastEl.innerHTML = "";
  const text = document.createElement("span");
  text.textContent = message;
  toastEl.appendChild(text);
  if (undoId) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toast-undo";
    btn.textContent = "Undo";
    btn.addEventListener("click", () => {
      undoNotInterested(undoId);
      const card = feedList.querySelector(`[data-id="${CSS.escape(undoId)}"]`);
      if (card) card.hidden = false;
      toastEl.hidden = true;
    });
    toastEl.appendChild(btn);
  }
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toastEl.hidden = true;
  }, 4500);
}

function cacheArticles(articles) {
  for (const article of articles) {
    if (article?.id) articleCache.set(String(article.id), article);
  }
}

function personalizationParams() {
  const params = {
    deviceId: getDeviceId(),
    pageSize: PAGE_SIZE,
  };
  const blocked = getBlockedPublishers();
  const hidden = getHiddenCategories();
  if (blocked.length) params.blockedPublisherIds = blocked.join(",");
  if (hidden.length) params.hiddenCategories = hidden.join(",");
  return params;
}

function renderArticles(articles, { reset, prepend = false } = {}) {
  const unique = [];
  for (const article of articles) {
    const id = String(article.id || "").trim();
    if (!id) continue;
    if (isNotInterested(id)) continue;
    if (getBlockedPublishers().includes(String(article.publisherId || ""))) continue;
    if (seenIds.has(id) && !prepend) continue;
    const imageKey = safeHttpUrl(resolveImage(article).primary);
    if (imageKey && seenImageUrls.has(imageKey) && !prepend) continue;
    seenIds.add(id);
    if (imageKey) seenImageUrls.add(imageKey);
    unique.push(article);
  }
  if (!unique.length) return 0;
  const html = unique
    .map((a) => cardHtml(a, { expanded: expandedIds.has(String(a.id)) }))
    .join("");
  if (prepend) feedList.insertAdjacentHTML("afterbegin", html);
  else feedList.insertAdjacentHTML("beforeend", html);
  return unique.length;
}

async function fetchFeed({ reset }) {
  if (loading) return;
  loading = true;
  loadMoreBtn.disabled = true;
  activeMode = "feed";

  if (reset) {
    nextCursor = null;
    seenIds.clear();
    seenImageUrls.clear();
    feedList.innerHTML = "";
    setStatus("Loading stories…");
    loadMoreBtn.hidden = true;
  } else {
    loadMoreBtn.textContent = "Loading…";
  }

  const params = personalizationParams();
  let category = activeCategory;
  if (!category && activeMarket === "global") {
    category = MARKET_DEFAULTS.global.forYouCategory;
  }
  if (category) params.category = category;
  if (activeMarket === "india" && !category) params.region = "in";
  if (!reset && nextCursor) params.cursor = nextCursor;

  try {
    const data = await getFeed(params);
    const articles = Array.isArray(data.articles) ? data.articles : [];
    cacheArticles(articles);
    nextCursor = data.nextCursor || null;

    if (reset && articles.length === 0) {
      setStatus("No stories in this category right now. Try For You.");
      loadMoreBtn.hidden = true;
      return;
    }

    setStatus("");
    const added = renderArticles(articles, { reset });
    if (!added && reset) {
      setStatus("No stories in this category right now. Try For You.");
    }
    loadMoreBtn.hidden = !nextCursor;
    loadMoreBtn.textContent = "Load more";
  } catch (err) {
    console.error(err);
    if (reset) {
      setStatus("Could not load stories. Please refresh and try again.", true);
    } else {
      setStatus("Could not load more stories.", true);
    }
    loadMoreBtn.hidden = !nextCursor;
    loadMoreBtn.textContent = "Load more";
  } finally {
    loading = false;
    loadMoreBtn.disabled = false;
  }
}

async function fetchSearch({ reset }) {
  if (loading) return;
  const q = searchQuery.trim();
  if (q.length < 2) return;

  loading = true;
  loadMoreBtn.disabled = true;
  activeMode = "search";

  if (reset) {
    nextCursor = null;
    seenIds.clear();
    seenImageUrls.clear();
    feedList.innerHTML = "";
    setStatus(`Searching for “${q}”…`);
    loadMoreBtn.hidden = true;
    feedTitle.textContent = `Results for “${q}”`;
  } else {
    loadMoreBtn.textContent = "Loading…";
  }

  const params = {
    ...personalizationParams(),
    q,
  };
  if (!reset && nextCursor) params.cursor = nextCursor;

  try {
    const data = await searchApi(params);
    const articles = Array.isArray(data.articles) ? data.articles : [];
    cacheArticles(articles);
    nextCursor = data.nextCursor || null;

    if (reset && articles.length === 0) {
      setStatus("");
      feedList.innerHTML = `<div class="empty-state">
        <p>No stories match “${escapeHtml(q)}”.</p>
        <p class="empty-hint">Try World, Tech &amp; Science, or Sports from the left nav.</p>
        <button type="button" class="btn-load-more" id="back-to-feed">Back to For You</button>
      </div>`;
      document.getElementById("back-to-feed")?.addEventListener("click", clearSearch);
      loadMoreBtn.hidden = true;
      return;
    }

    setStatus("");
    renderArticles(articles, { reset });
    loadMoreBtn.hidden = !nextCursor;
    loadMoreBtn.textContent = "Load more";
  } catch (err) {
    console.error(err);
    setStatus("Search failed. Please try again.", true);
    loadMoreBtn.hidden = !nextCursor;
    loadMoreBtn.textContent = "Load more";
  } finally {
    loading = false;
    loadMoreBtn.disabled = false;
  }
}

async function fetchSaved() {
  activeMode = "saved";
  nextCursor = null;
  seenIds.clear();
  seenImageUrls.clear();
  feedList.innerHTML = "";
  feedTitle.textContent = "Saved";
  loadMoreBtn.hidden = true;

  const ids = getSavedIds();
  if (!ids.length) {
    setStatus("No saved stories yet. Tap Save on a card to keep it here.");
    return;
  }

  setStatus("Loading saved stories…");
  const articles = [];
  for (const id of ids) {
    try {
      const cached = articleCache.get(id);
      const article = cached || (await getArticle(id));
      if (article) {
        articleCache.set(id, article);
        articles.push(article);
      }
    } catch {
      /* skip missing */
    }
  }
  setStatus("");
  if (!articles.length) {
    setStatus("Saved stories could not be loaded.", true);
    return;
  }
  renderArticles(articles, { reset: true });
}

function updateUrlState() {
  const url = new URL(window.location.href);
  if (activeMode === "search" && searchQuery.trim().length >= 2) {
    url.searchParams.set("q", searchQuery.trim());
    url.searchParams.delete("story");
  } else if (url.searchParams.has("q") && activeMode !== "search") {
    url.searchParams.delete("q");
  }
  const next = `${url.pathname}${url.search}${url.hash}`;
  if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    history.pushState({}, "", next);
  }
}

function clearSearch() {
  searchQuery = "";
  setSearchInputs("");
  if (searchClear) searchClear.hidden = true;
  const forYou = document.querySelector('.nav-link[data-feed="for-you"]');
  if (forYou) setActiveNav(forYou);
  else {
    activeMode = "feed";
    updateUrlState();
    fetchFeed({ reset: true });
  }
}

function setActiveNav(button) {
  document.querySelectorAll(".nav-link").forEach((el) => {
    el.classList.toggle("is-active", el === button);
  });
  const feed = button.dataset.feed || "";
  if (feed === "saved") {
    activeCategory = "";
    activeLabel = "Saved";
    fetchSaved();
    closeMobileNav();
    return;
  }
  activeCategory = button.dataset.category || "";
  activeLabel = button.dataset.label || "For You";
  const marketMeta = MARKET_DEFAULTS[activeMarket] || MARKET_DEFAULTS.global;
  feedTitle.textContent =
    button.dataset.feed === "for-you" ? marketMeta.forYouLabel : activeLabel;
  searchQuery = "";
  setSearchInputs("");
  if (searchClear) searchClear.hidden = true;
  updateUrlState();
  fetchFeed({ reset: true });
  closeMobileNav();
}

function setMarket(market) {
  activeMarket = storeSetMarket(market);
  document.querySelectorAll(".market-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.market === activeMarket);
  });
  const forYou = document.querySelector('.nav-link[data-feed="for-you"]');
  if (forYou) setActiveNav(forYou);
  else fetchFeed({ reset: true });
}

function openMobileNav() {
  document.body.classList.add("nav-open");
  navToggle.setAttribute("aria-expanded", "true");
  navBackdrop.hidden = false;
}

function closeMobileNav() {
  document.body.classList.remove("nav-open");
  navToggle.setAttribute("aria-expanded", "false");
  navBackdrop.hidden = true;
}

function openModal() {
  signinModal.hidden = false;
  document.body.classList.add("modal-open");
  closeMobileNav();
}

function closeModal() {
  signinModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function closeMenus(except) {
  document.querySelectorAll(".share-menu, .more-menu").forEach((menu) => {
    if (except && menu === except) return;
    menu.hidden = true;
  });
  document.querySelectorAll(".action-share, .action-more").forEach((btn) => {
    btn.setAttribute("aria-expanded", "false");
  });
}

async function expandCard(card) {
  const id = card.dataset.id;
  const article = articleCache.get(id);
  if (!article) return;
  const content = card.querySelector(".article-content");
  if (!content) return;
  content.innerHTML = expandCardContent(article);
  card.classList.add("is-expanded");
  expandedIds.add(id);
  boostTopic(article.category);
  sendEvent("view", {
    articleId: id,
    deviceId: getDeviceId(),
    metadata: { source: "web_expand" },
  });
  syncPrefs(prefsPayload());
}

async function openStoryFromUrl(storyId) {
  if (!storyId) return;
  try {
    const article = await getArticle(storyId);
    articleCache.set(String(article.id), article);
    expandedIds.add(String(article.id));
    seenIds.clear();
    seenImageUrls.clear();
    feedList.innerHTML = "";
    feedTitle.textContent = "Story";
    setStatus("");
    renderArticles([article], { reset: true });
    const card = feedList.querySelector(`[data-id="${CSS.escape(String(article.id))}"]`);
    if (card) {
      await expandCard(card);
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // Also load the regular feed underneath
    activeMode = "feed";
    const more = await getFeed(personalizationParams());
    const rest = (more.articles || []).filter((a) => String(a.id) !== String(article.id));
    cacheArticles(rest);
    nextCursor = more.nextCursor || null;
    renderArticles(rest, { reset: false });
    loadMoreBtn.hidden = !nextCursor;
  } catch (err) {
    console.error(err);
    setStatus("Could not open that story.", true);
    fetchFeed({ reset: true });
  }
}

function onSearchInput(event) {
  const value = (event?.target?.value || searchInput?.value || "").trim();
  searchQuery = value;
  setSearchInputs(value);
  if (searchClear) searchClear.hidden = value.length === 0;
  clearTimeout(searchDebounce);
  if (value.length < 2) {
    if (activeMode === "search") {
      searchDebounce = setTimeout(() => {
        if ((searchInput?.value || "").trim().length < 2) clearSearch();
      }, 300);
    }
    return;
  }
  searchDebounce = setTimeout(() => {
    document.querySelectorAll(".nav-link").forEach((el) => el.classList.remove("is-active"));
    updateUrlState();
    fetchSearch({ reset: true });
  }, 300);
}

// —— Event wiring ——
document.querySelectorAll(".nav-link").forEach((btn) => {
  btn.addEventListener("click", () => setActiveNav(btn));
});

document.querySelectorAll(".market-btn").forEach((btn) => {
  btn.addEventListener("click", () => setMarket(btn.dataset.market));
});

document.querySelectorAll(".market-btn").forEach((btn) => {
  btn.classList.toggle("is-active", btn.dataset.market === activeMarket);
});
const forYouBtn = document.querySelector('.nav-link[data-feed="for-you"]');
if (forYouBtn && forYouBtn.classList.contains("is-active")) {
  const marketMeta = MARKET_DEFAULTS[activeMarket] || MARKET_DEFAULTS.global;
  feedTitle.textContent = marketMeta.forYouLabel;
}

loadMoreBtn.addEventListener("click", () => {
  if (activeMode === "search") fetchSearch({ reset: false });
  else if (activeMode === "feed") fetchFeed({ reset: false });
});

allSearchInputs().forEach((el) => {
  el.addEventListener("input", onSearchInput);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Escape") clearSearch();
  });
});
if (searchClear) {
  searchClear.addEventListener("click", clearSearch);
}

feedList.addEventListener(
  "error",
  (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement)) return;

    if (img.classList.contains("pub-logo")) {
      const initial = img.dataset.initial || "N";
      const avatar = document.createElement("span");
      avatar.className = "pub-avatar";
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = initial;
      img.replaceWith(avatar);
      return;
    }

    const raw = img.getAttribute("data-fallbacks") || "";
    const queue = raw.split("|").map((s) => s.trim()).filter(Boolean);
    if (queue.length) {
      const next = queue.shift();
      img.setAttribute("data-fallbacks", queue.join("|"));
      img.removeAttribute("srcset");
      img.src = next;
      return;
    }
    const media = img.closest(".article-media");
    if (media) {
      media.classList.add("article-media-placeholder");
      media.innerHTML = "";
      if (media.tagName === "A") {
        const div = document.createElement("div");
        div.className = "article-media article-media-placeholder";
        media.replaceWith(div);
      }
    }
  },
  true,
);

feedList.addEventListener("click", async (event) => {
  const expandBtn = event.target.closest(".action-expand");
  if (expandBtn) {
    const card = expandBtn.closest(".article-card");
    if (card) expandCard(card);
    return;
  }

  const likeBtn = event.target.closest(".action-like");
  if (likeBtn) {
    const card = likeBtn.closest(".article-card");
    const id = card?.dataset.id;
    if (!id) return;
    const nowLiked = toggleLiked(id);
    likeBtn.setAttribute("aria-pressed", nowLiked ? "true" : "false");
    likeBtn.classList.toggle("is-liked", nowLiked);
    if (nowLiked) {
      sendEvent("like", { articleId: id, deviceId: getDeviceId() });
    }
    return;
  }

  const saveBtn = event.target.closest(".action-save");
  if (saveBtn) {
    const card = saveBtn.closest(".article-card");
    const id = card?.dataset.id;
    if (!id) return;
    const nowSaved = toggleSaved(id);
    saveBtn.setAttribute("aria-pressed", nowSaved ? "true" : "false");
    saveBtn.classList.toggle("is-saved", nowSaved);
    if (nowSaved) {
      sendEvent("bookmark", { articleId: id, deviceId: getDeviceId() });
      showToast("Saved to your list");
    } else {
      showToast("Removed from Saved");
    }
    return;
  }

  const shareBtn = event.target.closest(".action-share");
  if (shareBtn) {
    event.preventDefault();
    const wrap = shareBtn.closest(".share-wrap");
    const menu = wrap?.querySelector(".share-menu");
    const opening = menu?.hidden;
    closeMenus(opening ? menu : null);
    if (menu) {
      menu.hidden = !opening;
      shareBtn.setAttribute("aria-expanded", opening ? "true" : "false");
    }
    return;
  }

  const shareItem = event.target.closest("[data-share]");
  if (shareItem) {
    const card = shareItem.closest(".article-card");
    const permalink = card?.dataset.permalink || storyPermalink(card?.dataset.id);
    const title = card?.dataset.title || "EyeNewz";
    const kind = shareItem.dataset.share;
    if (kind === "copy") {
      event.preventDefault();
      try {
        await navigator.clipboard.writeText(permalink);
        shareItem.textContent = "Copied";
        setTimeout(() => {
          shareItem.textContent = "Copy link";
        }, 1400);
      } catch {
        /* ignore */
      }
    } else if (kind === "native") {
      event.preventDefault();
      try {
        if (navigator.share) await navigator.share({ title, url: permalink, text: title });
        else await navigator.clipboard.writeText(permalink);
      } catch {
        /* cancelled */
      }
    }
    if (card?.dataset.id) {
      sendEvent("share", {
        articleId: card.dataset.id,
        deviceId: getDeviceId(),
        metadata: { channel: kind || "web" },
      });
    }
    closeMenus();
    return;
  }

  const moreBtn = event.target.closest(".action-more");
  if (moreBtn) {
    const wrap = moreBtn.closest(".more-wrap");
    const menu = wrap?.querySelector(".more-menu");
    const opening = menu?.hidden;
    closeMenus(opening ? menu : null);
    if (menu) {
      menu.hidden = !opening;
      moreBtn.setAttribute("aria-expanded", opening ? "true" : "false");
    }
    return;
  }

  const moreItem = event.target.closest(".more-item");
  if (moreItem) {
    const card = moreItem.closest(".article-card");
    const id = card?.dataset.id;
    const action = moreItem.dataset.action;
    if (!card || !id) return;
    if (action === "not-interested") {
      markNotInterested(id);
      const category = card.dataset.category;
      if (category) hideCategory(category);
      card.hidden = true;
      sendEvent("hide", {
        articleId: id,
        deviceId: getDeviceId(),
        metadata: { reason: "not_interested" },
      });
      syncPrefs(prefsPayload());
      showToast("Got it — we'll show fewer like this", { undoId: id });
    } else if (action === "fewer-publisher") {
      const publisherId = card.dataset.publisherId;
      blockPublisher(publisherId);
      card.hidden = true;
      syncPrefs(prefsPayload());
      showToast("We'll show fewer from this publisher");
      // Hide other cards from same publisher currently on screen
      feedList.querySelectorAll(".article-card").forEach((el) => {
        if (el.dataset.publisherId === publisherId) el.hidden = true;
      });
    }
    closeMenus();
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".share-wrap, .more-wrap")) closeMenus();
});

navToggle.addEventListener("click", () => {
  if (document.body.classList.contains("nav-open")) closeMobileNav();
  else openMobileNav();
});
navBackdrop.addEventListener("click", closeMobileNav);

openSignin.addEventListener("click", openModal);
signinModal.querySelectorAll("[data-close-modal]").forEach((el) => {
  el.addEventListener("click", closeModal);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
    closeMobileNav();
    closeMenus();
  }
});

window.addEventListener("popstate", () => {
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q") || "";
  const story = params.get("story") || articleIdFromPath() || "";
  if (story) {
    openStoryFromUrl(story);
  } else if (q.length >= 2) {
    setSearchInputs(q);
    searchQuery = q;
    if (searchClear) searchClear.hidden = false;
    fetchSearch({ reset: true });
  } else {
    clearSearch();
  }
});

function articleIdFromPath() {
  const match = window.location.pathname.match(/\/a\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function captureReferralFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const ref = (params.get("ref") || "").trim();
  if (!ref) return;
  try {
    sessionStorage.setItem("eyenewz_ref", ref);
  } catch {
    /* ignore */
  }
}

// Boot
getDeviceId();
syncPrefs(prefsPayload());
captureReferralFromUrl();

const bootParams = new URLSearchParams(window.location.search);
const bootStory = bootParams.get("story") || articleIdFromPath();
const bootQ = bootParams.get("q");
if (bootStory) {
  openStoryFromUrl(bootStory);
} else if (bootQ && bootQ.trim().length >= 2) {
  setSearchInputs(bootQ);
  searchQuery = bootQ.trim();
  if (searchClear) searchClear.hidden = false;
  fetchSearch({ reset: true });
} else {
  fetchFeed({ reset: true });
}
