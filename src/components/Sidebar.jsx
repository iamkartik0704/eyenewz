import React from 'react';
import { MARKET_DEFAULTS } from '../App';

function Sidebar({ activeMarket, activeCategory, showBookmarks, onMarketChange, onNavClick, onSavedClick, onOpenSignIn, onOpenWaitlist, theme, toggleTheme }) {
  const navItems = [
    { feed: "for-you", category: MARKET_DEFAULTS[activeMarket].forYouCategory, label: "For You", isForYou: true },
    { feed: "india", category: "DistrictNews", label: "India" },
    { feed: "world", category: "WorldNews", label: "World" },
    { feed: "tech", category: "Technology,DeveloperTools,Science,Space", label: "Tech & Science" },
    { feed: "sports", category: "Sports", label: "Sports" },
    { feed: "entertainment", category: "Entertainment,Bollywood", label: "Entertainment" },
    { feed: "education", category: "Education", label: "Education" },
  ];

  return (
    <aside className="left-nav" id="left-nav" aria-label="Main navigation">
      <div className="left-nav-inner">
        <a href="/" className="brand" aria-label="EyeNewz home">
          <span className="brand-row">
            <img src="/assets/logo.svg" alt="" className="brand-icon" width="36" height="36" />
            <span className="brand-name">EyeNewz</span>
          </span>
          <span className="brand-tag">Tech News &amp; Daily Briefs</span>
        </a>

        <div className="guest-row" style={{ paddingBottom: 0 }}>
          <span className="guest-avatar" aria-hidden="true">G</span>
          <div className="guest-meta">
            <strong>Guest</strong>
            <span>Browse without an account</span>
          </div>
        </div>

        <button 
          type="button" 
          className="nav-link" 
          onClick={toggleTheme} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}
        >
          {theme === 'light' ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              Dark Mode
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              Light Mode
            </>
          )}
        </button>

        <nav className="nav-section" aria-label="Feed">
          <div className="market-switch" role="group" aria-label="Market">
            <button 
              type="button" 
              className={`market-btn ${activeMarket === 'global' ? 'is-active' : ''}`} 
              onClick={() => onMarketChange('global')}
            >
              Global
            </button>
            <button 
              type="button" 
              className={`market-btn ${activeMarket === 'india' ? 'is-active' : ''}`} 
              onClick={() => onMarketChange('india')}
            >
              India
            </button>
            <button type="button" className="market-btn market-soon" onClick={onOpenWaitlist} title="Join Waitlist" style={{ textAlign: 'left', cursor: 'pointer' }}>
              UK (Coming soon)
            </button>
          </div>
          
          {navItems.map((item) => (
            <button
              key={item.feed}
              type="button"
              className={`nav-link ${!showBookmarks && activeCategory === item.category ? 'is-active' : ''}`}
              onClick={() => onNavClick(item.category, item.label, item.isForYou)}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            className={`nav-link ${showBookmarks ? 'is-active' : ''}`}
            onClick={onSavedClick}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={showBookmarks ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
              Saved
            </span>
          </button>
        </nav>

        <button type="button" className="btn-signin" onClick={onOpenSignIn}>Sign in</button>

        <nav className="nav-section nav-about" aria-label="About EyeNewz">
          <p className="nav-heading">About EyeNewz</p>
          <a href="/company">Company</a>
          <a href="/publishers">Publishers</a>
          <a href="/advertisers">Advertisers</a>
          <a href="/press">Press</a>
          <a href="/about">About</a>
          <a href="/how-it-works">How it works</a>
          <a href="/download">Download</a>
          <a href="/contact-us">Contact</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;
