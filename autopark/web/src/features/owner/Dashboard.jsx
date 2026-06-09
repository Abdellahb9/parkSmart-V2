import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../../api';

const dayNames = ['', 'Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function OwnerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/owner/dashboard')
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Chargement...</div>;
  if (!stats) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>Erreur de chargement</div>;

  const dayChartData = stats.reservationsByDay.map(d => ({
    name: dayNames[d._id] || d._id,
    count: d.count,
  }));

  const hourChartData = stats.reservationsByHour.map(h => ({
    name: `${h._id}h`,
    count: h.count,
  }));

  return (
    <div>
      <div className="page-header">
        <h1>Tableau de bord</h1>
        <p>Statistiques de vos parkings</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="6" width="22" height="12" rx="2" /><path d="M1 10h22" /></svg>
          </div>
          <div className="stat-info">
            <h3>{stats.occupiedSpots} / {stats.totalSpots}</h3>
            <p>Places occupées</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
          </div>
          <div className="stat-info">
            <h3>{stats.revenueToday} MAD</h3>
            <p>Revenu aujourd'hui</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
          </div>
          <div className="stat-info">
            <h3>{stats.revenueTotal.toLocaleString()} MAD</h3>
            <p>Revenu total</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
          </div>
          <div className="stat-info">
            <h3>{stats.revenueThisMonth.toLocaleString()} MAD</h3>
            <p>Revenu ce mois</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          </div>
          <div className="stat-info">
            <h3>{stats.bestSpot ? `Place #${stats.bestSpot.spotNumber}` : 'N/A'}</h3>
            <p>Meilleure place</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
          </div>
          <div className="stat-info">
            <h3>{stats.reservationsToday} / {stats.reservationsThisMonth}</h3>
            <p>Réservations (jour / mois)</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
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
          <h3>Réservations par heure</h3>
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

      {/* Top 3 loyal users */}
      {stats.topLoyalUsers.length > 0 && (
        <div className="card">
          <div className="card-body">
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>🏆 Top 3 clients fidèles</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {stats.topLoyalUsers.map((lp, idx) => (
                <div key={lp._id} style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  background: idx === 0 ? 'rgba(255,193,7,0.08)' : '#F8FAFC',
                  border: `1px solid ${idx === 0 ? 'rgba(255,193,7,0.2)' : 'var(--border)'}`,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: '600' }}>{lp.userId?.fullName || 'N/A'}</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{lp.bookingCount} réservations</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
