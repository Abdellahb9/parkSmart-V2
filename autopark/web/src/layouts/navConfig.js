import {
  Banknote,
  CalendarClock,
  Gift,
  LayoutDashboard,
  Map as MapIcon,
  MessageSquareWarning,
  ReceiptText,
  SquareParking,
  Users,
} from 'lucide-react';

/**
 * Navigation per role — the single source for what each role can reach.
 * Labels are translation keys, resolved at render so switching language
 * relabels the sidebar without a reload.
 */
export const NAV_BY_ROLE = {
  admin: [
    { to: '/admin', labelKey: 'nav.dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/map', labelKey: 'nav.map', icon: MapIcon },
    { to: '/admin/parking', labelKey: 'nav.parkings', icon: SquareParking },
    { to: '/admin/reservations', labelKey: 'nav.reservations', icon: CalendarClock },
    { to: '/admin/payments', labelKey: 'nav.payments', icon: ReceiptText },
    { to: '/admin/revenue', labelKey: 'nav.revenue', icon: Banknote },
    { to: '/admin/accounts', labelKey: 'nav.accounts', icon: Users },
    { to: '/admin/complaints', labelKey: 'nav.complaints', icon: MessageSquareWarning },
  ],
  parking_owner: [
    { to: '/owner', labelKey: 'nav.dashboard', icon: LayoutDashboard, end: true },
    { to: '/owner/reservations', labelKey: 'nav.reservations', icon: CalendarClock },
    { to: '/owner/payments', labelKey: 'nav.payments', icon: ReceiptText },
    { to: '/owner/revenue', labelKey: 'nav.revenue', icon: Banknote },
    { to: '/owner/rewards', labelKey: 'nav.rewards', icon: Gift },
    { to: '/owner/complaints', labelKey: 'nav.complaints', icon: MessageSquareWarning },
  ],
};

/** Where each role belongs after signing in. */
export const HOME_BY_ROLE = {
  admin: '/admin',
  parking_owner: '/owner',
  technicien: '/mobile-only',
  user: '/mobile-only',
};

/** Translated role name, falling back to the raw value for an unknown role. */
export const roleLabel = (t, role) => (role ? t(`roles.${role}`, { defaultValue: role }) : '');
