import React from 'react';

function SkeletonCard() {
  return (
    <article className="article-card skeleton-card">
      <div className="article-body">
        <div className="article-publisher skeleton-pulse">
          <span className="pub-avatar skeleton-avatar" aria-hidden="true"></span>
          <div className="pub-meta">
            <div className="skeleton-text skeleton-publisher"></div>
            <div className="skeleton-text skeleton-time"></div>
          </div>
        </div>
        
        <div className="article-media skeleton-pulse skeleton-image"></div>
        
        <div className="article-headline skeleton-pulse">
          <div className="skeleton-text skeleton-title"></div>
          <div className="skeleton-text skeleton-title short"></div>
        </div>
        
        <div className="article-summary skeleton-pulse">
          <div className="skeleton-text skeleton-line"></div>
          <div className="skeleton-text skeleton-line"></div>
          <div className="skeleton-text skeleton-line short"></div>
        </div>
      </div>
    </article>
  );
}

export default SkeletonCard;
