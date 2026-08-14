/** Local preference store for the EyeNewz web reader (device-scoped, no login). */

const KEYS = {
  deviceId: "eyenewz_device_id",
  market: "eyenewz_market",
  liked: "eyenewz_liked",
  saved: "eyenewz_saved",
  notInterested: "eyenewz_not_interested",
  blockedPublishers: "eyenewz_blocked_publishers",
  hiddenCategories: "eyenewz_hidden_categories",
  favoriteTopics: "eyenewz_favorite_topics",
};

function readSet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

function writeSet(key, set) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceId() {
  let id = localStorage.getItem(KEYS.deviceId);
  if (!id) {
    id = uuid();
    localStorage.setItem(KEYS.deviceId, id);
  }
  return id;
}

export function getMarket() {
  return localStorage.getItem(KEYS.market) || "india";
}

export function setMarket(market) {
  const value = market === "india" ? "india" : "global";
  localStorage.setItem(KEYS.market, value);
  return value;
}

export function isLiked(id) {
  return readSet(KEYS.liked).has(String(id));
}

export function toggleLiked(id) {
  const set = readSet(KEYS.liked);
  const key = String(id);
  if (set.has(key)) set.delete(key);
  else set.add(key);
  writeSet(KEYS.liked, set);
  return set.has(key);
}

export function isSaved(id) {
  return readSet(KEYS.saved).has(String(id));
}

export function toggleSaved(id) {
  const set = readSet(KEYS.saved);
  const key = String(id);
  if (set.has(key)) set.delete(key);
  else set.add(key);
  writeSet(KEYS.saved, set);
  return set.has(key);
}

export function getSavedIds() {
  return [...readSet(KEYS.saved)];
}

export function markNotInterested(id) {
  const set = readSet(KEYS.notInterested);
  set.add(String(id));
  writeSet(KEYS.notInterested, set);
}

export function isNotInterested(id) {
  return readSet(KEYS.notInterested).has(String(id));
}

export function undoNotInterested(id) {
  const set = readSet(KEYS.notInterested);
  set.delete(String(id));
  writeSet(KEYS.notInterested, set);
}

export function blockPublisher(publisherId) {
  if (!publisherId) return;
  const set = readSet(KEYS.blockedPublishers);
  set.add(String(publisherId));
  writeSet(KEYS.blockedPublishers, set);
}

export function getBlockedPublishers() {
  return [...readSet(KEYS.blockedPublishers)];
}

export function hideCategory(category) {
  if (!category) return;
  const set = readSet(KEYS.hiddenCategories);
  set.add(String(category));
  writeSet(KEYS.hiddenCategories, set);
}

export function getHiddenCategories() {
  return [...readSet(KEYS.hiddenCategories)];
}

export function boostTopic(category) {
  if (!category) return;
  const set = readSet(KEYS.favoriteTopics);
  set.add(String(category));
  writeSet(KEYS.favoriteTopics, set);
}

export function getFavoriteTopics() {
  return [...readSet(KEYS.favoriteTopics)];
}

export function prefsPayload() {
  return {
    deviceId: getDeviceId(),
    favoriteTopics: getFavoriteTopics(),
    hiddenCategories: getHiddenCategories(),
    blockedPublisherIds: getBlockedPublishers(),
    language: "en",
    region: getMarket() === "india" ? "in" : "global",
  };
}
