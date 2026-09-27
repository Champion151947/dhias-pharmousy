import { useToast } from '../context/ToastContext';

export function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-live="polite" aria-label="Notifications">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`} role="alert">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"
            style={{ color: toast.type === 'error' ? 'var(--error)' : 'var(--success)', flexShrink: 0 }}>
            {toast.type === 'error' ? (
              <>
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </>
            ) : (
              <>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </>
            )}
          </svg>
          <span style={{ flex: 1 }}>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}