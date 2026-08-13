import React, { useState, useEffect } from 'react';

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
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isExpanded]);
  
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

  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = '#121212';
      ctx.fillRect(0, 0, 1080, 1080);

      // Branding
      ctx.fillStyle = '#e30613';
      ctx.font = 'bold 46px sans-serif';
      ctx.fillText('EyeNewz', 60, 80);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '32px sans-serif';
      ctx.fillText('Tech News & Daily Briefs', 260, 78);

      // Publisher info
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(publisher, 60, 160);
      
      ctx.fillStyle = '#9ca3af';
      ctx.font = '30px sans-serif';
      ctx.fillText(when || 'Just now', 60, 210);

      let currentY = 270;

      // Draw image
      if (currentImage) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = currentImage;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          // Cover center crop simulation
          const scale = Math.max(960 / img.width, 500 / img.height);
          const drawWidth = img.width * scale;
          const drawHeight = img.height * scale;
          const offsetX = 60 + (960 - drawWidth) / 2;
          const offsetY = currentY + (500 - drawHeight) / 2;
          
          ctx.save();
          ctx.beginPath();
          ctx.rect(60, currentY, 960, 500);
          ctx.clip();
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          ctx.restore();
          
          currentY += 560;
        } catch (e) {
          console.warn('Failed to load image for canvas share', e);
        }
      }

      // Headline
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px sans-serif';
      const words = headline.split(' ');
      let line = '';
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 960 && n > 0) {
          ctx.fillText(line, 60, currentY);
          line = words[n] + ' ';
          currentY += 70;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 60, currentY);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'eyenewz-share.png', { type: 'image/png' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: headline,
              text: 'Read more on EyeNewz',
              url: `${window.location.origin}/article/${article.id}`
            });
          } catch {
            // Share cancelled
          }
        } else {
          // Fallback to native share without file, or clipboard
          const url = `${window.location.origin}/article/${article.id}`;
          if (navigator.share) {
            try {
              await navigator.share({ title: headline, url });
            } catch { /* cancelled */ }
          } else if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          } else {
            const urlObj = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = urlObj;
            a.download = 'eyenewz-share.png';
            a.click();
            URL.revokeObjectURL(urlObj);
          }
        }
        setIsGenerating(false);
      }, 'image/png');

    } catch (err) {
      console.error("Error generating image:", err);
      setIsGenerating(false);
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
          <a className="article-media" href="#" onClick={(e) => { e.preventDefault(); setIsExpanded(true); }}>
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
          <a href="#" onClick={(e) => { e.preventDefault(); setIsExpanded(true); }}>{getHighlightedText(headline, searchQuery)}</a>
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
              className={`icon-btn action-share ${isGenerating ? 'is-generating' : ''}`}
              aria-label="Share"
              onClick={handleShare}
              disabled={isGenerating}
            >
              {iconShare()} {isGenerating ? "Wait..." : (copied ? "Copied" : "Share")}
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
      {/* Expanded Modal */}
      {isExpanded && (
        <div className="modal" id={`article-modal-${article.id}`}>
          <div className="modal-backdrop" onClick={() => setIsExpanded(false)}></div>
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby={`article-title-${article.id}`} style={{ maxWidth: '640px', width: '92%', padding: 0, overflow: 'hidden' }}>
            
            {currentImage && (
              <div style={{ width: '100%', height: '260px', position: 'relative', backgroundColor: 'var(--border)' }}>
                <img src={currentImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 80px)' }}></div>
              </div>
            )}
            
            <button 
              type="button" 
              className="modal-close" 
              onClick={() => setIsExpanded(false)} 
              aria-label="Close"
              style={currentImage ? { color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)', top: '10px', right: '12px' } : { top: '10px', right: '12px' }}
            >&times;</button>
            
            <div style={{ padding: '1.5rem 1.75rem 2rem' }}>
              <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <span className="pub-avatar" aria-hidden="true" style={{ width: '38px', height: '38px', fontSize: '0.95rem' }}>{initial}</span>
                <div className="pub-meta">
                  <strong style={{ fontSize: '1.05rem', color: 'var(--ink)' }}>{publisher}</strong>
                  <span className="time" style={{ fontSize: '0.9rem', color: 'var(--ink-muted)', marginTop: '2px', display: 'block' }}>
                    {when ? when : "Just now"}
                    {article.category ? ` · ${article.category.split(',').slice(0, 2).map(c => c.trim()).join(', ')}` : ""}
                  </span>
                </div>
              </div>
              
              <h2 id={`article-title-${article.id}`} style={{ fontSize: '1.8rem', marginBottom: '1.25rem', lineHeight: 1.25, color: 'var(--ink)', fontWeight: 800, letterSpacing: '-0.02em' }}>
                {headline}
              </h2>
              
              <div className="article-summary" style={{ whiteSpace: 'pre-wrap', fontSize: '1.15rem', lineHeight: 1.65, marginBottom: '2rem', color: 'var(--ink)' }}>
                {article.summary}
              </div>

              {article.whyItMatters && (
                <div className="why-it-matters" style={{ backgroundColor: 'var(--surface-hover)', padding: '1.25rem 1.5rem', borderRadius: '12px', marginBottom: '2rem', borderLeft: '4px solid var(--accent)' }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--accent)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Why it matters</strong>
                  <p style={{ margin: 0, color: 'var(--ink-subtle)', lineHeight: 1.55, fontSize: '1.05rem' }}>{article.whyItMatters}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <button className="btn-secondary" onClick={() => setIsExpanded(false)} style={{ padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontWeight: 600, color: 'var(--ink)' }}>Close</button>
                <a href={href} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', padding: '0.75rem 1.25rem', backgroundColor: 'var(--accent)', color: '#fff', borderRadius: '8px', fontWeight: 600 }}>
                  Read Source
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '0.5rem' }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

export default ArticleCard;
