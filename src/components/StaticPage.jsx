import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../css/legal.css';

const routeToHtml = {
  '/company': 'company',
  '/publishers': 'publishers',
  '/advertisers': 'advertisers',
  '/press': 'press',
  '/about': 'about',
  '/how-it-works': 'how-it-works',
  '/download': 'download',
  '/contact-us': 'contact',
  '/privacy': 'privacy',
  '/terms': 'terms'
};

function StaticPage() {
  const location = useLocation();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  let pageTitle = location.pathname.substring(1)
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  if (!pageTitle || location.pathname === '/') {
    pageTitle = 'Page Not Found';
  }

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fileKey = routeToHtml[location.pathname];
    if (fileKey) {
      setLoading(true);
      fetch(`/legal/${fileKey}.html`)
        .then(res => {
          if (!res.ok) throw new Error('Not found');
          return res.text();
        })
        .then(htmlStr => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlStr, 'text/html');
          const mainContent = doc.querySelector('.legal-main');
          if (mainContent) {
            setContent(mainContent.innerHTML);
          } else {
            setContent(null);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setContent(null);
          setLoading(false);
        });
    } else {
      setContent(null);
      setLoading(false);
    }
  }, [location.pathname]);

  if (loading) {
    return (
      <main className="feed-main" style={{ display: 'flex', justifyContent: 'center', padding: '4rem 2rem' }}>
        <div style={{ color: 'var(--ink-muted)' }}>Loading...</div>
      </main>
    );
  }

  if (content) {
    return (
      <main className="feed-main">
        <div 
          className="legal-main" 
          dangerouslySetInnerHTML={{ __html: content }} 
          onClick={(e) => {
            // Hijack relative links inside the HTML to use React Router if necessary
            // Or just let them trigger a full page reload if they click internal links.
          }}
        />
      </main>
    );
  }

  return (
    <main className="feed-main" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
      <div style={{ maxWidth: '600px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--ink)', fontWeight: 700, letterSpacing: '-0.01em' }}>{pageTitle}</h1>
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
