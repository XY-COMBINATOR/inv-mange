import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

const MENU_WIDTH = 208;
const ESTIMATED_HEIGHT = 260;

export function Menu({ items, label = 'More actions' }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const position = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow < ESTIMATED_HEIGHT && rect.top > spaceBelow
        ? Math.max(8, rect.top - ESTIMATED_HEIGHT - 4)
        : rect.bottom + 4;
    const left = Math.min(
      Math.max(8, rect.right - MENU_WIDTH),
      window.innerWidth - MENU_WIDTH - 8,
    );
    setCoords({ top, left });
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    position();
    const onPointerDown = (event) => {
      if (
        menuRef.current?.contains(event.target) ||
        triggerRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onScroll = () => setOpen(false);

    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', onScroll, true);

    const frame = requestAnimationFrame(() => {
      menuRef.current
        ?.querySelector('[role="menuitem"]:not([disabled])')
        ?.focus();
    });

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, position]);

  const close = (restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const handleMenuKeyDown = (event) => {
    const entries = [
      ...(menuRef.current?.querySelectorAll(
        '[role="menuitem"]:not([disabled])',
      ) ?? []),
    ];
    const currentIndex = entries.indexOf(document.activeElement);

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const next =
        (currentIndex + direction + entries.length) % entries.length;
      entries[next]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      entries[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      entries.at(-1)?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === 'Tab') {
      close(false);
    }
  };

  return (
    <>
      <span ref={triggerRef} className="md-menu-trigger">
        <IconButton
          icon="more_vert"
          label={label}
          size="small"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => (open ? close() : setOpen(true))}
        />
      </span>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              className="md-menu"
              role="menu"
              aria-label={label}
              style={{ top: coords.top, left: coords.left }}
              onKeyDown={handleMenuKeyDown}
            >
              {items.map((item, index) =>
                item.divider ? (
                  <hr
                    key={`divider-${index}`}
                    className="md-menu__divider"
                    aria-hidden="true"
                  />
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    className={`md-menu__item ${item.danger ? 'md-menu__item--danger' : ''}`}
                    disabled={item.disabled}
                    onClick={() => {
                      close(false);
                      item.onSelect();
                    }}
                  >
                    <Icon name={item.icon} size={20} />
                    <span>{item.label}</span>
                  </button>
                ),
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
