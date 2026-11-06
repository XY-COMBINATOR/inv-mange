import { useEffect } from 'react';
import { Icon } from './Icon';

export function Snackbar({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className="md-snackbar" role="status" aria-live="polite">
      <span className="md-snackbar__icon" aria-hidden="true">
        <Icon name="info" size={20} filled />
      </span>
      <p className="md-body-medium">{toast.message}</p>
      <div className="md-snackbar__actions">
        {toast.actionLabel ? (
          <button
            type="button"
            className="md-snackbar__action"
            onClick={() => {
              toast.onAction?.();
              onDismiss();
            }}
          >
            {toast.actionLabel}
          </button>
        ) : null}
        <button
          type="button"
          className="md-snackbar__close"
          aria-label="Dismiss notification"
          onClick={onDismiss}
        >
          <Icon name="close" size={20} />
        </button>
      </div>
    </div>
  );
}
