import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

function ArticlePage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);

    // Simulate fetch by parsing the ID or generating a mock
    setLoading(true);
    setTimeout(() => {
      // In a real app, this would be an API call: fetch(`/api/articles/${id}`)
      let numId = 0;
      if (id && id.startsWith('mock-')) {
        numId = parseInt(id.replace('mock-', ''), 10) || 0;
      }
      
      setArticle({
        id: id || 'mock-0',
        publisherName: ["TechCrunch", "The Verge", "Wired", "Ars Technica"][numId % 4],
        headline: `This is a sample tech news headline ${numId + 1} that shows off the new UI`,
        summary: "This is a placeholder summary. It explains why this news matters and gives you a quick brief before you decide to read the full source. Enjoy the new premium dark mode and UI enhancements!\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        whyItMatters: "This development is crucial because it sets a new standard for user interfaces in news reading applications. It combines aesthetics with high performance.",
        imageUrl: `https://picsum.photos/seed/${numId}/1280/720`,
        originalUrl: "https://example.com",
        publishedAtEpochMillis: Date.now() - (numId * 3600000),
        category: "WorldNews,Technology,DeveloperTools,Science,Space"
      });
      setLoading(false);
    }, 400);
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: 'var(--ink)' }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 500 }}>Loading article...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: 'var(--ink)' }}>
        <p>Article not found</p>
        <Link to="/" style={{ color: 'var(--accent)', textDecoration: 'none', marginTop: '1rem' }}>Return Home</Link>
      </div>
    );
  }

  const publisher = article.publisherName || "News Source";
  const initial = publisher.charAt(0).toUpperCase();
  const currentImage = article.imageUrl || null;
  const href = article.originalUrl || "#";

  // Format the relative time
  let when = "Just now";
  if (article.publishedAtEpochMillis) {
    const diffMins = Math.floor((Date.now() - article.publishedAtEpochMillis) / 60000);
    if (diffMins < 60) when = `${diffMins}m`;
    else if (diffMins < 1440) when = `${Math.floor(diffMins / 60)}h`;
    else when = `${Math.floor(diffMins / 1440)}d`;
  }

  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Top Navbar */}
      <header style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 100, 
        backgroundColor: 'rgba(var(--bg-rgb, 10, 12, 16), 0.85)', 
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1rem'
      }}>
        <Link to="/" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          color: 'var(--ink)', 
          textDecoration: 'none',
          fontWeight: 600
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Home
        </Link>
      </header>

      {/* Article Content */}
      <article style={{ maxWidth: '768px', margin: '0 auto', backgroundColor: 'var(--surface)' }}>
        {currentImage && (
          <div style={{ width: '100%', height: '400px', position: 'relative', backgroundColor: 'var(--border)' }}>
            <img src={currentImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 120px)' }}></div>
          </div>
        )}
        
        <div style={{ padding: currentImage ? '2.5rem 2rem 4rem' : '4rem 2rem 4rem' }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="pub-avatar" aria-hidden="true" style={{ width: '44px', height: '44px', fontSize: '1.1rem' }}>{initial}</span>
            <div className="pub-meta">
              <strong style={{ fontSize: '1.15rem', color: 'var(--ink)' }}>{publisher}</strong>
              <span className="time" style={{ fontSize: '1rem', color: 'var(--ink-muted)', marginTop: '2px', display: 'block' }}>
                {when}
                {article.category ? ` · ${article.category.split(',').slice(0, 2).map(c => c.trim()).join(', ')}` : ""}
              </span>
            </div>
          </div>
          
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', lineHeight: 1.2, color: 'var(--ink)', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {article.headline}
          </h1>
          
          <div className="article-summary" style={{ whiteSpace: 'pre-wrap', fontSize: '1.25rem', lineHeight: 1.7, marginBottom: '2.5rem', color: 'var(--ink)' }}>
            {article.summary}
          </div>

          {article.whyItMatters && (
            <div className="why-it-matters" style={{ backgroundColor: 'var(--surface-hover)', padding: '1.5rem 1.75rem', borderRadius: '12px', marginBottom: '3rem', borderLeft: '4px solid var(--accent)' }}>
              <strong style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--accent)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Why it matters</strong>
              <p style={{ margin: 0, color: 'var(--ink-subtle)', lineHeight: 1.6, fontSize: '1.15rem' }}>{article.whyItMatters}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-start', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
            <a href={href} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', padding: '0.85rem 1.5rem', backgroundColor: 'var(--accent)', color: '#fff', borderRadius: '8px', fontWeight: 600, fontSize: '1.1rem' }}>
              Read Full Article on {publisher}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '0.5rem' }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}

export default ArticlePage;
