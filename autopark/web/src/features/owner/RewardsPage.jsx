import { useState, useEffect } from 'react';
import api from '../../api';

const typeLabels = {
  free_wash: '🚿 Lavage auto',
  discount_coupon: '🎫 Bon d\'achat',
  free_vidange: '🔧 Vidange',
  free_reservation: '🅿️ Réservation gratuite',
};

export default function RewardsPage() {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/owner/rewards')
      .then(({ data }) => setRewards(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Récompenses</h1>
        <p>Programme de fidélité pour vos clients</p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>Chargement...</p>
      ) : rewards.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Aucune récompense configurée</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {rewards.map((r) => (
            <div key={r._id} className="card" style={{ transition: 'var(--transition)' }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{r.title}</h3>
                  <span style={{ fontSize: '28px' }}>{typeLabels[r.type]?.split(' ')[0] || '🎁'}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>{r.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-primary">{r.requiredBookings} réservations requises</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {r.parkingId ? r.parkingId.name : 'Global'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
