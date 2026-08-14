import React, { useState } from 'react';
import { joinWaitlist } from '../lib/api';

function WaitlistModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || sending) return;
    setSending(true);
    setError('');
    try {
      await joinWaitlist(email, "uk");
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setEmail('');
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || "Could not join the waitlist.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal" id="waitlist-modal">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="waitlist-title">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">&times;</button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" style={{ marginBottom: '1rem' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <h2 style={{ marginBottom: '0.5rem' }}>You're on the list!</h2>
            <p className="modal-note">We'll let you know when we launch in new markets.</p>
          </div>
        ) : (
          <>
            <h2 id="waitlist-title" style={{ marginBottom: '0.5rem' }}>Coming Soon</h2>
            <p className="modal-note" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              We're expanding to the UK and other markets soon. Join the waitlist to get early access.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--ink)', fontSize: '1rem' }}
              />
              {error && <p className="modal-note" style={{ color: 'var(--accent)', textAlign: 'left' }}>{error}</p>}
              <button type="submit" className="btn-primary" disabled={sending} style={{ padding: '0.75rem', borderRadius: '4px', background: 'var(--accent)', color: '#fff', fontSize: '1rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                {sending ? "Joining…" : "Join Waitlist"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default WaitlistModal;
