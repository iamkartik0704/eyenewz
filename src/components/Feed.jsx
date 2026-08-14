import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ArticleCard from './ArticleCard';
import SkeletonCard from './SkeletonCard';
import { getFeed, search as searchApi, getArticle, sendEvent, syncPrefs } from '../lib/api';
import {
  getDeviceId,
  getBlockedPublishers,
  getHiddenCategories,
  getSavedIds,
  isLiked,
  isSaved,
  toggleLiked,
  toggleSaved,
  prefsPayload,
} from '../lib/store';
import { MARKET_DEFAULTS } from '../lib/markets';

const PAGE_SIZE = 12;

function personalizationParams() {
  const params = {
    deviceId: getDeviceId(),
    pageSize: PAGE_SIZE,
  };
  const blocked = getBlockedPublishers();
  const hidden = getHiddenCategories();
  if (blocked.length) params.blockedPublisherIds = blocked.join(",");
  if (hidden.length) params.hiddenCategories = hidden.join(",");
  return params;
}

function Feed({ activeCategory, activeLabel, activeMarket, showBookmarks }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [engagement, setEngagement] = useState(0);

  const observerTarget = useRef(null);
  const fetchingRef = useRef(false);
  const cursorRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isSearching = !showBookmarks && debouncedSearchQuery.length >= 2;

  const loadPage = useCallback(async (reset) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    if (reset) {
      cursorRef.current = null;
      setNextCursor(null);
      setArticles([]);
    }

    const params = personalizationParams();
    if (isSearching) {
      params.q = debouncedSearchQuery;
    } else {
      let category = activeCategory;
      if (!category && activeMarket === "global") {
        category = MARKET_DEFAULTS.global.forYouCategory;
      }
      if (category) params.category = category;
      if (activeMarket === "india" && !category) params.region = "in";
    }
    if (!reset && cursorRef.current) params.cursor = cursorRef.current;

    try {
      const data = isSearching ? await searchApi(params) : await getFeed(params);
      const incoming = Array.isArray(data.articles) ? data.articles : [];
      const cursor = data.nextCursor || null;
      cursorRef.current = cursor;
      setNextCursor(cursor);

      setArticles((prev) => {
        const base = reset ? [] : prev;
        const existingIds = new Set(base.map((a) => String(a.id)));
        const uniqueNew = incoming.filter((a) => a?.id && !existingIds.has(String(a.id)));
        return [...base, ...uniqueNew];
      });
    } catch (err) {
      console.error(err);
      setError(isSearching ? "Search failed. Please try again." : "Could not load stories. Please refresh and try again.");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [activeCategory, activeMarket, isSearching, debouncedSearchQuery]);

  const loadSaved = useCallback(async () => {
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    cursorRef.current = null;
    setNextCursor(null);
    setArticles([]);

    const ids = getSavedIds();
    if (!ids.length) {
      setLoading(false);
      fetchingRef.current = false;
      return;
    }

    const loaded = [];
    for (const id of ids) {
      try {
        const article = await getArticle(id);
        if (article?.id) loaded.push(article);
      } catch {
        /* skip missing */
      }
    }
    setArticles(loaded);
    setLoading(false);
    fetchingRef.current = false;
  }, []);

  useEffect(() => {
    fetchingRef.current = false;
    if (showBookmarks) {
      loadSaved();
      return;
    }
    loadPage(true);
  }, [showBookmarks, loadPage, loadSaved]);

  useEffect(() => {
    if (showBookmarks || isSearching) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && cursorRef.current && !fetchingRef.current) {
          loadPage(false);
        }
      },
      { rootMargin: '200px' }
    );

    const el = observerTarget.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [showBookmarks, isSearching, loadPage, nextCursor]);

  const bumpEngagement = () => setEngagement((v) => v + 1);

  const handleToggleBookmark = useCallback((article) => {
    if (!article?.id) return;
    const nowSaved = toggleSaved(article.id);
    if (nowSaved) {
      sendEvent("bookmark", { articleId: article.id, deviceId: getDeviceId() });
    }
    bumpEngagement();
    if (showBookmarks && !nowSaved) {
      setArticles((prev) => prev.filter((a) => String(a.id) !== String(article.id)));
    }
  }, [showBookmarks]);

  const handleToggleLike = useCallback((id) => {
    if (!id) return;
    const nowLiked = toggleLiked(id);
    if (nowLiked) {
      sendEvent("like", { articleId: id, deviceId: getDeviceId() });
    }
    bumpEngagement();
  }, []);

  useEffect(() => {
    getDeviceId();
    syncPrefs(prefsPayload());
  }, []);

  const [activePublisher, setActivePublisher] = useState(null);

  useEffect(() => {
    setActivePublisher(null);
  }, [activeCategory, activeMarket, showBookmarks, debouncedSearchQuery]);

  const publishers = useMemo(() => {
    const pubs = new Set();
    articles.forEach((a) => {
      if (a.publisherName) pubs.add(a.publisherName);
    });
    return Array.from(pubs).sort();
  }, [articles]);

  const filteredArticles = articles.filter((a) =>
    activePublisher ? a.publisherName === activePublisher : true
  );

  void engagement;

  const emptySaved = showBookmarks && !loading && filteredArticles.length === 0 && !debouncedSearchQuery;
  const emptySearch = isSearching && !loading && filteredArticles.length === 0;

  return (
    <main className="feed-main" aria-label="Main feed">
      <header className="feed-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="feed-title">
            {showBookmarks
              ? "Saved Articles"
              : isSearching
                ? `Results for “${debouncedSearchQuery}”`
                : activeLabel}
          </h1>
          <p className="feed-subtitle">Summaries · Original sources · No full-article scrape</p>
        </div>
      </header>

      <div className="search-section">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input
            type="search"
            className="search-input"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearchQuery("");
            }}
          />
        </div>
        {isSearching && (
          <p className="search-results-text">
            {loading ? "Searching…" : `Found ${filteredArticles.length} ${filteredArticles.length === 1 ? 'article' : 'articles'}`}
          </p>
        )}
        {publishers.length > 0 && (
          <div className="publisher-chips" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none', marginTop: '0.75rem' }}>
            {publishers.map((pub) => (
              <button
                key={pub}
                className={`btn-filter-chip ${activePublisher === pub ? 'is-active' : ''}`}
                onClick={() => setActivePublisher((prev) => prev === pub ? null : pub)}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '100px',
                  border: '1px solid var(--border)',
                  background: activePublisher === pub ? 'var(--ink)' : 'var(--surface-alt)',
                  color: activePublisher === pub ? 'var(--surface)' : 'var(--ink)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                {pub}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="feed-status is-error" style={{ color: 'var(--accent)', padding: '0 0 1rem' }}>{error}</p>
      )}

      <div className="feed-list">
        {emptySaved && (
          <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: 0.5, marginBottom: '1rem' }}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            <h2>No saved articles yet</h2>
            <p>Articles you bookmark will appear here.</p>
          </div>
        )}

        {emptySearch && (
          <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: 0.5, marginBottom: '1rem' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <h2>No results found</h2>
            <p>We couldn't find any articles matching “{debouncedSearchQuery}”.</p>
          </div>
        )}

        {filteredArticles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            isBookmarked={isSaved(article.id)}
            toggleBookmark={handleToggleBookmark}
            isLiked={isLiked(article.id)}
            toggleLike={handleToggleLike}
            searchQuery={isSearching ? debouncedSearchQuery : ""}
          />
        ))}

        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}
      </div>

      {!showBookmarks && (
        <>
          <div ref={observerTarget} style={{ height: '20px', width: '100%' }}></div>
          {nextCursor && !loading && (
            <div className="feed-more-wrap">
               <button type="button" className="btn-load-more" onClick={() => loadPage(false)}>Load more</button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default Feed;
