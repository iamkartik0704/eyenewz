import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { articleImageSrcset } from '../lib/api';
import {
  clipSummary,
  escapeRegExp,
  publisherInitial,
  relativeTime,
  resolveImage,
  safeHttpUrl,
  storyPermalink,
} from '../lib/article';

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

function getHighlightedText(text, highlight) {
  const q = String(highlight || "").trim();
  if (!q) return text;

  const regex = new RegExp(`(${escapeRegExp(q)})`, "i");
  const parts = String(text).split(regex);
  const needle = q.toLowerCase();

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === needle ? (
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
  const [isGenerating, setIsGenerating] = useState(false);

  const { primary: image, fallbacks } = resolveImage(article);
  const [currentImage, setCurrentImage] = useState(safeHttpUrl(image));
  const [fallbackIndex, setFallbackIndex] = useState(0);

  useEffect(() => {
    setCurrentImage(safeHttpUrl(image));
    setFallbackIndex(0);
  }, [article.id, image]);

  const rawHref = article.originalUrl || "";
  const href = safeHttpUrl(rawHref) || "#";
  const publisher = article.publisherName || "Publisher";
  const headline = article.headline || "Untitled";
  const summary = clipSummary(article);
  const when = relativeTime(article.publishedAtEpochMillis);
  const initial = publisherInitial(publisher);
  const permalink = storyPermalink(article.id);
  const srcsetInfo = article.id ? articleImageSrcset(article.id) : { src: "", srcset: "" };
  const useSrcset =
    currentImage &&
    (currentImage.includes("/image") || currentImage === safeHttpUrl(srcsetInfo.src));

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
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#121212';
      ctx.fillRect(0, 0, 1080, 1080);

      ctx.fillStyle = '#e30613';
      ctx.font = 'bold 46px sans-serif';
      ctx.fillText('EyeNewz', 60, 80);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '32px sans-serif';
      ctx.fillText('Tech News & Daily Briefs', 260, 78);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(publisher, 60, 160);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '30px sans-serif';
      ctx.fillText(when || 'Just now', 60, 210);

      let currentY = 270;

      if (currentImage) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = currentImage;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
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
        if (!blob) {
          setIsGenerating(false);
          return;
        }
        const file = new File([blob], 'eyenewz-share.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: headline,
              text: 'Read more on EyeNewz',
              url: permalink,
            });
          } catch {
            // Share cancelled
          }
        } else if (navigator.share) {
          try {
            await navigator.share({ title: headline, url: permalink });
          } catch { /* cancelled */ }
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(permalink);
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
          <Link className="article-media" to={`/a/${encodeURIComponent(article.id)}`}>
            <img
              src={useSrcset ? srcsetInfo.src || currentImage : currentImage}
              srcSet={useSrcset && srcsetInfo.srcset ? srcsetInfo.srcset : undefined}
              sizes="(max-width: 720px) 100vw, 680px"
              alt=""
              loading="lazy"
              width="720"
              height="405"
              onError={handleImageError}
            />
          </Link>
        )}

        <h2 className="article-headline">
          <Link to={`/a/${encodeURIComponent(article.id)}`}>{getHighlightedText(headline, searchQuery)}</Link>
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
    </article>
  );
}

export default ArticleCard;
