import React, { useEffect, useRef } from 'react';

// Add keyframe animations
const modalStyles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = modalStyles;
  document.head.appendChild(styleSheet);
}

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([type="hidden"]):not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

const Modal = ({ children, onClose, labelledBy, describedBy, initialFocusRef }) => {
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    const container = containerRef.current;
    if (!container) return;

    const focusable = container.querySelectorAll(FOCUSABLE_SELECTORS);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || focusable.length === 0) {
        return;
      }

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    const tryInitialFocus = () => {
      if (initialFocusRef && initialFocusRef.current && container.contains(initialFocusRef.current)) {
        initialFocusRef.current.focus();
        return true;
      }
      return false;
    };

    // If something inside the modal already has focus, don't steal it.
    if (!container.contains(document.activeElement)) {
      if (!tryInitialFocus()) {
        if (first) {
          first.focus();
        } else {
          container.focus();
        }
      }
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [onClose, initialFocusRef]);

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--bg-overlay)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        animation: 'fadeIn 200ms ease-out'
      }}
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        ref={containerRef}
        tabIndex={-1}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          width: '100%',
          maxWidth: '480px',
          boxShadow: 'var(--shadow-2xl)',
          border: '1px solid var(--border-color)',
          animation: 'slideUp 200ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
