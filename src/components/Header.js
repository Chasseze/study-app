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
  storageShortLabel,
  resetButtonDescriptionId,
  setShowResetConfirm
}) {
  return (
    <header data-testid="app-header" style={{
      background: 'linear-gradient(135deg, #008751 0%, #008751 33%, #ffffff 33%, #ffffff 66%, #008751 66%, #008751 100%)',
      border: '3px solid #008751',
  padding: '0.4rem 1.1rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '0.35rem',
  boxShadow: '0 2px 4px -2px rgba(0,0,0,0.06)'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <BookIcon />
        <h1 style={{ color: '#002b12', fontSize: '1.6rem', fontWeight: '700', letterSpacing: '0.15px', margin: 0 }}>
          Personal Study Note
        </h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div aria-describedby={storageDescription} title={storageDescription} style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#07121a',
              backgroundColor: '#ffffff',
              borderRadius: '0.35rem',
              padding: '0.08rem 0.45rem',
              border: '1px solid rgba(7,18,26,0.06)'
            }}
          >
          <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center', color: '#475569' }}>
            <StorageIcon />
          </span>
          <span style={{ display: 'none' }}>Active storage</span>
          <span style={{ marginLeft: '0.15rem' }}>{storageShortLabel}</span>
        </div>

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
            borderRadius: '0.25rem',
            border: '1px solid rgba(7,18,26,0.08)',
            backgroundColor: '#ffffff',
            padding: '0.12rem 0.32rem',
            color: '#07121a',
            cursor: isSwitchingStorage ? 'progress' : 'pointer',
            minWidth: '3.8rem'
          }}
          title="Switch storage backend"
        >
          {storageOptions.map(option => (
            <option key={option.key} value={option.key}>
              {option.shortLabel}
            </option>
          ))}
        </select>

          <div style={{ display: 'flex', gap: '0.18rem', alignItems: 'center' }}>
            <div style={{ minWidth: 48, textAlign: 'right' }} role="status" aria-live="polite" aria-atomic="true">{/** placeholder for saved status **/}</div>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              title="Reset stored data"
              aria-describedby={resetButtonDescriptionId}
              aria-haspopup="dialog"
              aria-expanded={false}
              style={{
                background: 'transparent',
                color: '#07121a',
                border: '1px solid rgba(7,18,26,0.06)',
                padding: '0.22rem',
                borderRadius: '0.32rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(7,18,26,0.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
