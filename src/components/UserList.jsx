export default function UserList({ users, myUsername }) {
  return (
    <div className="user-list-section">
      <div className="user-list-header">
        <span className="user-list-label">Online</span>
        <span className="online-badge">{users.length} online</span>
      </div>

      <div className="user-list" role="list" aria-label="Connected users">
        {users.length === 0 && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '4px 8px' }}>
            No one else connected yet.
          </p>
        )}
        {users.map((user) => {
          const isMe = user.username === myUsername;
          const initials = user.username
            .split(' ')
            .map((w) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <div
              key={user.id}
              className="user-item"
              role="listitem"
              aria-label={isMe ? `${user.username} (you)` : user.username}
            >
              <div
                className="user-avatar"
                style={{ background: user.color }}
                title={user.username}
              >
                {initials}
              </div>
              <span className="user-name">{user.username}</span>
              {isMe && <span className="you-badge">You</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
