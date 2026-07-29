(() => {
  const FEED_BASE = "/web-api/v1/feed";
  const PAGE_SIZE = 12;
  const PLAY_STORE =
    "https://play.google.com/store/apps/details?id=com.prod.contentnews";

  const feedList = document.getElementById("feed-list");
  const feedStatus = document.getElementById("feed-status");
  const feedTitle = document.getElementById("feed-title");
  const loadMoreBtn = document.getElementById("load-more");
  const navToggle = document.getElementById("nav-toggle");
  const navBackdrop = document.getElementById("nav-backdrop");
  const signinModal = document.getElementById("signin-modal");
  const openSignin = document.getElementById("open-signin");

  let nextCursor = null;
  let loading = false;
  let activeCategory = "";
  let activeLabel = "For You";
  let activeMarket = localStorage.getItem("eyenewz_market") || "global";

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

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function safeHttpUrl(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    try {
      const u = new URL(raw);
      if (u.protocol !== "http:" && u.protocol !== "https:") return "";
      return u.href;
    } catch {
      return "";
    }
  }

  function relativeTime(epochMs) {
    if (!epochMs) return "";
    const diff = Date.now() - Number(epochMs);
    const mins = Math.max(0, Math.floor(diff / 60000));
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 48) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 14) return `${days}d`;
    try {
      return new Date(epochMs).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return "";
    }
  }

  function clipSummary(article) {
    const raw =
      (article.whyItMatters || "").trim() ||
      (article.summary || "").trim() ||
      "";
    if (!raw) return "Open the source for the full story.";
    const words = raw.split(/\s+/);
    if (words.length <= 60) return raw;
    return `${words.slice(0, 60).join(" ")}…`;
  }

  function youtubeIdFromUrl(url) {
    const raw = String(url || "").trim();
    if (!raw) return "";
    try {
      const u = new URL(raw);
      const host = u.hostname.replace(/^www\./, "");
      if (host === "youtu.be") {
        return u.pathname.split("/").filter(Boolean)[0] || "";
      }
      if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
        if (u.searchParams.get("v")) return u.searchParams.get("v");
        const parts = u.pathname.split("/").filter(Boolean);
        const markers = ["embed", "shorts", "v", "live"];
        for (let i = 0; i < parts.length - 1; i += 1) {
          if (markers.includes(parts[i])) return parts[i + 1];
        }
      }
    } catch {
      /* ignore */
    }
    return "";
  }

  function looksLikeImageUrl(url) {
    const raw = String(url || "").trim();
    if (!/^https?:\/\//i.test(raw)) return false;
    try {
      const u = new URL(raw);
      const host = u.hostname.replace(/^www\./, "");
      const path = u.pathname.toLowerCase();
      // youtube.com/v/... and /watch are not <img> sources
      if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
        if (path.startsWith("/v/") || path === "/watch" || path.startsWith("/watch")) {
          return false;
        }
      }
      if (host === "youtu.be") return false;
      if (/\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(path)) return true;
      if (
        host.includes("ytimg.com") ||
        host.includes("ggpht.com") ||
        host.includes("googleusercontent.com") ||
        host.includes("twimg.com") ||
        host.includes("cloudfront.net") ||
        host.includes("images.") ||
        host.startsWith("i.") ||
        path.includes("/thumb") ||
        path.includes("/image") ||
        u.searchParams.has("w")
      ) {
        return true;
      }
      // API-hosted article images
      if (path.includes("/v1/articles/") && path.includes("/image")) return true;
      return false;
    } catch {
      return false;
    }
  }

  function resolveImage(article) {
    const candidates = [];
    const push = (url) => {
      const cleaned = String(url || "").trim();
      if (cleaned && !candidates.includes(cleaned)) candidates.push(cleaned);
    };

    push(article.imageUrl);
    push(article.posterUrl);
    push(article.thumbnailUrl);

    const ytId =
      youtubeIdFromUrl(article.originalUrl) ||
      youtubeIdFromUrl(article.thumbnailUrl) ||
      youtubeIdFromUrl(article.posterUrl) ||
      youtubeIdFromUrl(article.videoUrl);
    if (ytId) {
      push(`https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`);
      push(`https://i.ytimg.com/vi/${ytId}/mqdefault.jpg`);
    }

    const usable = candidates.filter(looksLikeImageUrl);
    // Prefer non-API publisher/CDN images when we have YouTube thumbs —
    // API /image can 404 for some video rows.
    const preferred = usable.sort((a, b) => {
      const aApi = a.includes("/v1/articles/") && a.includes("/image") ? 1 : 0;
      const bApi = b.includes("/v1/articles/") && b.includes("/image") ? 1 : 0;
      const aYt = a.includes("ytimg.com") ? -1 : 0;
      const bYt = b.includes("ytimg.com") ? -1 : 0;
      return aYt - bYt || aApi - bApi;
    });

    return {
      primary: preferred[0] || "",
      fallbacks: preferred.slice(1),
    };
  }

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

  function publisherInitial(name) {
    const cleaned = String(name || "N").trim();
    const letter = cleaned.charAt(0).toUpperCase();
    return /[A-Z0-9]/i.test(letter) ? letter : "N";
  }

  function iconThumb() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 22V11M2 13v6a2 2 0 0 0 2 2h12.2a2 2 0 0 0 1.95-1.55l2.1-8A2 2 0 0 0 18.3 9H14V5a3 3 0 0 0-3-3l-4 9H4a2 2 0 0 0-2 2Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function iconShare() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function cardHtml(article) {
    const { primary: image, fallbacks } = resolveImage(article);
    const rawHref = article.originalUrl || "";
    const href = safeHttpUrl(rawHref) || "#";
    const publisher = article.publisherName || "Publisher";
    const headline = article.headline || "Untitled";
    const summary = clipSummary(article);
    const when = relativeTime(article.publishedAtEpochMillis);
    const initial = publisherInitial(publisher);
    const safeImage = safeHttpUrl(image);
    const safeFallbacks = fallbacks.map(safeHttpUrl).filter(Boolean);
    const fallbackAttr = safeFallbacks.length
      ? ` data-fallbacks="${escapeHtml(safeFallbacks.join("|"))}"`
      : "";
    const media = safeImage
      ? `<a class="article-media" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">
           <img src="${escapeHtml(safeImage)}" alt="" loading="lazy" width="720" height="405"${fallbackAttr} />
         </a>`
      : "";

    return `<article class="article-card" data-id="${escapeHtml(article.id || "")}">
      <div class="article-body">
        <div class="article-publisher">
          <span class="pub-avatar" aria-hidden="true">${escapeHtml(initial)}</span>
          <div class="pub-meta">
            <strong>${escapeHtml(publisher)}</strong>
            <span>${when ? escapeHtml(when) : "Just now"}${article.category ? ` · ${escapeHtml(article.category)}` : ""}</span>
          </div>
        </div>
        ${media}
        <h2 class="article-headline">
          <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(headline)}</a>
        </h2>
        <p class="article-summary">${escapeHtml(summary)}</p>
        <div class="article-footer">
          <div class="article-actions">
            <button type="button" class="icon-btn action-like" aria-label="Like" aria-pressed="false">${iconThumb()} Like</button>
            <button type="button" class="icon-btn action-share" data-url="${escapeHtml(href)}" data-title="${escapeHtml(headline)}" aria-label="Share">${iconShare()} Share</button>
          </div>
          <a class="action-source" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">Read source</a>
        </div>
      </div>
    </article>`;
  }

  async function fetchFeed({ reset }) {
    if (loading) return;
    loading = true;
    loadMoreBtn.disabled = true;

    if (reset) {
      nextCursor = null;
      feedList.innerHTML = "";
      setStatus("Loading stories…");
      loadMoreBtn.hidden = true;
    } else {
      loadMoreBtn.textContent = "Loading…";
    }

    const params = new URLSearchParams({
      pageSize: String(PAGE_SIZE),
    });

    let category = activeCategory;
    if (!category && activeMarket === "global") {
      category = MARKET_DEFAULTS.global.forYouCategory;
    }
    if (category) params.set("category", category);
    if (activeMarket === "india" && !category) {
      params.set("region", "in");
    }
    if (!reset && nextCursor) params.set("cursor", nextCursor);

    try {
      const res = await fetch(`${FEED_BASE}?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error(`Feed error ${res.status}`);
      }
      const data = await res.json();
      const articles = Array.isArray(data.articles) ? data.articles : [];
      nextCursor = data.nextCursor || null;

      if (reset && articles.length === 0) {
        setStatus("No stories in this category right now. Try For You.");
        loadMoreBtn.hidden = true;
        return;
      }

      setStatus("");
      feedList.insertAdjacentHTML(
        "beforeend",
        articles.map(cardHtml).join(""),
      );
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

  function setActiveNav(button) {
    document.querySelectorAll(".nav-link").forEach((el) => {
      el.classList.toggle("is-active", el === button);
    });
    activeCategory = button.dataset.category || "";
    activeLabel = button.dataset.label || "For You";
    const marketMeta = MARKET_DEFAULTS[activeMarket] || MARKET_DEFAULTS.global;
    feedTitle.textContent =
      button.dataset.feed === "for-you" ? marketMeta.forYouLabel : activeLabel;
    fetchFeed({ reset: true });
    closeMobileNav();
  }

  function setMarket(market) {
    activeMarket = market === "india" ? "india" : "global";
    localStorage.setItem("eyenewz_market", activeMarket);
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

  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.addEventListener("click", () => setActiveNav(btn));
  });

  document.querySelectorAll(".market-btn").forEach((btn) => {
    btn.addEventListener("click", () => setMarket(btn.dataset.market));
  });

  // Restore market chrome
  document.querySelectorAll(".market-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.market === activeMarket);
  });
  const forYouBtn = document.querySelector('.nav-link[data-feed="for-you"]');
  if (forYouBtn && forYouBtn.classList.contains("is-active")) {
    const marketMeta = MARKET_DEFAULTS[activeMarket] || MARKET_DEFAULTS.global;
    feedTitle.textContent = marketMeta.forYouLabel;
  }

  loadMoreBtn.addEventListener("click", () => fetchFeed({ reset: false }));

  feedList.addEventListener(
    "error",
    (event) => {
      const img = event.target;
      if (!(img instanceof HTMLImageElement)) return;
      const raw = img.getAttribute("data-fallbacks") || "";
      const queue = raw.split("|").map((s) => s.trim()).filter(Boolean);
      if (queue.length) {
        const next = queue.shift();
        img.setAttribute("data-fallbacks", queue.join("|"));
        img.src = next;
        return;
      }
      const media = img.closest(".article-media");
      if (media) media.remove();
    },
    true,
  );

  feedList.addEventListener("click", async (event) => {
    const likeBtn = event.target.closest(".action-like");
    if (likeBtn) {
      const pressed = likeBtn.getAttribute("aria-pressed") === "true";
      likeBtn.setAttribute("aria-pressed", pressed ? "false" : "true");
      likeBtn.classList.toggle("is-liked", !pressed);
      return;
    }

    const shareBtn = event.target.closest(".action-share");
    if (!shareBtn) return;
    const url = shareBtn.dataset.url || PLAY_STORE;
    const title = shareBtn.dataset.title || "EyeNewz";
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        shareBtn.innerHTML = `${iconShare()} Copied`;
        setTimeout(() => {
          shareBtn.innerHTML = `${iconShare()} Share`;
        }, 1400);
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch {
      /* user cancelled share */
    }
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
    }
  });

  fetchFeed({ reset: true });
})();
