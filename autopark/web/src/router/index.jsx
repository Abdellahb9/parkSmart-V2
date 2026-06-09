import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import LoginPage from '../features/auth/LoginPage';
import AdminLayout from '../features/admin/AdminLayout';
import AdminDashboard from '../features/admin/Dashboard';
import AdminMap from '../features/admin/MapPage';
import AdminAccounts from '../features/admin/AccountsPage';
import AdminParking from '../features/admin/ParkingPage';
import AdminOther from '../features/admin/OtherPage';
import OwnerLayout from '../features/owner/OwnerLayout';
import OwnerDashboard from '../features/owner/Dashboard';
import OwnerReservations from '../features/owner/ReservationsPage';
import OwnerRewards from '../features/owner/RewardsPage';
import OwnerOther from '../features/owner/OtherPage';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="map" element={<AdminMap />} />
          <Route path="accounts" element={<AdminAccounts />} />
          <Route path="parking" element={<AdminParking />} />
          <Route path="other" element={<AdminOther />} />
        </Route>

        {/* Owner Routes */}
        <Route path="/owner" element={
          <ProtectedRoute allowedRoles={['parking_owner']}>
            <OwnerLayout />
          </ProtectedRoute>
        }>
          <Route index element={<OwnerDashboard />} />
          <Route path="reservations" element={<OwnerReservations />} />
          <Route path="rewards" element={<OwnerRewards />} />
          <Route path="other" element={<OwnerOther />} />
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
