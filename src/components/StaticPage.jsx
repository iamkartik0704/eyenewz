import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

function StaticPage() {
  const location = useLocation();
  // Parse the pathname nicely (e.g. "/how-it-works" -> "How It Works")
  let pageTitle = location.pathname.substring(1)
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  if (!pageTitle || location.pathname === '/') {
    pageTitle = 'Page Not Found';
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <main className="feed-main" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
      <div style={{ maxWidth: '600px', width: '100%' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1.25rem', color: 'var(--ink)', fontWeight: 800, letterSpacing: '-0.03em' }}>{pageTitle}</h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--ink-muted)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
          We are currently working hard to bring you the full EyeNewz experience. This page will be available soon.
        </p>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--accent)', color: '#fff', padding: '0.85rem 1.75rem', borderRadius: '100px', textDecoration: 'none', fontWeight: 600, fontSize: '1.1rem', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(var(--accent-rgb, 255,60,60), 0.3)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Return to Home
        </Link>
      </div>
    </main>
  );
}

export default StaticPage;
