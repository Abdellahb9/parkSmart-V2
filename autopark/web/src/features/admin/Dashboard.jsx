import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import api from '../../api';

const dayNames = ['', 'Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/admin/stats');
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Chargement...</div>;
  if (!stats) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>Erreur de chargement</div>;

  const revenueChartData = stats.revenuePerMonth.map(r => ({
    name: `${r._id.month}/${r._id.year}`,
    revenue: r.revenue,
    count: r.count,
  }));

  const dayChartData = stats.reservationsByDay.map(d => ({
    name: dayNames[d._id] || d._id,
    count: d.count,
  }));

  const hourChartData = stats.peakHours.map(h => ({
    name: `${h._id}h`,
    count: h.count,
  }));

  return (
    <div>
      <div className="page-header">
        <h1>Tableau de bord</h1>
        <p>Vue d'ensemble du système AutoPark</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
          </div>
          <div className="stat-info">
            <h3>{stats.totalRevenue.toLocaleString()} MAD</h3>
            <p>Revenu total</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
          </div>
          <div className="stat-info">
            <h3>{stats.totalReservations}</h3>
            <p>Réservations totales</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="6" width="22" height="12" rx="2" /><path d="M1 10h22" /></svg>
          </div>
          <div className="stat-info">
            <h3>{stats.totalParkings}</h3>
            <p>Parkings partenaires</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
          </div>
          <div className="stat-info">
            <h3>{stats.parkingsWithReservationsToday}</h3>
            <p>Actifs aujourd'hui</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10M6 20V4M18 20v-6" /></svg>
          </div>
          <div className="stat-info">
            <h3>{stats.reservationsToday}</h3>
            <p>Réservations aujourd'hui</p>
          </div>
        </div>

        {stats.bestParking && (
          <div className="stat-card">
            <div className="stat-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            </div>
            <div className="stat-info">
              <h3>{stats.bestParking.name}</h3>
              <p>Meilleur parking ({stats.bestParking.revenue} MAD)</p>
            </div>
          </div>
        )}

        {stats.worstParking && (
          <div className="stat-card">
            <div className="stat-icon red">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01" /></svg>
            </div>
            <div className="stat-info">
              <h3>{stats.worstParking.name}</h3>
              <p>Moins performant ({stats.worstParking.revenue} MAD)</p>
            </div>
          </div>
        )}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Revenu par mois</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `${v} MAD`} />
              <Area type="monotone" dataKey="revenue" stroke="#3A6BC4" fill="rgba(58,107,196,0.15)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Réservations par jour</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dayChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3A6BC4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Heures de pointe</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={hourChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#FFC107" strokeWidth={2} dot={{ fill: '#FFC107', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
