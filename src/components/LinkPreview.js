import React, { useState, useEffect, useRef } from 'react';
import { fetchReadable, normalizeUrl, hostnameOf } from '../lib/linkReader';
import { renderMarkdown } from '../lib/markdown';

// In-page link viewer with two modes:
//   • Reader  — fetches a clean, readable extraction and renders it in prose
//               (works even when a site forbids iframe embedding).
//   • Live    — sandboxed iframe of the actual page (for sites that allow it).
export default function LinkPreview({ url, onClose, style }) {
  const [mode, setMode] = useState('reader');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null); // { title, markdown, url }
  const [iframeError, setIframeError] = useState(false);
  const reqRef = useRef(0);

  const normalized = normalizeUrl(url);
  const host = hostnameOf(url);

  useEffect(() => {
    setIframeError(false);
  }, [url, mode]);

  useEffect(() => {
    if (mode !== 'reader' || !url) return;
    const runId = ++reqRef.current;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setData(null);

    fetchReadable(url, { signal: controller.signal })
      .then((result) => {
        if (runId !== reqRef.current) return;
        setData(result);
      })
      .catch((e) => {
        if (runId !== reqRef.current) return;
        if (e.name === 'AbortError') return;
        setError(e.message || 'Could not load a readable version of this page.');
      })
      .finally(() => {
        if (runId === reqRef.current) setLoading(false);
      });

    return () => controller.abort();
  }, [url, mode]);

  const tabBtn = (active) => ({
    fontSize: '0.74rem',
    fontWeight: 600,
    padding: '0.3rem 0.7rem',
    borderRadius: 'var(--radius-full)',
    border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border-color)'),
    background: active ? 'var(--accent-soft)' : 'transparent',
    color: active ? 'var(--accent-strong)' : 'var(--text-tertiary)',
    cursor: 'pointer'
  });

  const renderedHtml = data ? renderMarkdown(data.markdown) : '';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '320px',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      ...style
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-tertiary)'
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-ui)', fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)'
          }}>
            Link preview
          </div>
          <div style={{
            fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }} title={normalized}>
            {host}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button type="button" onClick={() => setMode('reader')} style={tabBtn(mode === 'reader')}>Reader</button>
          <button type="button" onClick={() => setMode('live')} style={tabBtn(mode === 'live')}>Live page</button>
        </div>

        <a
          href={normalized}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in new tab"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '2rem', height: '2rem', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)', color: 'var(--text-tertiary)', textDecoration: 'none'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          style={{
            width: '2rem', height: '2rem', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)', background: 'transparent',
            color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1
          }}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {mode === 'reader' ? (
          <div style={{ padding: '1.5rem 1.75rem' }}>
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <span style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  border: '2px solid var(--border-color)', borderTopColor: 'var(--accent)',
                  display: 'inline-block', animation: 'spin 0.8s linear infinite'
                }} />
                Fetching a readable version…
              </div>
            )}
            {!loading && error && (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-tertiary)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📄</div>
                <p style={{ margin: '0 0 1rem', fontSize: '0.9rem' }}>{error}</p>
                <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setMode('live')} style={tabBtn(false)}>Try live page</button>
                  <a href={normalized} target="_blank" rel="noopener noreferrer" style={{ ...tabBtn(false), textDecoration: 'none' }}>Open in new tab</a>
                </div>
              </div>
            )}
            {!loading && !error && data && (
              <>
                <h2 style={{
                  fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 600,
                  lineHeight: 1.2, margin: '0 0 1.25rem', color: 'var(--text-primary)'
                }}>
                  {data.title}
                </h2>
                <div className="prose" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
              </>
            )}
          </div>
        ) : (
          <>
            {!iframeError ? (
              <iframe
                src={normalized}
                title="Live page preview"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                style={{ width: '100%', height: '100%', minHeight: '320px', border: 'none', background: '#fff' }}
                onError={() => setIframeError(true)}
                onLoad={(e) => {
                  try {
                    const doc = e.target.contentDocument || e.target.contentWindow?.document;
                    if (!doc || !doc.body) setIframeError(true);
                  } catch (err) {
                    setIframeError(true);
                  }
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: 'var(--text-tertiary)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔒</div>
                <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', maxWidth: '320px', marginInline: 'auto' }}>
                  This site blocks live embedding. Try Reader mode to read it here, or open it in a new tab.
                </p>
                <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setMode('reader')} style={tabBtn(true)}>Switch to Reader</button>
                  <a href={normalized} target="_blank" rel="noopener noreferrer" style={{ ...tabBtn(false), textDecoration: 'none' }}>Open in new tab</a>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
