import { useState, useRef, useEffect } from 'react';
import TypingIndicator from './TypingIndicator';

// Count words by splitting on any whitespace (handles double spaces, newlines, etc.)
function getWordCount(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0; // empty string would give [""] → 1 word without this check
  return trimmed.split(/\s+/).length;
}

function getCharCount(text) {
  return text.length;
}

export default function Editor({ content, setContent, onContentChange, typingUser }) {
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef(null);
  const textareaRef = useRef(null);

  // When the user types, update local state and broadcast to the server
  const handleChange = (e) => {
    const newValue = e.target.value;
    setContent(newValue);
    onContentChange(newValue); // this is the socket emit (handled in useSocket)
  };

  const handleShareLink = async () => {
    try {
      // Modern clipboard API — works on HTTPS and localhost
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Fallback for HTTP deployments where clipboard API is blocked
      const el = document.createElement('textarea');
      el.value = window.location.href;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy'); // old but reliable
      document.body.removeChild(el);
    }

    // Show the success toast and auto-hide it after 2 seconds
    clearTimeout(toastTimerRef.current);
    setShowToast(true);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 2000);
  };

  // Clean up the timer if the component unmounts while toast is showing
  useEffect(() => {
    return () => clearTimeout(toastTimerRef.current);
  }, []);

  const words = getWordCount(content);
  const chars = getCharCount(content);

  return (
    <>
      {/* Top bar with document status and action buttons */}
      <div className="editor-header">
        <div className="editor-title">
          {/* Pulsing green dot to show the doc is live */}
          <div className="doc-dot" aria-hidden="true" />
          Shared Document
        </div>

        <div className="header-actions">
          <button
            id="share-link-btn"
            className="btn btn-secondary"
            onClick={handleShareLink}
            title="Copy share link to clipboard"
          >
            <span aria-hidden="true">🔗</span> Share
          </button>
        </div>
      </div>

      {/* The main editing area */}
      <div className="editor-body">
        <textarea
          id="collaborative-textarea"
          ref={textareaRef}
          className="editor-textarea"
          value={content}
          onChange={handleChange}
          placeholder="Start typing… your collaborators will see changes instantly ✨"
          aria-label="Collaborative document editor"
          spellCheck={true}
        />

        {/* Footer: typing indicator on the left, word/char count on the right */}
        <div className="editor-footer">
          <TypingIndicator typingUser={typingUser} />

          {/* Updates live as you type */}
          <div className="word-count" aria-live="polite">
            <span>
              <strong>{words}</strong> {words === 1 ? 'word' : 'words'}
            </span>
            <span>
              <strong>{chars}</strong> {chars === 1 ? 'char' : 'chars'}
            </span>
          </div>
        </div>
      </div>

      {/* Toast notification — pops up after clicking Share */}
      {showToast && (
        <div className="toast" role="status" aria-live="polite">
          <span aria-hidden="true">✅</span> Link copied to clipboard!
        </div>
      )}
    </>
  );
}
