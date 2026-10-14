import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff, Loader2, Monitor, Moon, Sun, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { useTheme } from '../../hooks/useTheme';

// Every interactive element shares one focus ring so keyboard navigation is
// visible everywhere — the old stylesheet only styled focus on text inputs.
const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus focus-visible:outline-solid';

/* ── Spinner ─────────────────────────────────────────────────────────── */
export function Spinner({ className, label }) {
  const { t } = useTranslation();
  return (
    <>
      <Loader2 aria-hidden="true" className={cn('animate-spin motion-reduce:animate-none', className)} />
      <span className="sr-only">{label ?? t('ui.loading')}</span>
    </>
  );
}

/* ── Button ──────────────────────────────────────────────────────────── */
const BUTTON_VARIANTS = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover shadow-1',
  secondary: 'bg-surface text-text border border-border hover:bg-surface-alt',
  ghost: 'text-text hover:bg-surface-alt',
  danger: 'bg-danger text-on-primary hover:bg-danger-hover',
  accent: 'bg-accent text-on-accent hover:brightness-95',
};

const BUTTON_SIZES = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2',
  icon: 'h-11 w-11 justify-center',
};

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className, children, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-md font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.primary,
        BUTTON_SIZES[size] ?? BUTTON_SIZES.md,
        FOCUS,
        className
      )}
      {...rest}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
});

/* ── Field wrapper (label + error + hint, correctly associated) ───────── */
function Field({ id, label, hint, error, required, children }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-error` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text">
          {label}
          {required && (
            <span className="text-danger ms-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children({ hintId, errId })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

const CONTROL =
  'w-full rounded-md border bg-surface text-text placeholder:text-text-muted ' +
  'px-3 h-11 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed';

/* ── Input ───────────────────────────────────────────────────────────── */
export const Input = forwardRef(function Input(
  { label, hint, error, required, className, id: idProp, type = 'text', ...rest },
  ref
) {
  const { t } = useTranslation();
  const reactId = useId();
  const id = idProp || reactId;
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';

  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      {({ hintId, errId }) => (
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={isPassword && reveal ? 'text' : type}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={cn(errId, hintId) || undefined}
            className={cn(CONTROL, isPassword && 'pe-11', error ? 'border-danger' : 'border-border', FOCUS, className)}
            {...rest}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              // A password typed blind is how an admin locks out a new owner.
              aria-label={reveal ? t('ui.hidePassword') : t('ui.showPassword')}
              className={cn(
                'absolute inset-y-0 end-0 w-11 grid place-items-center rounded-md text-text-muted hover:text-text',
                FOCUS
              )}
            >
              {reveal ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            </button>
          )}
        </div>
      )}
    </Field>
  );
});

/* ── Select ──────────────────────────────────────────────────────────── */
export const Select = forwardRef(function Select(
  { label, hint, error, required, className, id: idProp, children, ...rest },
  ref
) {
  const reactId = useId();
  const id = idProp || reactId;
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      {({ hintId, errId }) => (
        <select
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={cn(errId, hintId) || undefined}
          className={cn(CONTROL, error ? 'border-danger' : 'border-border', FOCUS, className)}
          {...rest}
        >
          {children}
        </select>
      )}
    </Field>
  );
});

/* ── Textarea ────────────────────────────────────────────────────────── */
export const Textarea = forwardRef(function Textarea(
  { label, hint, error, required, className, id: idProp, rows = 4, ...rest },
  ref
) {
  const reactId = useId();
  const id = idProp || reactId;
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      {({ hintId, errId }) => (
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={cn(errId, hintId) || undefined}
          className={cn(CONTROL, 'h-auto py-2.5 leading-normal', error ? 'border-danger' : 'border-border', FOCUS, className)}
          {...rest}
        />
      )}
    </Field>
  );
});

/* ── Badge ───────────────────────────────────────────────────────────── */
// Tones pair a readable foreground with its own tint, so badge text clears
// WCAG AA. The old badges put a saturated colour on a 10% wash (~2.2:1).
const BADGE_TONES = {
  neutral: 'bg-surface-alt text-text-muted',
  primary: 'bg-primary-soft text-primary',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-spot-free-bg text-spot-free',
  warning: 'bg-spot-reserved-bg text-spot-reserved',
  danger: 'bg-spot-occupied-bg text-spot-occupied',
  // Domain tones — the blue/gold convention, named once.
  normal: 'bg-primary-soft text-parking-normal',
  street: 'bg-accent-soft text-parking-street',
  free: 'bg-spot-free-bg text-spot-free',
  reserved: 'bg-spot-reserved-bg text-spot-reserved',
  occupied: 'bg-spot-occupied-bg text-spot-occupied',
  overstay: 'bg-spot-overstay-bg text-spot-overstay',
  blocked: 'bg-spot-blocked-bg text-spot-blocked',
};

export function Badge({ tone = 'neutral', dot = false, icon: Icon, className, children, ...rest }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        BADGE_TONES[tone] ?? BADGE_TONES.neutral,
        className
      )}
      {...rest}
    >
      {/* Status is never colour-only: the dot is decorative, the text carries it. */}
      {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      {Icon && <Icon aria-hidden="true" className="size-3.5" />}
      {children}
    </span>
  );
}

/* ── Card ────────────────────────────────────────────────────────────── */
export function Card({ as: Tag = 'div', className, children, ...rest }) {
  return (
    <Tag className={cn('rounded-lg border border-border bg-surface shadow-1', className)} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, actions, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-border px-5 py-4', className)}>
      <div className="min-w-0">
        {title && <h3 className="text-base font-semibold text-text">{title}</h3>}
        {description && <p className="mt-0.5 text-sm text-text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

export function CardFooter({ className, children }) {
  return <div className={cn('border-t border-border px-5 py-3', className)}>{children}</div>;
}

/* ── Skeleton ────────────────────────────────────────────────────────── */
export function Skeleton({ className, ...rest }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse motion-reduce:animate-none rounded-md bg-surface-alt', className)}
      {...rest}
    />
  );
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

/* ── StatCard ────────────────────────────────────────────────────────── */
export function StatCard({ label, value, unit, icon: Icon, trend, hint, loading = false, className }) {
  if (loading) {
    return (
      <Card className={cn('p-5', className)}>
        <Skeleton className="size-10 rounded-md" />
        <Skeleton className="mt-4 h-7 w-24" />
        <Skeleton className="mt-2 h-3.5 w-32" />
      </Card>
    );
  }

  const up = typeof trend === 'number' && trend > 0;
  const down = typeof trend === 'number' && trend < 0;
  const TrendIcon = up ? TrendingUp : TrendingDown;

  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        {Icon && (
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
            <Icon aria-hidden="true" className="size-5" />
          </span>
        )}
        {typeof trend === 'number' && (
          <span
            // A signed percentage reads left to right in Arabic too (else "12%+").
            dir="ltr"
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
              up && 'bg-spot-free-bg text-spot-free',
              down && 'bg-spot-occupied-bg text-spot-occupied',
              !up && !down && 'bg-surface-alt text-text-muted'
            )}
          >
            {(up || down) && <TrendIcon aria-hidden="true" className="size-3.5" />}
            {up ? '+' : ''}
            {trend}%
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold text-text">
        {value}
        {unit && <span className="ms-1 text-base font-semibold text-text-muted">{unit}</span>}
      </p>
      <p className="mt-1 text-sm text-text-muted">{label}</p>
      {hint && <p className="mt-2 text-xs text-text-muted">{hint}</p>}
    </Card>
  );
}

/* ── ThemeToggle ─────────────────────────────────────────────────────── */
const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor };

export function ThemeToggle({ className }) {
  const { t } = useTranslation();
  const { theme, cycle } = useTheme();
  const key = THEME_ICONS[theme] ? theme : 'system';
  const Icon = THEME_ICONS[key];
  const label = t(`ui.theme.${key}`);
  return (
    <Button variant="ghost" size="icon" onClick={cycle} aria-label={label} title={label} className={className}>
      <Icon aria-hidden="true" className="size-5" />
    </Button>
  );
}
