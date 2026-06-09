import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { path: '/admin/map', label: 'Carte', icon: '🗺️' },
  { path: '/admin/accounts', label: 'Comptes', icon: '👤' },
  { path: '/admin/parking', label: 'Parkings', icon: '🅿️' },
  { path: '/admin/other', label: 'Autre', icon: '⚙️' },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">AP</div>
          <div className="sidebar-brand">
            <h2>AutoPark</h2>
            <span>Administration</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-profile">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-profile-info">
              <h4>{user?.fullName}</h4>
              <span>Admin</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-link"
            style={{ marginTop: '12px', color: '#EF4444' }}
          >
            <span style={{ fontSize: '18px' }}>🚪</span>
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="main-content animate-in">
        <Outlet />
      </main>
    </div>
  );
}
