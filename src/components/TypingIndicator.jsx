export default function TypingIndicator({ typingUser }) {
  // Render an empty div (not null) when no one is typing.
  // This keeps the footer height stable so the editor doesn't jump around.
  if (!typingUser) {
    return <div className="typing-indicator" aria-live="polite" aria-atomic="true" />;
  }

  return (
    <div className="typing-indicator" aria-live="polite" aria-atomic="true">
      {/* Mini avatar matching the typing user's color */}
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

      {/* Name highlighted in their color so it's easy to spot */}
      <span>
        <strong style={{ color: typingUser.color }}>{typingUser.username}</strong> is typing
      </span>

      {/* Three bouncing dots — staggered via CSS animation-delay */}
      <div className="typing-dots" aria-hidden="true">
        <span style={{ background: typingUser.color }} />
        <span style={{ background: typingUser.color }} />
        <span style={{ background: typingUser.color }} />
      </div>
    </div>
  );
}
