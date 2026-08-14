import React, { useState, useEffect } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Feed from './components/Feed';
import RightRail from './components/RightRail';
import SignInModal from './components/SignInModal';
import WaitlistModal from './components/WaitlistModal';
import BackToTop from './components/BackToTop';
import ArticlePage from './components/ArticlePage';
import StaticPage from './components/StaticPage';
import { MARKET_DEFAULTS } from './lib/markets';

function App() {
  const [activeMarket, setActiveMarket] = useState(() => {
    const savedMarket = localStorage.getItem("eyenewz_market");
    return MARKET_DEFAULTS[savedMarket] ? savedMarket : "global";
  });
  
  const getSavedNav = (market) => {
    try {
      const saved = localStorage.getItem(`eyenewz_last_category_${market}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    const defaults = MARKET_DEFAULTS[market] || MARKET_DEFAULTS["global"];
    return { 
      category: defaults.forYouCategory, 
      label: defaults.forYouLabel 
    };
  };

  const initialNav = getSavedNav(activeMarket);
  const [activeCategory, setActiveCategory] = useState(initialNav.category);
  const [activeLabel, setActiveLabel] = useState(initialNav.label);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isRightNavOpen, setIsRightNavOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("eyenewz_theme") || "light");

  useEffect(() => {
    document.body.classList.toggle('nav-open', isNavOpen);
  }, [isNavOpen]);

  useEffect(() => {
    document.body.classList.toggle('right-nav-open', isRightNavOpen);
  }, [isRightNavOpen]);

  useEffect(() => {
    document.body.classList.toggle('modal-open', isModalOpen || isWaitlistOpen);
  }, [isModalOpen, isWaitlistOpen]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem("eyenewz_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(
      `eyenewz_last_category_${activeMarket}`, 
      JSON.stringify({ category: activeCategory, label: activeLabel })
    );
  }, [activeCategory, activeLabel, activeMarket]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleNavClick = (category, label, isForYou) => {
    setShowBookmarks(false);
    setActiveCategory(category);
    setActiveLabel(isForYou ? MARKET_DEFAULTS[activeMarket].forYouLabel : label);
    setIsNavOpen(false);
  };

  const handleSavedClick = () => {
    setShowBookmarks(true);
    setActiveLabel("Saved Articles");
    setIsNavOpen(false);
  };

  const handleMarketChange = (market) => {
    setActiveMarket(market);
    localStorage.setItem("eyenewz_market", market);
    const nav = getSavedNav(market);
    setActiveCategory(nav.category);
    setActiveLabel(nav.label);
    setShowBookmarks(false);
  };

  return (
    <Routes>
      <Route path="/a/:id" element={<ArticlePage />} />
      <Route path="/article/:id" element={<ArticlePage />} />
      <Route element={
        <>
          <header className="mobile-topbar" id="mobile-topbar">
        <button 
          type="button" 
          className="nav-toggle" 
          id="nav-toggle" 
          aria-expanded={isNavOpen} 
          onClick={() => {
            const nextState = !isNavOpen;
            setIsNavOpen(nextState);
            if (nextState) setIsRightNavOpen(false);
          }}
        >
          <span className="nav-toggle-bars" aria-hidden="true"></span>
          <span className="visually-hidden">Menu</span>
        </button>
        <a href="/" className="mobile-brand" aria-label="EyeNewz home">
          <img src="/assets/logo.svg" alt="" width="28" height="28" />
          <span>EyeNewz</span>
        </a>
        <button 
          type="button" 
          className="right-nav-toggle" 
          aria-expanded={isRightNavOpen} 
          onClick={() => {
            const nextState = !isRightNavOpen;
            setIsRightNavOpen(nextState);
            if (nextState) setIsNavOpen(false);
          }}
          aria-label="Info"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
        </button>
      </header>
      
      <div 
        className="nav-backdrop" 
        id="nav-backdrop" 
        hidden={!isNavOpen && !isRightNavOpen} 
        onClick={() => { setIsNavOpen(false); setIsRightNavOpen(false); }}
      ></div>

      <div className="app-shell">
        <Sidebar 
          activeMarket={activeMarket}
          activeCategory={activeCategory}
          showBookmarks={showBookmarks}
          onMarketChange={handleMarketChange}
          onNavClick={handleNavClick}
          onSavedClick={handleSavedClick}
          onOpenSignIn={() => setIsModalOpen(true)}
          onOpenWaitlist={() => setIsWaitlistOpen(true)}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        
        <Outlet />
        
        <RightRail />
      </div>

          <SignInModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
          <WaitlistModal isOpen={isWaitlistOpen} onClose={() => setIsWaitlistOpen(false)} />
          <BackToTop />
        </>
      }>
        <Route path="/" element={
          <Feed 
            activeCategory={activeCategory} 
            activeLabel={activeLabel} 
            activeMarket={activeMarket}
            showBookmarks={showBookmarks}
          />
        } />
        <Route path="*" element={<StaticPage />} />
      </Route>
    </Routes>
  );
}

export default App;
