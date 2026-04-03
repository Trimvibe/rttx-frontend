import { useState, useCallback } from 'react';
import { useSocket } from './hooks/useSocket';
import UsernameModal from './components/UsernameModal';
import UserList from './components/UserList';
import Editor from './components/Editor';

export default function App() {
  const [joined, setJoined] = useState(false);
  const [myUsername, setMyUsername] = useState('');

  const {
    connected,
    users,
    content,
    setContent,
    typingUser,
    join,
    handleContentChange,
    isRemoteUpdateRef,
  } = useSocket();

  const handleJoin = useCallback((username) => {
    setMyUsername(username);
    join(username);
    setJoined(true);
  }, [join]);

  // Wrap setContent to always reset the remote flag before updating from remote
  const handleRemoteContent = useCallback((newContent) => {
    isRemoteUpdateRef.current = true;
    setContent(newContent);
  }, [isRemoteUpdateRef, setContent]);

  return (
    <>
      {/* ── Username gate ── */}
      {!joined && <UsernameModal onJoin={handleJoin} />}

      {/* ── Main editor layout ── */}
      <div className="app" aria-hidden={!joined}>
        {/* Left sidebar: user list */}
        <aside className="sidebar" aria-label="Connected users sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon" aria-hidden="true">✏️</div>
            <div className="sidebar-brand-name">
              <span>RTTX</span> Editor
            </div>
          </div>

          <div className="sidebar-divider" />

          <UserList users={users} myUsername={myUsername} />

          {/* Connection status */}
          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 4px',
              fontSize: '0.75rem',
              color: connected ? 'var(--success)' : 'var(--danger)',
            }}
            aria-live="polite"
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: connected ? 'var(--success)' : 'var(--danger)',
                animation: connected ? 'pulse 2s infinite' : 'none',
              }}
            />
            {connected ? 'Connected' : 'Reconnecting…'}
          </div>
        </aside>

        {/* Right: editor panel */}
        <main className="editor-area" aria-label="Document editor">
          <Editor
            content={content}
            setContent={setContent}
            onContentChange={handleContentChange}
            typingUser={typingUser}
          />
        </main>
      </div>
    </>
  );
}
