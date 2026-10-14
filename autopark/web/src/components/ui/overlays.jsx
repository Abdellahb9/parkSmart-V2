import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { useDirection } from '../../i18n';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

// Both overlays use a native <dialog>, which gives focus trapping, Esc and
// inertness for free instead of hand-rolling them.
function useDialog(open, onClose) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const onCancel = (e) => {
      e.preventDefault(); // let React own the open state
      onClose?.();
    };
    const onClick = (e) => {
      if (e.target === el) onClose?.(); // click on the backdrop, not the panel
    };
    el.addEventListener('cancel', onCancel);
    el.addEventListener('click', onClick);
    return () => {
      el.removeEventListener('cancel', onCancel);
      el.removeEventListener('click', onClick);
    };
  }, [onClose]);

  return ref;
}

function CloseButton({ onClick, label }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? t('common.close')}
      className={cn('grid size-9 shrink-0 place-items-center rounded-md text-text-muted hover:bg-surface-alt hover:text-text', FOCUS)}
    >
      <X aria-hidden="true" className="size-5" />
    </button>
  );
}

/* ── Modal ───────────────────────────────────────────────────────────── */
const MODAL_SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

export function Modal({ open, onClose, title, description, footer, size = 'md', children, className }) {
  const ref = useDialog(open, onClose);
  const titleId = useId();
  const descId = useId();

  return (
    <dialog
      ref={ref}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      className={cn(
        'm-auto w-[calc(100vw-2rem)] rounded-lg border border-border bg-surface p-0 text-text shadow-3',
        'backdrop:bg-black/50 backdrop:backdrop-blur-sm',
        MODAL_SIZES[size] ?? MODAL_SIZES.md,
        className
      )}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="min-w-0">
              {title && (
                <h2 id={titleId} className="text-base font-semibold text-text">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="mt-0.5 text-sm text-text-muted">
                  {description}
                </p>
              )}
            </div>
            <CloseButton onClick={onClose} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

/* ── Drawer ──────────────────────────────────────────────────────────── */
// Slides in from the inline-end edge, so it mirrors correctly under RTL.
export function Drawer({ open, onClose, title, description, footer, width = 'md', children, className }) {
  const ref = useDialog(open, onClose);
  const titleId = useId();
  const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-xl' };

  return (
    <dialog
      ref={ref}
      aria-labelledby={title ? titleId : undefined}
      className={cn(
        'm-0 ms-auto h-dvh max-h-dvh w-full border-s border-border bg-surface p-0 text-text shadow-3',
        'backdrop:bg-black/50',
        widths[width] ?? widths.md,
        className
      )}
    >
      {open && (
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="min-w-0">
              {title && (
                <h2 id={titleId} className="text-base font-semibold text-text">
                  {title}
                </h2>
              )}
              {description && <p className="mt-0.5 text-sm text-text-muted">{description}</p>}
            </div>
            <CloseButton onClick={onClose} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

/* ── Tabs ────────────────────────────────────────────────────────────── */
/**
 * Real tabs: role=tablist/tab/tabpanel, aria-selected, roving tabindex and
 * arrow-key navigation. The existing pages use bare buttons, which announce
 * as nothing in particular.
 *
 * items: [{ id, label, badge?, content? }]
 */
export function Tabs({ items, value, onChange, className, children }) {
  const [internal, setInternal] = useState(items?.[0]?.id);
  const active = value ?? internal;
  const setActive = onChange ?? setInternal;
  const refs = useRef({});
  const baseId = useId();
  const { rtl } = useDirection();

  const onKeyDown = useCallback(
    (e) => {
      const order = items.map((i) => i.id);
      const idx = order.indexOf(active);
      let next = null;
      // In Arabic the tab row runs right to left, so the arrows swap meaning.
      const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
      const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
      if (e.key === forward) next = order[(idx + 1) % order.length];
      if (e.key === backward) next = order[(idx - 1 + order.length) % order.length];
      if (e.key === 'Home') next = order[0];
      if (e.key === 'End') next = order[order.length - 1];
      if (!next) return;
      e.preventDefault();
      setActive(next);
      refs.current[next]?.focus();
    },
    [items, active, setActive, rtl]
  );

  const current = items.find((i) => i.id === active);

  return (
    <div className={className}>
      <div role="tablist" onKeyDown={onKeyDown} className="flex flex-wrap gap-1 border-b border-border">
        {items.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              ref={(el) => {
                refs.current[item.id] = el;
              }}
              id={`${baseId}-tab-${item.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(item.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-t-md px-4 py-2.5 text-sm font-semibold transition-colors',
                selected
                  ? 'border-b-2 border-primary text-primary'
                  : 'border-b-2 border-transparent text-text-muted hover:text-text',
                FOCUS
              )}
            >
              {item.label}
              {item.badge != null && (
                <span className="rounded-full bg-surface-alt px-1.5 py-0.5 text-xs font-semibold text-text-muted">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div
        id={`${baseId}-panel-${active}`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active}`}
        tabIndex={0}
        className={cn('pt-4', FOCUS)}
      >
        {children ?? current?.content}
      </div>
    </div>
  );
}
