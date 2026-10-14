import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Inbox, RefreshCw, X, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { Button, Card, Skeleton } from './primitives';

/* ── EmptyState ──────────────────────────────────────────────────────── */
export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-12 text-center', className)}>
      <span className="grid size-12 place-items-center rounded-full bg-surface-alt text-text-muted">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <div>
        <p className="font-semibold text-text">{title}</p>
        {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── ErrorState ──────────────────────────────────────────────────────── */
// An error must never look like "no data". This always says something failed
// and always offers a way out.
export function ErrorState({ title, description, error, onRetry, className }) {
  const { t } = useTranslation();
  const detail = description || (error && (error.message || String(error))) || undefined;
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center gap-3 px-6 py-12 text-center', className)}
    >
      <span className="grid size-12 place-items-center rounded-full bg-spot-occupied-bg text-spot-occupied">
        <AlertTriangle aria-hidden="true" className="size-6" />
      </span>
      <div>
        <p className="font-semibold text-text">{title ?? t('ui.loadError')}</p>
        {detail && <p className="mt-1 max-w-prose text-sm text-text-muted">{detail}</p>}
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw aria-hidden="true" className="size-4" />
          {t('ui.retry')}
        </Button>
      )}
    </div>
  );
}

/* ── AsyncState ──────────────────────────────────────────────────────── */
/**
 * Wraps any data-driven region so loading, error and empty cannot be
 * forgotten — the audit found 0 of 10 views with a working error state and 7
 * that rendered a failed request as a convincing "no data".
 *
 * <AsyncState loading={loading} error={error} empty={!rows.length} onRetry={load}>
 *   {() => <Table rows={rows} />}
 * </AsyncState>
 */
export function AsyncState({
  loading,
  error,
  empty = false,
  onRetry,
  skeleton,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyAction,
  errorTitle,
  children,
}) {
  const { t } = useTranslation();
  if (loading) {
    return (
      skeleton ?? (
        <div className="flex flex-col gap-3 p-5" aria-busy="true">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )
    );
  }
  if (error) return <ErrorState title={errorTitle} error={error} onRetry={onRetry} />;
  if (empty) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle ?? t('ui.noData')}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }
  return typeof children === 'function' ? children() : children;
}

/* ── Toasts ──────────────────────────────────────────────────────────── */
const ToastContext = createContext(null);

const TOAST_META = {
  success: { Icon: CheckCircle2, tone: 'text-spot-free', bg: 'bg-spot-free-bg' },
  error: { Icon: XCircle, tone: 'text-spot-occupied', bg: 'bg-spot-occupied-bg' },
  warning: { Icon: AlertTriangle, tone: 'text-spot-reserved', bg: 'bg-spot-reserved-bg' },
  info: { Icon: Info, tone: 'text-primary', bg: 'bg-primary-soft' },
};

export function ToastProvider({ children, duration = 5000 }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (toast) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((list) => [...list, { id, tone: 'info', ...toast }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), toast.duration ?? duration)
      );
      return id;
    },
    [dismiss, duration]
  );

  // Timers must not outlive the provider.
  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach(clearTimeout);
      map.clear();
    };
  }, []);

  const api = useMemo(
    () => ({
      toast: push,
      success: (title, opts) => push({ tone: 'success', title, ...opts }),
      error: (title, opts) => push({ tone: 'error', title, ...opts }),
      warning: (title, opts) => push({ tone: 'warning', title, ...opts }),
      info: (title, opts) => push({ tone: 'info', title, ...opts }),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Announced politely so a screen reader hears the confirmation too. */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 end-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {/* Not "t": that name is the translation function used below. */}
        {toasts.map((item) => {
          const meta = TOAST_META[item.tone] ?? TOAST_META.info;
          return (
            <Card key={item.id} className="pointer-events-auto flex items-start gap-3 p-3 shadow-3">
              <span className={cn('grid size-8 shrink-0 place-items-center rounded-md', meta.bg, meta.tone)}>
                <meta.Icon aria-hidden="true" className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text">{item.title}</p>
                {item.description && <p className="mt-0.5 text-sm text-text-muted">{item.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label={t('ui.closeNotification')}
                className="grid size-7 shrink-0 place-items-center rounded-md text-text-muted hover:bg-surface-alt hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </Card>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
