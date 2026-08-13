/** EyeNewz Tech — same /web-api proxy as the main site. */

const API_BASE = "/web-api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function getTechHome() {
  return request("/v1/tech/home");
}

export function getTechFeed(section, limit = 24) {
  const qs = new URLSearchParams({ section, limit: String(limit) });
  return request(`/v1/tech/feed?${qs}`);
}

export function getTechModels() {
  return request("/v1/tech/models");
}

export function joinWaitlist(email, platform = "ios") {
  return request("/v1/tech/waitlist", {
    method: "POST",
    body: JSON.stringify({ email, platform }),
  });
}

export function articleImageSrc(article) {
  if (article?.imageUrl) return article.imageUrl;
  if (article?.id) {
    return `${API_BASE}/v1/articles/${encodeURIComponent(article.id)}/image?w=720&fmt=webp`;
  }
  return "";
}
