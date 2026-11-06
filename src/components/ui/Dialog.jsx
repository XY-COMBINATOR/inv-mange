import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './IconButton';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  size = 'small',
  className = '',
}) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const focusables = () =>
      [...(panel?.querySelectorAll(FOCUSABLE) ?? [])].filter(
        (element) => element.getClientRects().length > 0,
      );

    const frame = requestAnimationFrame(() => {
      const target =
        panel?.querySelector('[data-autofocus]') ?? focusables()[0] ?? panel;
      target?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        panel?.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = overflow;
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="md-dialog-scrim"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={[
          'md-dialog',
          `md-dialog--${size}`,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <header className="md-dialog__header">
          <div className="md-dialog__heading">
            <h2 id={titleId} className="md-headline-small">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="md-body-medium text-muted">
                {description}
              </p>
            ) : null}
          </div>
          <IconButton
            icon="close"
            label="Close dialog"
            onClick={onClose}
            className="md-dialog__close"
          />
        </header>
        <div className="md-dialog__content">{children}</div>
        {actions ? <footer className="md-dialog__actions">{actions}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}
