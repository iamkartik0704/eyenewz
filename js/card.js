/** Article card rendering for the EyeNewz web feed. */

import {
  articleImageSrcset,
  publisherLogoUrl as logoFromHome,
} from "./api.js";
import { isLiked, isSaved } from "./store.js";

const SITE_ORIGIN = "https://eyenewz.com";

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function safeHttpUrl(value) {
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

export function relativeTime(epochMs) {
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

export function storyPermalink(articleId, ref) {
  const id = encodeURIComponent(articleId || "");
  const params = new URLSearchParams({
    utm_source: "eyenewz_web",
    utm_medium: "share",
    utm_campaign: "story",
    utm_content: articleId || "",
  });
  if (ref) params.set("ref", String(ref));
  return `${SITE_ORIGIN}/a/${id}?${params.toString()}`;
}

function publisherInitial(name) {
  const cleaned = String(name || "N").trim();
  const letter = cleaned.charAt(0).toUpperCase();
  return /[A-Z0-9]/i.test(letter) ? letter : "N";
}

function wordsOf(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function collapsedSummary(article) {
  const raw = (article.summary || "").trim();
  if (!raw) {
    const fallback =
      (article.whyItMatters || "").trim() || "Open the source for the full story.";
    const words = wordsOf(fallback);
    if (words.length <= 80) return { text: fallback, truncated: false };
    return { text: `${words.slice(0, 80).join(" ")}…`, truncated: true };
  }
  const words = wordsOf(raw);
  if (words.length <= 80) return { text: raw, truncated: false };
  return { text: `${words.slice(0, 80).join(" ")}…`, truncated: true };
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
    if (path.includes("/v1/articles/") && path.includes("/image")) return true;
    if (path.includes("/web-api/") && path.includes("/image")) return true;
    return false;
  } catch {
    return false;
  }
}

export function resolveImage(article) {
  const candidates = [];
  const push = (url) => {
    const cleaned = String(url || "").trim();
    if (cleaned && !candidates.includes(cleaned)) candidates.push(cleaned);
  };

  // Prefer proxied/resized API image when we have an article id.
  if (article.id) {
    const { src } = articleImageSrcset(article.id);
    push(src);
  }
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
  const preferred = usable.sort((a, b) => {
    const aApi = a.includes("/articles/") && a.includes("/image") ? -1 : 0;
    const bApi = b.includes("/articles/") && b.includes("/image") ? -1 : 0;
    const aYt = a.includes("ytimg.com") ? -1 : 0;
    const bYt = b.includes("ytimg.com") ? -1 : 0;
    return aApi - bApi || aYt - bYt;
  });

  return {
    primary: preferred[0] || "",
    fallbacks: preferred.slice(1),
  };
}

function iconThumb() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 22V11M2 13v6a2 2 0 0 0 2 2h12.2a2 2 0 0 0 1.95-1.55l2.1-8A2 2 0 0 0 18.3 9H14V5a3 3 0 0 0-3-3l-4 9H4a2 2 0 0 0-2 2Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function iconBookmark() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function iconShare() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function iconMore() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>`;
}

function takeawaysHtml(takeaways) {
  if (!Array.isArray(takeaways) || !takeaways.length) return "";
  const items = takeaways
    .map((t) => String(t || "").trim())
    .filter(Boolean)
    .map((t) => `<li>${escapeHtml(t)}</li>`)
    .join("");
  if (!items) return "";
  return `<div class="article-takeaways"><p class="article-section-label">Key takeaways</p><ul>${items}</ul></div>`;
}

function expandedBodyHtml(article, href) {
  const summary = (article.summary || "").trim() || "Open the source for the full story.";
  const why = (article.whyItMatters || "").trim();
  const whyBlock = why
    ? `<div class="article-why"><p class="article-section-label">Why it matters</p><p>${escapeHtml(why)}</p></div>`
    : "";
  return `
    <div class="article-expanded">
      <p class="article-summary-full">${escapeHtml(summary)}</p>
      ${whyBlock}
      ${takeawaysHtml(article.takeaways)}
      <a class="action-source expand-source" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">Read full story</a>
    </div>`;
}

function shareMenuHtml(permalink, headline) {
  const text = encodeURIComponent(headline);
  const url = encodeURIComponent(permalink);
  const wa = `https://wa.me/?text=${encodeURIComponent(`${headline}\n${permalink}`)}`;
  const x = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
  const tg = `https://t.me/share/url?url=${url}&text=${text}`;
  const mail = `mailto:?subject=${text}&body=${encodeURIComponent(`${headline}\n\n${permalink}`)}`;
  return `<div class="share-menu" hidden role="menu">
    <button type="button" class="share-item" data-share="native" role="menuitem">Share via device…</button>
    <a class="share-item" data-share="wa" href="${escapeHtml(wa)}" target="_blank" rel="noopener noreferrer" role="menuitem">WhatsApp</a>
    <a class="share-item" data-share="x" href="${escapeHtml(x)}" target="_blank" rel="noopener noreferrer" role="menuitem">X</a>
    <a class="share-item" data-share="fb" href="${escapeHtml(fb)}" target="_blank" rel="noopener noreferrer" role="menuitem">Facebook</a>
    <a class="share-item" data-share="li" href="${escapeHtml(li)}" target="_blank" rel="noopener noreferrer" role="menuitem">LinkedIn</a>
    <a class="share-item" data-share="tg" href="${escapeHtml(tg)}" target="_blank" rel="noopener noreferrer" role="menuitem">Telegram</a>
    <a class="share-item" data-share="mail" href="${escapeHtml(mail)}" role="menuitem">Email</a>
    <button type="button" class="share-item" data-share="copy" role="menuitem">Copy link</button>
  </div>`;
}

export function cardHtml(article, { expanded = false } = {}) {
  const id = String(article.id || "");
  const { primary: image, fallbacks } = resolveImage(article);
  const rawHref = article.originalUrl || "";
  const href = safeHttpUrl(rawHref) || "#";
  const publisher = article.publisherName || "Publisher";
  const headline = article.headline || "Untitled";
  const { text: summary, truncated } = collapsedSummary(article);
  const when = relativeTime(article.publishedAtEpochMillis);
  const initial = publisherInitial(publisher);
  const safeImage = safeHttpUrl(image);
  const safeFallbacks = fallbacks.map(safeHttpUrl).filter(Boolean);
  const srcsetInfo = id ? articleImageSrcset(id) : { src: "", srcset: "" };
  const useSrcset =
    safeImage &&
    (safeImage.includes("/image") || safeImage === safeHttpUrl(srcsetInfo.src));
  const fallbackAttr = safeFallbacks.length
    ? ` data-fallbacks="${escapeHtml(safeFallbacks.join("|"))}"`
    : "";
  const srcsetAttr =
    useSrcset && srcsetInfo.srcset
      ? ` srcset="${escapeHtml(srcsetInfo.srcset)}" sizes="(max-width: 720px) 100vw, 680px"`
      : "";

  const logoUrl =
    safeHttpUrl(article.publisherLogoUrl) ||
    (article.publisherHomeUrl ? logoFromHome(article.publisherHomeUrl) : "");
  const logo = logoUrl
    ? `<img class="pub-logo" src="${escapeHtml(logoUrl)}" alt="" width="40" height="40" loading="lazy" data-initial="${escapeHtml(initial)}" />`
    : `<span class="pub-avatar" aria-hidden="true">${escapeHtml(initial)}</span>`;

  const media = safeImage
    ? `<a class="article-media" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">
         <img src="${escapeHtml(useSrcset ? srcsetInfo.src || safeImage : safeImage)}" alt="" loading="lazy" width="720" height="405"${srcsetAttr}${fallbackAttr} />
       </a>`
    : `<div class="article-media article-media-placeholder" aria-hidden="true"></div>`;

  const liked = isLiked(id);
  const saved = isSaved(id);
  const permalink = storyPermalink(id);
  const expandClass = expanded ? " is-expanded" : "";
  const summaryBlock = expanded
    ? expandedBodyHtml(article, href)
    : `<p class="article-summary">${escapeHtml(summary)}</p>
       ${
         truncated
           ? `<button type="button" class="action-expand">Read more</button>`
           : `<button type="button" class="action-expand is-subtle">Details</button>`
       }`;

  return `<article class="article-card${expandClass}" data-id="${escapeHtml(id)}" data-publisher-id="${escapeHtml(article.publisherId || "")}" data-category="${escapeHtml(article.category || "")}" data-permalink="${escapeHtml(permalink)}" data-title="${escapeHtml(headline)}">
    <div class="article-body">
      <div class="article-publisher">
        ${logo}
        <div class="pub-meta">
          <strong>${escapeHtml(publisher)}</strong>
          <span>${when ? escapeHtml(when) : "Just now"}${article.category ? ` · ${escapeHtml(article.category)}` : ""}</span>
        </div>
      </div>
      ${media}
      <h2 class="article-headline">
        <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(headline)}</a>
      </h2>
      <div class="article-content">
        ${summaryBlock}
      </div>
      <div class="article-footer">
        <div class="article-actions">
          <button type="button" class="icon-btn action-like${liked ? " is-liked" : ""}" aria-label="Like" aria-pressed="${liked ? "true" : "false"}">${iconThumb()} Like</button>
          <button type="button" class="icon-btn action-save${saved ? " is-saved" : ""}" aria-label="Save" aria-pressed="${saved ? "true" : "false"}">${iconBookmark()} Save</button>
          <div class="share-wrap">
            <button type="button" class="icon-btn action-share" aria-label="Share" aria-expanded="false">${iconShare()} Share</button>
            ${shareMenuHtml(permalink, headline)}
          </div>
          <div class="more-wrap">
            <button type="button" class="icon-btn action-more" aria-label="More options" aria-expanded="false">${iconMore()}</button>
            <div class="more-menu" hidden role="menu">
              <button type="button" class="more-item" data-action="not-interested" role="menuitem">Not interested</button>
              <button type="button" class="more-item" data-action="fewer-publisher" role="menuitem">Fewer from this publisher</button>
            </div>
          </div>
        </div>
        <a class="action-source" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">Read source</a>
      </div>
    </div>
  </article>`;
}

export function expandCardContent(article) {
  const href = safeHttpUrl(article.originalUrl) || "#";
  return expandedBodyHtml(article, href);
}
