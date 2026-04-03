import { useState, useCallback } from 'react';
import { useSocket } from './hooks/useSocket';
import UsernameModal from './components/UsernameModal';
import UserList from './components/UserList';
import Editor from './components/Editor';

export default function App() {
  // Controls whether we show the username gate or the actual editor
  const [joined, setJoined] = useState(false);
  const [myUsername, setMyUsername] = useState('');

  // Pull everything we need from the socket hook —
  // it handles all the real-time logic so this component stays clean
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

  // When the user submits the modal, register with the server and show the editor
  const handleJoin = useCallback((username) => {
    setMyUsername(username);
    join(username);
    setJoined(true);
  }, [join]);

  return (
    <>
      {/* Username modal — blocks the editor until the user picks a name */}
      {!joined && <UsernameModal onJoin={handleJoin} />}

      {/* Main layout — always rendered so the socket connects early,
          but visually hidden behind the modal until the user joins */}
      <div className="app" aria-hidden={!joined}>

        {/* Left sidebar: branding + online users */}
        <aside className="sidebar" aria-label="Connected users sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon" aria-hidden="true">✏️</div>
            <div className="sidebar-brand-name">
              <span>RTTX</span> Editor
            </div>
          </div>

          <div className="sidebar-divider" />

          {/* List of everyone currently in the document */}
          <UserList users={users} myUsername={myUsername} />

          {/* Live connection indicator at the bottom of the sidebar */}
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

        {/* Right panel: the actual editor */}
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
