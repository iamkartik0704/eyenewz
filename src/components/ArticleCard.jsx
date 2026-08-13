import React, { useState } from 'react';

function iconThumb() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 22V11M2 13v6a2 2 0 0 0 2 2h12.2a2 2 0 0 0 1.95-1.55l2.1-8A2 2 0 0 0 18.3 9H14V5a3 3 0 0 0-3-3l-4 9H4a2 2 0 0 0-2 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function iconShare() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function iconBookmark(filled) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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

function publisherInitial(name) {
  const cleaned = String(name || "N").trim();
  const letter = cleaned.charAt(0).toUpperCase();
  return /[A-Z0-9]/i.test(letter) ? letter : "N";
}

function getHighlightedText(text, highlight) {
  if (!highlight || !highlight.trim()) {
    return text;
  }
  
  // Split text on highlight term, include term in parts array
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = String(text).split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="search-highlight">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function ArticleCard({ article, isBookmarked, toggleBookmark, isLiked, toggleLike, searchQuery = "" }) {
  const [copied, setCopied] = useState(false);
  
  const { primary: image, fallbacks } = resolveImage(article);
  const [currentImage, setCurrentImage] = useState(safeHttpUrl(image));
  const [fallbackIndex, setFallbackIndex] = useState(0);

  const rawHref = article.originalUrl || "";
  const href = safeHttpUrl(rawHref) || "#";
  const publisher = article.publisherName || "Publisher";
  const headline = article.headline || "Untitled";
  const summary = clipSummary(article);
  const when = relativeTime(article.publishedAtEpochMillis);
  const initial = publisherInitial(publisher);

  const safeFallbacks = fallbacks.map(safeHttpUrl).filter(Boolean);

  const handleImageError = () => {
    if (fallbackIndex < safeFallbacks.length) {
      setCurrentImage(safeFallbacks[fallbackIndex]);
      setFallbackIndex(fallbackIndex + 1);
    } else {
      setCurrentImage(null);
    }
  };

  const handleShare = async () => {
    const url = href;
    const title = headline;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch {
      // user cancelled share
    }
  };

  return (
    <article className="article-card article-fade-in" data-id={article.id || ""}>
      <div className="article-body">
        <div className="article-publisher">
          <span className="pub-avatar" aria-hidden="true">{initial}</span>
          <div className="pub-meta">
            <strong>{publisher}</strong>
            <span>{when ? when : "Just now"}{article.category ? ` · ${article.category}` : ""}</span>
          </div>
        </div>
        
        {currentImage && (
          <a className="article-media" href={href} target="_blank" rel="noopener noreferrer">
            <img 
              src={currentImage} 
              alt="" 
              loading="lazy" 
              width="720" 
              height="405" 
              onError={handleImageError} 
            />
          </a>
        )}
        
        <h2 className="article-headline">
          <a href={href} target="_blank" rel="noopener noreferrer">{getHighlightedText(headline, searchQuery)}</a>
        </h2>
        <p className="article-summary">{summary}</p>
        
        <div className="article-footer">
          <div className="article-actions">
            <button 
              type="button" 
              className={`icon-btn action-like ${isLiked ? 'is-liked' : ''}`} 
              aria-label="Like" 
              aria-pressed={isLiked}
              onClick={() => toggleLike(article.id)}
            >
              {iconThumb()} {isLiked ? 'Liked' : 'Like'}
            </button>
            
            <button 
              type="button" 
              className="icon-btn action-share" 
              aria-label="Share"
              onClick={handleShare}
            >
              {iconShare()} {copied ? "Copied" : "Share"}
            </button>

            <button 
              type="button" 
              className={`icon-btn action-bookmark ${isBookmarked ? 'is-bookmarked' : ''}`} 
              aria-label="Bookmark"
              onClick={() => toggleBookmark(article)}
              style={{ color: isBookmarked ? 'var(--accent-primary)' : 'inherit' }}
            >
              {iconBookmark(isBookmarked)} Save
            </button>
          </div>
          <a className="action-source" href={href} target="_blank" rel="noopener noreferrer">Read source</a>
        </div>
      </div>
    </article>
  );
}

export default ArticleCard;
