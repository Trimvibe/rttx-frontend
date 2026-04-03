import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { useState, useRef, useEffect, useCallback } from 'react';
import TypingIndicator from './TypingIndicator';
import { ydoc, awareness } from '../hooks/useSocket';

// Toolbar button — highlights when the formatting is active
function ToolbarBtn({ onClick, isActive, title, children }) {
  return (
    <button
      className={`toolbar-btn ${isActive ? 'is-active' : ''}`}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }} // preventDefault keeps editor focus
      title={title}
    >
      {children}
    </button>
  );
}

export default function Editor({ myUsername, myColor, typingUser, history, saveSnapshot }) {
  const [showToast,   setShowToast]   = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const toastTimerRef   = useRef(null);
  const snapshotTimerRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable Tiptap's built-in undo/redo — Yjs Collaboration handles it
        history: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder: 'Start typing… your collaborators will see changes instantly ✨',
      }),
      CharacterCount,
      // Yjs CRDT — binds this editor to the shared ydoc
      Collaboration.configure({ document: ydoc }),
      // Shows coloured cursors for each connected user
      CollaborationCursor.configure({
        provider: { awareness },
        user: { name: myUsername || 'Anonymous', color: myColor || '#6c63ff' },
      }),
    ],
  });

  // Update cursor label when username becomes available (after joining)
  useEffect(() => {
    if (editor && myUsername) {
      editor.commands.updateUser({ name: myUsername, color: myColor });
    }
  }, [editor, myUsername, myColor]);

  // Auto-save a plain-text snapshot every 2 minutes
  useEffect(() => {
    if (!editor || !saveSnapshot) return;
    snapshotTimerRef.current = setInterval(() => {
      const text = editor.getText().trim();
      if (text) saveSnapshot(text);
    }, 120_000);
    return () => clearInterval(snapshotTimerRef.current);
  }, [editor, saveSnapshot]);

  const handleShareLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Fallback for HTTP or older browsers
      const el = document.createElement('textarea');
      el.value = window.location.href;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setShowToast(true);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 2000);
  }, []);

  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  const words = editor ? editor.storage.characterCount.words()      : 0;
  const chars = editor ? editor.storage.characterCount.characters() : 0;

  if (!editor) return null;

  return (
    <>
      {/* ── Header ── */}
      <div className="editor-header">
        <div className="editor-title">
          <div className="doc-dot" aria-hidden="true" />
          Shared Document
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => setShowHistory(h => !h)}>
            🕓 History
          </button>
          <button id="share-link-btn" className="btn btn-secondary" onClick={handleShareLink}>
            🔗 Share
          </button>
        </div>
      </div>

      {/* ── Formatting toolbar ── */}
      <div className="editor-toolbar">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')} title="Bold (Ctrl+B)">
          <b>B</b>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')} title="Italic (Ctrl+I)">
          <i>I</i>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')} title="Underline (Ctrl+U)">
          <u>U</u>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')} title="Strikethrough">
          <s>S</s>
        </ToolbarBtn>
        <div className="toolbar-divider" />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })} title="Heading 1">
          H1
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })} title="Heading 2">
          H2
        </ToolbarBtn>
        <div className="toolbar-divider" />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')} title="Bullet list">
          •—
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')} title="Numbered list">
          1.
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')} title="Inline code">
          {'</>'}
        </ToolbarBtn>
        <div className="toolbar-divider" />
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">↩</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">↪</ToolbarBtn>
      </div>

      {/* ── Editor body ── */}
      <div className="editor-body">
        <EditorContent editor={editor} className="editor-content-wrap" />

        <div className="editor-footer">
          <TypingIndicator typingUser={typingUser} />
          <div className="word-count" aria-live="polite">
            <span><strong>{words}</strong> {words === 1 ? 'word' : 'words'}</span>
            <span><strong>{chars}</strong> {chars === 1 ? 'char' : 'chars'}</span>
          </div>
        </div>
      </div>

      {/* ── Revision history panel ── */}
      {showHistory && (
        <div className="history-overlay" onClick={() => setShowHistory(false)}>
          <div className="history-panel" onClick={e => e.stopPropagation()}>
            <div className="history-header">
              <h2 className="history-title">📋 Revision History</h2>
              <button className="toolbar-btn" onClick={() => setShowHistory(false)}>✕</button>
            </div>
            {history.length === 0
              ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No snapshots yet — one saves every 2 minutes.</p>
              : history.slice().reverse().map((snap, i) => (
                  <div className="history-item" key={i}>
                    <div className="history-time">
                      {new Date(snap.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' · '}
                      {new Date(snap.savedAt).toLocaleDateString()}
                    </div>
                    <div className="history-preview">{snap.text.slice(0, 160)}{snap.text.length > 160 ? '…' : ''}</div>
                  </div>
                ))
            }
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {showToast && (
        <div className="toast" role="status">
          <span>✅</span> Link copied to clipboard!
        </div>
      )}
    </>
  );
}
