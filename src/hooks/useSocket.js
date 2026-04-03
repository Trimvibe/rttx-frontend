import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

// In dev this falls back to localhost. In production, Vercel injects VITE_SOCKET_URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// How long to wait after the last keystroke before telling others you stopped typing
const STOP_TYPING_DELAY = 1500; // ms

export function useSocket() {
  // We store the socket in a ref so it persists across renders without causing them
  const socketRef = useRef(null);

  // Timer ref for the stop-typing debounce — cleared on every new keystroke
  const stopTypingTimerRef = useRef(null);

  // This flag is the key to avoiding an infinite echo loop.
  // When a remote text-change arrives, we set this to true before updating state.
  // The onChange handler checks this and skips re-emitting if it's set.
  const isRemoteUpdateRef = useRef(false);

  const myUsernameRef = useRef('');

  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const [content, setContent] = useState('');
  const [typingUser, setTypingUser] = useState(null); // { username, color }

  // Create the socket connection once when the app loads
  // The empty [] means this effect never re-runs
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      // Try WebSocket first, fall back to HTTP polling if needed
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Server sends this right after we join — the current doc + who's online
    socket.on('init', ({ content: initContent, users: initUsers }) => {
      isRemoteUpdateRef.current = true; // mark as remote so onChange doesn't re-emit
      setContent(initContent);
      setUsers(initUsers);
    });

    // Another user changed the document — update our textarea
    socket.on('text-change', (newContent) => {
      isRemoteUpdateRef.current = true; // same here — don't echo this back
      setContent(newContent);
    });

    // Server pushed a fresh user list (someone joined or left)
    socket.on('user-list', (updatedUsers) => {
      setUsers(updatedUsers);
    });

    // Someone else is typing — show their name + animated dots
    socket.on('typing', (data) => {
      setTypingUser(data);
    });

    // They stopped — hide the indicator
    socket.on('stop-typing', () => {
      setTypingUser(null);
    });

    // Clean up when the component unmounts (e.g. page nav)
    return () => {
      socket.disconnect();
    };
  }, []);

  // Called once when the user submits the username modal
  const join = useCallback((username) => {
    myUsernameRef.current = username;
    socketRef.current?.emit('join', username);
  }, []);

  // Called on every keystroke in the editor
  const handleContentChange = useCallback((newContent) => {
    // If this update came from a remote user, reset the flag and bail out.
    // Without this check we'd emit the change back to the server, causing an echo loop.
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    // It's our own keystroke — broadcast it
    socketRef.current?.emit('text-change', newContent);

    // Tell others we're typing, and reset the stop-typing timer.
    // clearTimeout is safe to call even if no timer is set.
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
