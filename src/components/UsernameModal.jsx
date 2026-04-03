import { useState, useRef } from 'react';

export default function UsernameModal({ onJoin }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError('Please enter a username to continue.');
      inputRef.current?.focus();
      return;
    }
    if (trimmed.length > 24) {
      setError('Username must be 24 characters or less.');
      return;
    }
    onJoin(trimmed);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Join editor">
      <div className="modal">
        {/* Logo / Branding */}
        <div className="modal-logo">
          <div className="modal-icon">✏️</div>
          <h1 className="modal-title">RTTX Editor</h1>
          <p className="modal-subtitle">Real-time collaborative writing, together.</p>
        </div>

        {/* Form */}
        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label htmlFor="username-input" className="input-label">Your display name</label>
            <input
              id="username-input"
              ref={inputRef}
              className="input-field"
              type="text"
              placeholder="e.g. Alice, Bob, Charlie…"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              autoFocus
              autoComplete="off"
              maxLength={24}
            />
            {error && <span className="input-error" role="alert">{error}</span>}
          </div>

          <button id="join-btn" type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            <span>🚀</span> Join Editor
          </button>
        </form>

        {/* Feature pills */}
        <div className="modal-features">
          <div className="feature-pill">⚡ Live sync</div>
          <div className="feature-pill">👥 Multi-user</div>
          <div className="feature-pill">💬 Typing indicators</div>
          <div className="feature-pill">🔗 Shareable</div>
        </div>
      </div>
    </div>
  );
}
