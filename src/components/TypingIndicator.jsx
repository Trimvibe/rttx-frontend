export default function TypingIndicator({ typingUser }) {
  if (!typingUser) {
    return <div className="typing-indicator" aria-live="polite" aria-atomic="true" />;
  }

  return (
    <div className="typing-indicator" aria-live="polite" aria-atomic="true">
      <div
        className="user-avatar"
        style={{
          background: typingUser.color,
          width: 20,
          height: 20,
          fontSize: '0.55rem',
          flexShrink: 0,
        }}
      >
        {typingUser.username[0].toUpperCase()}
      </div>
      <span>
        <strong style={{ color: typingUser.color }}>{typingUser.username}</strong> is typing
      </span>
      <div className="typing-dots" aria-hidden="true">
        <span style={{ background: typingUser.color }} />
        <span style={{ background: typingUser.color }} />
        <span style={{ background: typingUser.color }} />
      </div>
    </div>
  );
}
