import { useState, useCallback } from 'react';
import { useSocket } from './hooks/useSocket';
import UsernameModal from './components/UsernameModal';
import UserList from './components/UserList';
import Editor from './components/Editor';

export default function App() {
  const [joined,     setJoined]     = useState(false);
  const [myUsername, setMyUsername] = useState('');
  const [myColor,    setMyColor]    = useState('#6c63ff');

  const {
    connected,
    users,
    typingUser,
    history,
    join,
    handleTyping,
    saveSnapshot,
  } = useSocket();

  const handleJoin = useCallback((username) => {
    // Pick a color for this user — matches what the server will assign
    const COLORS = ['#6c63ff','#ff6584','#43e97b','#f7971e','#4facfe','#f093fb','#fd7043','#00b09b'];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    setMyUsername(username);
    setMyColor(color);
    join(username);
    setJoined(true);
  }, [join]);

  return (
    <>
      {!joined && <UsernameModal onJoin={handleJoin} />}

      <div className="app" aria-hidden={!joined}>
        <aside className="sidebar" aria-label="Connected users sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon" aria-hidden="true">✏️</div>
            <div className="sidebar-brand-name"><span>RTTX</span> Editor</div>
          </div>

          <div className="sidebar-divider" />

          <UserList users={users} myUsername={myUsername} />

          {/* Live connection dot at the bottom of the sidebar */}
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', fontSize: '0.75rem', color: connected ? 'var(--success)' : 'var(--danger)' }} aria-live="polite">
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? 'var(--success)' : 'var(--danger)', animation: connected ? 'pulse 2s infinite' : 'none' }} />
            {connected ? 'Connected' : 'Reconnecting…'}
          </div>
        </aside>

        <main className="editor-area" aria-label="Document editor">
          <Editor
            myUsername={myUsername}
            myColor={myColor}
            typingUser={typingUser}
            history={history}
            saveSnapshot={saveSnapshot}
            onTyping={handleTyping}
          />
        </main>
      </div>
    </>
  );
}
