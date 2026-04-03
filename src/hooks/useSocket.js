import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import * as Y from 'yjs';
import { SocketIOAwareness } from './SocketIOProvider';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
const STOP_TYPING_DELAY = 1500;

// ydoc and awareness are created outside the hook so they're stable
// across React re-renders and available immediately (before socket connects)
export const ydoc      = new Y.Doc();
export const awareness = new SocketIOAwareness(ydoc);

export function useSocket() {
  const socketRef          = useRef(null);
  const stopTypingTimerRef = useRef(null);

  const [connected,   setConnected]   = useState(false);
  const [users,       setUsers]       = useState([]);
  const [typingUser,  setTypingUser]  = useState(null);
  const [history,     setHistory]     = useState([]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    // Wire the awareness bridge to this socket so cursor events flow through
    awareness.attachSocket(socket);

    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Server sends us the current Yjs state + peers + history when we first join
    socket.on('init', ({ yjsState, users: initUsers, history: initHistory }) => {
      if (yjsState?.length) {
        Y.applyUpdate(ydoc, new Uint8Array(yjsState), 'server');
      }
      setUsers(initUsers);
      setHistory(initHistory || []);
    });

    // Relay incoming Yjs updates from other clients into our local doc
    socket.on('y-update', (update) => {
      Y.applyUpdate(ydoc, new Uint8Array(update), 'server');
    });

    socket.on('user-list',      setUsers);
    socket.on('history-update', setHistory);
    socket.on('typing',         setTypingUser);
    socket.on('stop-typing',    () => setTypingUser(null));

    // Send any local Yjs changes to the server (ignore updates that came FROM server)
    ydoc.on('update', (update, origin) => {
      if (origin !== 'server') {
        socket.emit('y-update', Array.from(update));
      }
    });

    return () => socket.disconnect();
  }, []);

  // Send username + our Yjs clientID so server can track our cursor on disconnect
  const join = useCallback((username) => {
    socketRef.current?.emit('join', { username, clientID: ydoc.clientID });
  }, []);

  // Debounced typing indicator — fires stop-typing 1.5s after the last keystroke
  const handleTyping = useCallback(() => {
    socketRef.current?.emit('typing');
    clearTimeout(stopTypingTimerRef.current);
    stopTypingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit('stop-typing');
    }, STOP_TYPING_DELAY);
  }, []);

  // Save a plain-text snapshot for revision history
  const saveSnapshot = useCallback((text) => {
    socketRef.current?.emit('save-snapshot', text);
  }, []);

  return {
    connected,
    users,
    typingUser,
    history,
    join,
    handleTyping,
    saveSnapshot,
  };
}
