import React from 'react';

function RightRail() {
  return (
    <aside className="right-rail" aria-label="Get the app">
      <div className="rail-card">
        <div className="rail-app-head">
          <img src="/assets/logo.svg" alt="" width="40" height="40" />
          <h2>Get the EyeNewz app</h2>
        </div>
        <p>Tech News &amp; Daily Briefs. Free on Google Play for Android.</p>
        <a
          href="https://play.google.com/store/apps/details?id=com.prod.contentnews"
          className="play-store-link"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Get EyeNewz on Google Play"
        >
          <img src="/assets/google-play-badge.svg" alt="Get it on Google Play" width="160" height="48" />
        </a>
      </div>

      <div className="rail-card">
        <p className="rail-kicker">For companies</p>
        <p>Publisher or brand? Partner with EyeNewz.</p>
        <p className="rail-links">
          <a href="/publishers">Publishers</a>
          {' · '}
          <a href="/advertisers">Advertisers</a>
          {' · '}
          <a href="/company">Company</a>
        </p>
      </div>

      <div className="rail-card">
        <p className="rail-kicker">Why EyeNewz</p>
        <ul className="why-list">
          <li>
            <span className="why-icon" aria-hidden="true">◆</span>
            <span className="why-copy">
              <strong>Daily briefs</strong>
              <span>Skim the point, then move on.</span>
            </span>
          </li>
          <li>
            <span className="why-icon" aria-hidden="true">✓</span>
            <span className="why-copy">
              <strong>Trusted sources</strong>
              <span>Always a path back to the publisher.</span>
            </span>
          </li>
          <li>
            <span className="why-icon" aria-hidden="true">◎</span>
            <span className="why-copy">
              <strong>Built for India</strong>
              <span>India and world news on a mobile-first feed.</span>
            </span>
          </li>
        </ul>
        <p className="rail-links">
          <a href="/about">About</a>
          {' · '}
          <a href="/how-it-works">How it works</a>
        </p>
      </div>
    </aside>
  );
}

export default RightRail;
