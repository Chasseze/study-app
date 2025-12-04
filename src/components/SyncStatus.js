import React from 'react';

const CloudIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
  </svg>
);

const CloudOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23"/>
    <path d="M16.72 11.06A5 5 0 0 1 21 16a4.97 4.97 0 0 1-3.27 4.68"/>
    <path d="M7 16c-1.66 0-3-1.34-3-3a3 3 0 0 1 1.94-2.8"/>
    <path d="M9.2 7.2A7.98 7.98 0 0 1 17.4 4.3"/>
  </svg>
);

const SyncIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sync-spin">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

export default function SyncStatus({ 
  isAuthenticated, 
  userEmail, 
  isSyncing, 
  lastSyncTime, 
  storageKey,
  onSignIn,
  onSignOut 
}) {
  const isFirebase = storageKey === 'firebase';
  
  const formatLastSync = (time) => {
    if (!time) return 'Never';
    const now = Date.now();
    const diff = now - time;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(time).toLocaleDateString();
  };

  if (!isFirebase) {
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.65rem',
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          color: 'var(--text-tertiary)'
        }}
        title="Data stored locally on this device"
      >
        <span style={{ opacity: 0.7 }}>💾</span>
        <span>Local only</span>
      </div>
    );
  }

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.35rem 0.75rem',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: '0.5rem',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}
    >
      {/* Sync status indicator */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.35rem',
          color: isAuthenticated ? 'var(--button-success)' : 'var(--text-muted)'
        }}
        title={isAuthenticated ? `Syncing to cloud • Last sync: ${formatLastSync(lastSyncTime)}` : 'Sign in to sync across devices'}
      >
        {isSyncing ? (
          <span style={{ animation: 'spin 1s linear infinite' }}><SyncIcon /></span>
        ) : isAuthenticated ? (
          <CloudIcon />
        ) : (
          <CloudOffIcon />
        )}
        <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>
          {isSyncing ? 'Syncing...' : isAuthenticated ? 'Synced' : 'Not synced'}
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '1rem', backgroundColor: 'var(--border-color)' }} />

      {/* User status and actions */}
      {isAuthenticated ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.35rem' 
            }}
          >
            <div 
              style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--button-success)',
                boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
              }} 
            />
            <span 
              style={{ 
                fontSize: '0.7rem', 
                color: 'var(--text-secondary)',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={userEmail}
            >
              {userEmail || 'Signed in'}
            </span>
          </div>
          <button
            onClick={onSignOut}
            style={{
              fontSize: '0.65rem',
              padding: '0.2rem 0.5rem',
              borderRadius: '0.25rem',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              e.currentTarget.style.borderColor = 'var(--text-muted)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            Sign out
          </button>
        </div>
      ) : (
        <button
          onClick={onSignIn}
          style={{
            fontSize: '0.7rem',
            padding: '0.3rem 0.65rem',
            borderRadius: '0.35rem',
            border: 'none',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 600,
            boxShadow: '0 1px 3px rgba(79, 70, 229, 0.3)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(79, 70, 229, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(79, 70, 229, 0.3)';
          }}
        >
          Sign in to sync
        </button>
      )}
    </div>
  );
}
