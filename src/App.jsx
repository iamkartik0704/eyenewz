import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Feed from './components/Feed';
import RightRail from './components/RightRail';
import SignInModal from './components/SignInModal';
import BackToTop from './components/BackToTop';

export const MARKET_DEFAULTS = {
  global: {
    forYouCategory: "WorldNews,Technology,DeveloperTools,Science,Space",
    forYouLabel: "For You · Global",
  },
  india: {
    forYouCategory: "",
    forYouLabel: "For You · India",
  },
};

function App() {
  const [activeMarket, setActiveMarket] = useState(() => localStorage.getItem("eyenewz_market") || "global");
  const [activeCategory, setActiveCategory] = useState(MARKET_DEFAULTS[activeMarket].forYouCategory);
  const [activeLabel, setActiveLabel] = useState(MARKET_DEFAULTS[activeMarket].forYouLabel);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isRightNavOpen, setIsRightNavOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("eyenewz_theme") || "light");

  useEffect(() => {
    document.body.classList.toggle('nav-open', isNavOpen);
  }, [isNavOpen]);

  useEffect(() => {
    document.body.classList.toggle('right-nav-open', isRightNavOpen);
  }, [isRightNavOpen]);

  useEffect(() => {
    document.body.classList.toggle('modal-open', isModalOpen);
  }, [isModalOpen]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem("eyenewz_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleNavClick = (category, label, isForYou) => {
    setActiveCategory(category);
    setActiveLabel(isForYou ? MARKET_DEFAULTS[activeMarket].forYouLabel : label);
    setIsNavOpen(false);
  };

  const handleMarketChange = (market) => {
    setActiveMarket(market);
    localStorage.setItem("eyenewz_market", market);
    setActiveCategory(MARKET_DEFAULTS[market].forYouCategory);
    setActiveLabel(MARKET_DEFAULTS[market].forYouLabel);
  };

  return (
    <>
      <header className="mobile-topbar" id="mobile-topbar">
        <button 
          type="button" 
          className="nav-toggle" 
          id="nav-toggle" 
          aria-expanded={isNavOpen} 
          onClick={() => setIsNavOpen(!isNavOpen)}
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
          onClick={() => setIsRightNavOpen(!isRightNavOpen)}
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
          onMarketChange={handleMarketChange}
          onNavClick={handleNavClick}
          onOpenSignIn={() => setIsModalOpen(true)}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        
        <Feed 
          activeCategory={activeCategory} 
          activeLabel={activeLabel} 
          activeMarket={activeMarket}
        />
        
        <RightRail />
      </div>

      <SignInModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <BackToTop />
    </>
  );
}

export default App;
