import React, { useState, useEffect, useCallback, useRef } from 'react';
import ArticleCard from './ArticleCard';
import SkeletonCard from './SkeletonCard';

const FEED_BASE = "/web-api/v1/feed";
const PAGE_SIZE = 12;

function Feed({ activeCategory, activeLabel, activeMarket }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Bookmarks are saved in localStorage
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem("eyenewz_bookmarks");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const observerTarget = useRef(null);
  const fetchingRef = useRef(false);
  const initialFetchDone = useRef(false);

  const fetchFeed = useCallback(async (reset = false) => {
    if (fetchingRef.current) return;
    
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    if (reset) {
      setNextCursor(null);
      setArticles([]);
    }

    const params = new URLSearchParams({
      pageSize: String(PAGE_SIZE),
    });

    if (activeCategory) params.set("category", activeCategory);
    if (activeMarket === "india" && !activeCategory) {
      params.set("region", "in");
    }
    
    // Use the current nextCursor state, except when resetting
    const cursorToUse = reset ? null : nextCursor;
    if (cursorToUse) params.set("cursor", cursorToUse);

    try {
      // Mock Data Generation since there is no backend
      await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network latency
      
      const mockArticles = Array.from({ length: PAGE_SIZE }).map((_, i) => {
        const id = (reset ? 0 : (Number(nextCursor) || 0)) + i;
        return {
          id: `mock-${id}`,
          publisherName: ["TechCrunch", "The Verge", "Wired", "Ars Technica"][id % 4],
          headline: `This is a sample tech news headline ${id + 1} that shows off the new UI`,
          summary: "This is a placeholder summary. It explains why this news matters and gives you a quick brief before you decide to read the full source. Enjoy the new premium dark mode and UI enhancements!",
          imageUrl: `https://picsum.photos/seed/${id}/720/405`,
          originalUrl: "https://example.com",
          publishedAtEpochMillis: Date.now() - (id * 3600000), // hours ago
          category: activeCategory || "Technology"
        };
      });
      
      const data = {
        articles: mockArticles,
        nextCursor: reset ? PAGE_SIZE : (Number(nextCursor) || 0) + PAGE_SIZE
      };
      
      const newArticles = data.articles;
      
      if (reset) {
        setArticles(newArticles);
      } else {
        // filter out duplicates by id
        setArticles(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          const uniqueNew = newArticles.filter(a => !existingIds.has(a.id));
          return [...prev, ...uniqueNew];
        });
      }
      
      setNextCursor(data.nextCursor || null);
    } catch (err) {
      console.error(err);
      setError("Could not load stories.");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
      initialFetchDone.current = true;
    }
  }, [activeCategory, activeMarket, nextCursor]);

  // Initial fetch when category/market changes
  useEffect(() => {
    initialFetchDone.current = false;
    fetchFeed(true);
  }, [activeCategory, activeMarket]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && nextCursor && !loading) {
          fetchFeed(false);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [observerTarget, nextCursor, loading, fetchFeed]);

  const toggleBookmark = (article) => {
    setBookmarks(prev => {
      const next = { ...prev };
      if (next[article.id]) {
        delete next[article.id];
      } else {
        next[article.id] = article;
      }
      localStorage.setItem("eyenewz_bookmarks", JSON.stringify(next));
      return next;
    });
  };

  const filteredArticles = articles.filter(a => 
    a.headline.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (a.publisherName && a.publisherName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <main className="feed-main" aria-label="Main feed">
      <header className="feed-header">
        <h1 className="feed-title">{activeLabel}</h1>
        <p className="feed-subtitle">Summaries · Original sources · No full-article scrape</p>
      </header>
      
      <div className="search-container">
        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input 
          type="search" 
          className="search-input" 
          placeholder="Search articles..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <p className="search-results-text">Found {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'}</p>
        )}
      </div>

      <div className="feed-list">
        {filteredArticles.map((article) => (
          <ArticleCard 
            key={article.id} 
            article={article} 
            isBookmarked={!!bookmarks[article.id]}
            toggleBookmark={toggleBookmark}
            searchQuery={searchQuery}
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
      
      {/* Invisible target for intersection observer */}
      <div ref={observerTarget} style={{ height: '20px', width: '100%' }}></div>
      
      {nextCursor && !loading && (
        <div className="feed-more-wrap">
           <button type="button" className="btn-load-more" onClick={() => fetchFeed(false)}>Load more</button>
        </div>
      )}
    </main>
  );
}

export default Feed;
