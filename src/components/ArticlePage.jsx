import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';

function ArticlePage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playbackState, setPlaybackState] = useState('idle'); // 'idle', 'playing', 'paused'
  const [highlightRange, setHighlightRange] = useState(null);
  
  // TTS Settings
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [speechRate, setSpeechRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const isPausingRef = useRef(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    }
    
    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      let englishVoices = available.filter(v => v.lang.startsWith('en'));
      
      const preferredNames = ['Google US English', 'Google UK English Female', 'Microsoft Zira', 'Microsoft David', 'Samantha', 'Alex'];
      let curatedVoices = englishVoices.filter(v => preferredNames.some(name => v.name.includes(name)));
      
      if (curatedVoices.length === 0) {
        curatedVoices = englishVoices.slice(0, 2);
      } else {
        curatedVoices = curatedVoices.slice(0, 2);
      }
      
      const displayVoices = curatedVoices.map((v, i) => {
        let cleanName = `Voice ${i + 1}`;
        if (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha') || (v.name.includes('Google') && !v.name.includes('Male'))) {
           cleanName = 'Female';
        } else if (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Alex')) {
           cleanName = 'Male';
        }
        return { voiceURI: v.voiceURI, cleanName };
      });

      setVoices(displayVoices);
      if (displayVoices.length > 0 && !selectedVoiceURI) {
        setSelectedVoiceURI(displayVoices[0].voiceURI);
      }
    };
    
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoiceURI]);

  const startSpeech = (startIndex) => {
    window.speechSynthesis.cancel();
    const textToRead = `${article.headline}. ${article.summary}`;
    const remainingText = textToRead.substring(startIndex);
    const utterance = new SpeechSynthesisUtterance(remainingText);
    
    if (selectedVoiceURI) {
      const available = window.speechSynthesis.getVoices();
      const voice = available.find(v => v.voiceURI === selectedVoiceURI);
      if (voice) utterance.voice = voice;
    }
    utterance.rate = speechRate;
    
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        setHighlightRange({ 
          charIndex: startIndex + event.charIndex, 
          charLength: event.charLength 
        });
      }
    };
    
    utterance.onend = () => {
      if (!isPausingRef.current) {
        setPlaybackState('idle');
        setHighlightRange(null);
      }
    };
    
    utterance.onerror = (e) => {
      if (!isPausingRef.current) {
        setPlaybackState('idle');
        setHighlightRange(null);
      }
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const toggleListen = () => {
    if (!article) return;

    if (playbackState === 'playing') {
      isPausingRef.current = true;
      window.speechSynthesis.cancel(); // Cancel stops immediately
      setPlaybackState('paused');
    } else if (playbackState === 'paused') {
      isPausingRef.current = false;
      startSpeech(highlightRange ? highlightRange.charIndex : 0);
      setPlaybackState('playing');
    } else {
      isPausingRef.current = false;
      startSpeech(0);
      setPlaybackState('playing');
    }
  };

  const renderHighlighted = (text, offset) => {
    if (!highlightRange || playbackState === 'idle') return text;
    
    const { charIndex, charLength } = highlightRange;
    const relativeStart = charIndex - offset;
    const relativeEnd = relativeStart + charLength;
    
    if (relativeEnd <= 0 || relativeStart >= text.length) return text;
    
    const start = Math.max(0, relativeStart);
    const end = Math.min(text.length, relativeEnd);
    
    return (
      <>
        {text.substring(0, start)}
        <mark style={{ backgroundColor: 'var(--accent)', color: '#fff', borderRadius: '3px', padding: '0 2px' }}>
          {text.substring(start, end)}
        </mark>
        {text.substring(end)}
      </>
    );
  };

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

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
        justifyContent: 'space-between',
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
        
        <div ref={settingsRef} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', position: 'relative' }}>
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            aria-label="Speech Settings"
            style={{ background: 'transparent', border: 'none', color: 'var(--ink)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </button>
          
          <button 
            className="btn-listen"
            onClick={toggleListen}
            aria-label={playbackState === 'playing' ? "Pause article" : "Listen to article"}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '100px', border: '1px solid var(--accent)', backgroundColor: playbackState !== 'idle' ? 'var(--accent)' : 'transparent', color: playbackState !== 'idle' ? '#fff' : 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s' }}
          >
            {playbackState === 'playing' ? (
               <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            ) : (
               <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            )}
            {playbackState === 'playing' ? "Pause" : (playbackState === 'paused' ? "Resume" : "Listen")}
          </button>
          
          {showSettings && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.75rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', width: '260px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '1.25rem', zIndex: 110 }}>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Voice</label>
                <div style={{ display: 'flex', gap: '1.25rem' }}>
                  {voices.map((v, i) => (
                    <button 
                      key={v.voiceURI}
                      onClick={() => setSelectedVoiceURI(v.voiceURI)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '0 0 4px 0',
                        color: selectedVoiceURI === v.voiceURI ? 'var(--accent)' : 'var(--ink-muted)',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: selectedVoiceURI === v.voiceURI ? 600 : 400,
                        transition: 'all 0.2s ease',
                        borderBottom: selectedVoiceURI === v.voiceURI ? '2px solid var(--accent)' : '2px solid transparent'
                      }}
                    >
                      {v.cleanName || `Option ${i + 1}`}
                    </button>
                  ))}
                  {voices.length === 0 && <span style={{ fontSize: '0.9rem', color: 'var(--ink-muted)' }}>Default Voice</span>}
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Speed</label>
                <div style={{ display: 'flex', gap: '1.25rem' }}>
                  {[1, 1.25, 1.5, 2].map(speed => (
                    <button 
                      key={speed}
                      onClick={() => {
                        setSpeechRate(speed);
                        if (playbackState === 'playing') {
                           window.speechSynthesis.cancel();
                           startSpeech(highlightRange ? highlightRange.charIndex : 0);
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '0 0 4px 0',
                        color: speechRate === speed ? 'var(--accent)' : 'var(--ink-muted)',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: speechRate === speed ? 600 : 400,
                        transition: 'all 0.2s ease',
                        borderBottom: speechRate === speed ? '2px solid var(--accent)' : '2px solid transparent'
                      }}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
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
          
          <h1 style={{ fontSize: '2.8rem', marginBottom: '1.5rem', lineHeight: 1.1, color: 'var(--ink)', fontWeight: 800, letterSpacing: '-0.03em' }}>
            {renderHighlighted(article.headline, 0)}
          </h1>
          
          <div className="article-summary" style={{ whiteSpace: 'pre-wrap', fontSize: '1.2rem', lineHeight: 1.85, marginBottom: '2.5rem', color: 'var(--ink-subtle)', letterSpacing: '0.01em' }}>
            {renderHighlighted(article.summary, article.headline.length + 2)}
          </div>

          {article.whyItMatters && (
            <div className="why-it-matters" style={{ padding: '2rem 0', margin: '3rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"></path><path d="M12 18v4"></path><path d="M4.93 4.93l2.83 2.83"></path><path d="M16.24 16.24l2.83 2.83"></path><path d="M2 12h4"></path><path d="M18 12h4"></path><path d="M4.93 19.07l2.83-2.83"></path><path d="M16.24 7.76l2.83-2.83"></path></svg>
                <strong style={{ color: 'var(--accent)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Key Takeaway</strong>
              </div>
              <p style={{ margin: 0, color: 'var(--ink)', lineHeight: 1.6, fontSize: '1.25rem', fontWeight: 500 }}>{article.whyItMatters}</p>
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
