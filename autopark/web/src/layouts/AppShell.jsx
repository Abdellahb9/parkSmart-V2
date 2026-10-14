import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronLeft, KeyRound, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import { Button, LanguageSwitch, ThemeToggle } from '../components/ui';
import useAuthStore from '../store/authStore';
import { NAV_BY_ROLE, roleLabel } from './navConfig';
import SecurityDialog from '../features/common/SecurityDialog';

const COLLAPSE_KEY = 'autopark_sidebar_collapsed';
const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
};

function Brand({ collapsed }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-sm font-bold text-on-primary">
        AP
      </span>
      {!collapsed && (
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-text">AutoPark</span>
          <span className="block truncate text-xs text-text-muted">{t('common.city')}</span>
        </span>
      )}
    </div>
  );
}

function NavItems({ items, collapsed, onNavigate }) {
  const { t } = useTranslation();
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-2">
      {items.map(({ to, labelKey, icon: Icon, end }) => {
        const label = t(labelKey);
        return (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              collapsed && 'justify-center px-2',
              isActive
                ? 'bg-primary-soft text-primary'
                : 'text-text-muted hover:bg-surface-alt hover:text-text',
              FOCUS
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon aria-hidden="true" className="size-5 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
              {/* aria-current is what tells a screen reader which page you are on. */}
              {isActive && <span className="sr-only">{t('common.currentPage')}</span>}
            </>
          )}
        </NavLink>
        );
      })}
    </nav>
  );
}

function UserCard({ user, collapsed, onLogout, onSecurity }) {
  const { t } = useTranslation();
  const initials =
    user?.fullName
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'AP';

  return (
    <div className="border-t border-border p-2">
      <div className={cn('flex items-center gap-3 rounded-md px-2 py-2', collapsed && 'justify-center px-0')}>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-alt text-xs font-bold text-text">
          {initials}
        </span>
        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-text">{user?.fullName}</span>
            <span className="block truncate text-xs text-text-muted">{roleLabel(t, user?.role)}</span>
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onSecurity}
        title={collapsed ? t('security.menu') : undefined}
        className={cn(
          'mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface-alt hover:text-text',
          collapsed && 'justify-center px-2',
          FOCUS
        )}
      >
        <KeyRound aria-hidden="true" className="size-5 shrink-0" />
        {!collapsed ? t('security.menu') : <span className="sr-only">{t('security.menu')}</span>}
      </button>
      <button
        type="button"
        onClick={onLogout}
        className={cn(
          'mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-spot-occupied-bg',
          collapsed && 'justify-center px-2',
          FOCUS
        )}
      >
        <LogOut aria-hidden="true" className="size-5 shrink-0 rtl:rotate-180" />
        {!collapsed && t('shell.logout')}
      </button>
    </div>
  );
}

export default function AppShell() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const closeBtn = useRef(null);

  const items = NAV_BY_ROLE[user?.role] ?? [];

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      // not persisting is fine
    }
  }, [collapsed]);

  // Navigating must close the mobile drawer, or the new page is hidden behind it.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    closeBtn.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-dvh bg-bg text-text">
      {/* Desktop sidebar. Below lg it is replaced by the drawer, so there is
          never a width at which navigation simply disappears. */}
      <aside
        className={cn(
          'fixed inset-y-0 start-0 z-30 hidden h-dvh flex-col border-e border-border bg-surface lg:flex',
          collapsed ? 'w-[4.5rem]' : 'w-64'
        )}
      >
        <Brand collapsed={collapsed} />
        <NavItems items={items} collapsed={collapsed} />
        <UserCard user={user} collapsed={collapsed} onLogout={handleLogout} onSecurity={() => setSecurityOpen(true)} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden">
          <button
            type="button"
            aria-label={t('shell.closeMenu')}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/50"
          />
          <aside
            id="mobile-nav"
            className="fixed inset-y-0 start-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col border-e border-border bg-surface shadow-3"
          >
            <div className="flex items-center justify-between">
              <Brand collapsed={false} />
              <button
                ref={closeBtn}
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label={t('shell.closeMenu')}
                className={cn('me-2 grid size-9 place-items-center rounded-md text-text-muted hover:bg-surface-alt', FOCUS)}
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <NavItems items={items} collapsed={false} onNavigate={() => setMobileOpen(false)} />
            <UserCard
              user={user}
              collapsed={false}
              onLogout={handleLogout}
              onSecurity={() => {
                setMobileOpen(false);
                setSecurityOpen(true);
              }}
            />
          </aside>
        </div>
      )}

      {/* Content column */}
      <div className={cn('flex min-h-dvh flex-col transition-[padding]', collapsed ? 'lg:ps-[4.5rem]' : 'lg:ps-64')}>
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label={t('shell.openMenu')}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className={cn('grid size-10 place-items-center rounded-md text-text-muted hover:bg-surface-alt lg:hidden', FOCUS)}
          >
            <Menu aria-hidden="true" className="size-5" />
          </button>

          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? t('shell.expand') : t('shell.collapse')}
            className={cn('hidden size-10 place-items-center rounded-md text-text-muted hover:bg-surface-alt lg:grid', FOCUS)}
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" className="size-5 rtl:rotate-180" />
            ) : (
              <PanelLeftClose aria-hidden="true" className="size-5 rtl:rotate-180" />
            )}
          </button>

          <div className="relative hidden min-w-0 flex-1 sm:block">
            <Search aria-hidden="true" className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-text-muted" />
            <input
              type="search"
              placeholder={t('shell.searchPlaceholder')}
              aria-label={t('shell.search')}
              className={cn(
                'h-10 w-full max-w-md rounded-md border border-border bg-bg ps-9 pe-3 text-sm text-text placeholder:text-text-muted',
                FOCUS
              )}
            />
          </div>

          <div className="ms-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label={t('shell.notifications')} title={t('shell.notifications')}>
              <Bell aria-hidden="true" className="size-5" />
            </Button>
            <ThemeToggle />
            <LanguageSwitch className="ms-1" />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <SecurityDialog open={securityOpen} onClose={() => setSecurityOpen(false)} />
    </div>
  );
}

/** Page header used by every screen, so titles and actions line up. */
export function PageHeader({ title, description, actions, backTo }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {backTo && (
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className={cn('mb-1 inline-flex items-center gap-1 text-sm text-text-muted hover:text-text', FOCUS)}
          >
            <ChevronLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
            {t('common.back')}
          </button>
        )}
        <h1 className="text-xl font-bold text-text sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
