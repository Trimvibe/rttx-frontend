import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
const STOP_TYPING_DELAY = 1500; // ms

export function useSocket() {
  const socketRef = useRef(null);
  const stopTypingTimerRef = useRef(null);
  const isRemoteUpdateRef = useRef(false);
  const myUsernameRef = useRef('');

  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const [content, setContent] = useState('');
  const [typingUser, setTypingUser] = useState(null); // { username, color }

  // ── Initialize socket once ────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Server sends initial document + user list on join
    socket.on('init', ({ content: initContent, users: initUsers }) => {
      isRemoteUpdateRef.current = true;
      setContent(initContent);
      setUsers(initUsers);
    });

    // Remote text change (not from us)
    socket.on('text-change', (newContent) => {
      isRemoteUpdateRef.current = true;
      setContent(newContent);
    });

    // User list updated
    socket.on('user-list', (updatedUsers) => {
      setUsers(updatedUsers);
    });

    // Someone else is typing
    socket.on('typing', (data) => {
      setTypingUser(data);
    });

    // Someone stopped typing
    socket.on('stop-typing', () => {
      setTypingUser(null);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ── Join with username ────────────────────────────────────────────────────
  const join = useCallback((username) => {
    myUsernameRef.current = username;
    socketRef.current?.emit('join', username);
  }, []);

  // ── Handle local content change ───────────────────────────────────────────
  const handleContentChange = useCallback((newContent) => {
    // If this change came from a remote update, skip emitting
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    socketRef.current?.emit('text-change', newContent);

    // Emit typing + reset debounce timer
    socketRef.current?.emit('typing');
    clearTimeout(stopTypingTimerRef.current);
    stopTypingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit('stop-typing');
    }, STOP_TYPING_DELAY);
  }, []);

  return {
    socket: socketRef.current,
    connected,
    users,
    content,
    setContent,
    typingUser,
    myUsername: myUsernameRef.current,
    join,
    handleContentChange,
    isRemoteUpdateRef,
  };
}
