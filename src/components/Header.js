import React from 'react';
import { BookIcon, StorageIcon } from './icons';

export default function Header({
  storageSelectId,
  storageSelectLabelId,
  storageKey,
  storageOptions,
  isSwitchingStorage,
  handleStorageChange,
  storageDescription,
  resetButtonDescriptionId,
  setShowResetConfirm,
  theme,
  onToggleTheme
}) {
  const borderColor = theme === 'dark' ? '#047857' : '#008751';

  return (
    <header 
      data-testid="app-header" 
      style={{
        background: 'var(--header-gradient)',
        borderBottom: '3px solid var(--header-border)',
        padding: '0.75rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: 'var(--header-shadow)',
        position: 'relative',
        zIndex: 100
      }}
    >
      {/* Logo and title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div 
          style={{ 
            backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
            padding: '0.5rem',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)',
            transition: 'transform var(--transition-fast)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05) rotate(5deg)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
        >
          <BookIcon />
        </div>
        <h1 
          style={{ 
            fontSize: '1.5rem', 
            fontWeight: '800', 
            letterSpacing: '-0.02em', 
            margin: 0,
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, #ffffff, #f1f5f9)' 
              : 'linear-gradient(135deg, #001a0d, #004225)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Personal Study Note
        </h1>
      </div>

      {/* Right side controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Storage selector */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: theme === 'dark' ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.95)',
            borderRadius: 'var(--radius-md)',
            padding: '0.4rem 0.75rem',
            border: '1px solid var(--border-subtle)',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-sm)',
            backdropFilter: 'blur(8px)',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          title={storageDescription}
        >
          <span style={{ color: '#64748b', display: 'flex' }}>
            <StorageIcon />
          </span>
          <label htmlFor={storageSelectId} id={storageSelectLabelId} style={{ display: 'none' }}>
            Choose where notes are stored
          </label>
          <select
            id={storageSelectId}
            aria-labelledby={storageSelectLabelId}
            value={storageKey}
            onChange={handleStorageChange}
            disabled={isSwitchingStorage}
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              border: 'none',
              backgroundColor: 'transparent',
              color: '#1e293b',
              cursor: isSwitchingStorage ? 'progress' : 'pointer',
              outline: 'none',
              paddingRight: '0.25rem'
            }}
          >
            {storageOptions.map(option => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={'Switch to ' + (theme === 'light' ? 'dark' : 'light') + ' mode'}
          aria-label={'Switch to ' + (theme === 'light' ? 'dark' : 'light') + ' mode'}
          style={{
            background: theme === 'dark' ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.95)',
            color: theme === 'dark' ? '#fbbf24' : '#1e293b',
            border: '1px solid var(--border-subtle)',
            padding: '0.5rem',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all var(--transition-fast)',
            boxShadow: 'var(--shadow-sm)',
            backdropFilter: 'blur(8px)'
          }}
          onMouseEnter={(e) => { 
            e.currentTarget.style.transform = 'scale(1.1) rotate(15deg)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            e.currentTarget.style.background = theme === 'dark' ? 'rgba(251,191,36,0.2)' : 'rgba(251,191,36,0.1)';
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            e.currentTarget.style.background = theme === 'dark' ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.95)';
          }}
        >
          {theme === 'light' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          )}
        </button>

        {/* Reset button */}
        <button
          type="button"
          onClick={() => setShowResetConfirm(true)}
          title="Reset stored data"
          aria-describedby={resetButtonDescriptionId}
          aria-haspopup="dialog"
          style={{
            background: theme === 'dark' ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.95)',
            color: 'var(--button-danger)',
            border: '1px solid var(--border-subtle)',
            padding: '0.5rem',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all var(--transition-fast)',
            boxShadow: 'var(--shadow-sm)',
            backdropFilter: 'blur(8px)'
          }}
          onMouseEnter={(e) => { 
            e.currentTarget.style.backgroundColor = 'var(--button-danger)';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.95)';
            e.currentTarget.style.color = 'var(--button-danger)';
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
