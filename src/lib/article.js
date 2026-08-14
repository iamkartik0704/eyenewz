/** Shared article helpers for the EyeNewz web feed. */

import { articleImageSrcset, publisherLogoUrl } from "./api.js";

export const SITE_ORIGIN = "https://eyenewz.com";

export function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function safeHttpUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (raw.startsWith("/web-api/") || raw.startsWith("/assets/")) return raw;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.href;
  } catch {
    return "";
  }
}

export function resolvePublisherLogo(article) {
  const fromHome = article?.publisherHomeUrl
    ? publisherLogoUrl(article.publisherHomeUrl)
    : "";
  if (fromHome) return fromHome;
  const raw = String(article?.publisherLogoUrl || "").trim();
  if (raw.startsWith("/web-api/")) return raw;
  if (raw.startsWith("/v1/publishers/logo")) return `/web-api${raw}`;
  return safeHttpUrl(raw);
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
  if (raw.startsWith("/web-api/") && raw.includes("/image")) return true;
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

  if (article?.id) {
    const { src } = articleImageSrcset(article.id);
    push(src);
  }
  push(article?.imageUrl);
  push(article?.posterUrl);
  push(article?.thumbnailUrl);

  const ytId =
    youtubeIdFromUrl(article?.originalUrl) ||
    youtubeIdFromUrl(article?.thumbnailUrl) ||
    youtubeIdFromUrl(article?.posterUrl) ||
    youtubeIdFromUrl(article?.videoUrl);
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

export function clipSummary(article) {
  const raw =
    (article.summary || "").trim() ||
    (article.whyItMatters || "").trim() ||
    "";
  if (!raw) return "Open the source for the full story.";
  const words = raw.split(/\s+/).filter(Boolean);
  if (words.length <= 80) return raw;
  return `${words.slice(0, 80).join(" ")}…`;
}

export function publisherInitial(name) {
  const cleaned = String(name || "N").trim();
  const letter = cleaned.charAt(0).toUpperCase();
  return /[A-Z0-9]/i.test(letter) ? letter : "N";
}
