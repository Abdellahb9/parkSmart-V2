import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import AppShell from '../layouts/AppShell';
import { HOME_BY_ROLE } from '../layouts/navConfig';
import { Spinner } from '../components/ui';
import { Forbidden, MobileOnly, NotFound } from '../features/common/StatusPages';

import LoginPage from '../features/auth/LoginPage';
import AdminDashboard from '../features/admin/Dashboard';
import AdminMap from '../features/admin/MapPage';
import AdminAccounts from '../features/admin/AccountsPage';
import AdminParking from '../features/admin/ParkingPage';
import AdminReservations from '../features/admin/ReservationsPage';
import AdminComplaints from '../features/admin/ComplaintsPage';
import OwnerDashboard from '../features/owner/Dashboard';
import OwnerReservations from '../features/owner/ReservationsPage';
import OwnerRewards from '../features/owner/RewardsPage';
import OwnerComplaints from '../features/owner/OtherPage';
import PaymentsPage from '../features/common/PaymentsPage';
import RevenuePage from '../features/common/RevenuePage';
import DesignSystemPage from '../features/dev/DesignSystemPage';

function FullPageLoader() {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-dvh place-items-center bg-bg">
      <Spinner className="size-8 text-primary" label={t('status.loadingSession')} />
    </div>
  );
}

/**
 * Gates every private route on the role the SERVER reported.
 *
 * The cached user in localStorage is only a first-paint hint; hydrate()
 * replaces it with GET /auth/me, so editing storage no longer renders an
 * admin shell.
 */
function Protected({ allowed }) {
  const { user, hydrated } = useAuthStore();
  if (!hydrated) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowed && !allowed.includes(user.role)) return <Forbidden />;
  return <AppShell />;
}

function RoleHome() {
  const { user, hydrated } = useAuthStore();
  if (!hydrated) return <FullPageLoader />;
  return <Navigate to={user ? (HOME_BY_ROLE[user.role] ?? '/mobile-only') : '/login'} replace />;
}

function RequireSession({ children }) {
  const { user, hydrated } = useAuthStore();
  if (!hydrated) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function AppRouter() {
  const hydrate = useAuthStore((s) => s.hydrate);

  // Confirm the session against the API once, on load.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RoleHome />} />

        {/* Roles with no portal screens get an explanation, not a dead end. */}
        <Route
          path="/mobile-only"
          element={
            <RequireSession>
              <MobileOnly />
            </RequireSession>
          }
        />

        <Route element={<Protected allowed={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/map" element={<AdminMap />} />
          <Route path="/admin/parking" element={<AdminParking />} />
          <Route path="/admin/reservations" element={<AdminReservations />} />
          <Route path="/admin/payments" element={<PaymentsPage />} />
          <Route path="/admin/revenue" element={<RevenuePage />} />
          <Route path="/admin/accounts" element={<AdminAccounts />} />
          <Route path="/admin/complaints" element={<AdminComplaints />} />
        </Route>

        <Route element={<Protected allowed={['parking_owner']} />}>
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/owner/reservations" element={<OwnerReservations />} />
          <Route path="/owner/payments" element={<PaymentsPage />} />
          <Route path="/owner/revenue" element={<RevenuePage />} />
          <Route path="/owner/rewards" element={<OwnerRewards />} />
          <Route path="/owner/complaints" element={<OwnerComplaints />} />
        </Route>

        {/* Component gallery, development builds only */}
        {import.meta.env.DEV && <Route path="/dev/ui" element={<DesignSystemPage />} />}

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
