/** EyeNewz web API client — all traffic goes through /web-api (nginx injects the key). */

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

export function getFeed(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v) !== "") qs.set(k, String(v));
  });
  return request(`/v1/feed?${qs}`);
}

export function search(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v) !== "") qs.set(k, String(v));
  });
  return request(`/v1/search?${qs}`);
}

export function getArticle(id) {
  return request(`/api/v1/articles/${encodeURIComponent(id)}`);
}

export function sendEvent(type, { articleId = "", deviceId = "anonymous", metadata = {} } = {}) {
  return request(`/api/v1/events/${type}`, {
    method: "POST",
    body: JSON.stringify({ articleId, deviceId, metadata }),
  }).catch(() => null);
}

export function syncPrefs(payload) {
  return request(`/v1/sync`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).catch(() => null);
}

export function publisherLogoUrl(homeUrl) {
  try {
    const host = new URL(homeUrl).hostname.replace(/^www\./, "");
    if (!host) return "";
    return `${API_BASE}/v1/publishers/logo?domain=${encodeURIComponent(host)}`;
  } catch {
    return "";
  }
}

export function articleImageSrcset(articleId) {
  if (!articleId) return { src: "", srcset: "" };
  const base = `${API_BASE}/v1/articles/${encodeURIComponent(articleId)}/image`;
  return {
    src: `${base}?w=720&fmt=webp`,
    srcset: `${base}?w=480&fmt=webp 480w, ${base}?w=720&fmt=webp 720w, ${base}?w=1080&fmt=webp 1080w`,
  };
}

export function joinWaitlist(email, platform = "uk") {
  return request("/v1/tech/waitlist", {
    method: "POST",
    body: JSON.stringify({ email, platform }),
  });
}
