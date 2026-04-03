import { useState, useRef, useEffect } from 'react';
import TypingIndicator from './TypingIndicator';

function getWordCount(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function getCharCount(text) {
  return text.length;
}

export default function Editor({ content, setContent, onContentChange, typingUser }) {
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef(null);
  const isRemoteRef = useRef(false);

  // When content changes from outside (remote), mark it so onChange doesn't re-emit
  // We rely on isRemoteUpdateRef from useSocket; here we just track locally
  const textareaRef = useRef(null);

  // Preserve cursor position when remote update arrives
  const prevSelectionRef = useRef({ start: 0, end: 0 });

  const handleChange = (e) => {
    const newValue = e.target.value;
    setContent(newValue);
    onContentChange(newValue);
  };

  const handleShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Fallback for browsers that block clipboard
      const el = document.createElement('textarea');
      el.value = window.location.href;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    clearTimeout(toastTimerRef.current);
    setShowToast(true);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 2000);
  };

  useEffect(() => {
    return () => clearTimeout(toastTimerRef.current);
  }, []);

  const words = getWordCount(content);
  const chars = getCharCount(content);

  return (
    <>
      {/* ── Toolbar ── */}
      <div className="editor-header">
        <div className="editor-title">
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

      {/* ── Main editing area ── */}
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

        {/* Footer row: typing indicator + word count */}
        <div className="editor-footer">
          <TypingIndicator typingUser={typingUser} />

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

      {/* ── Toast notification ── */}
      {showToast && (
        <div className="toast" role="status" aria-live="polite">
          <span aria-hidden="true">✅</span> Link copied to clipboard!
        </div>
      )}
    </>
  );
}
