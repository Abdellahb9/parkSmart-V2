import { useState, useEffect } from 'react';
import api from '../../api';

export default function ReservationsPage() {
  const [data, setData] = useState({ active: [], completed: [], overtime: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');

  useEffect(() => {
    api.get('/owner/reservations')
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

  const renderTable = (bookings, showOvertime = false) => (
    <table className="data-table">
      <thead>
        <tr>
          <th>Client</th>
          <th>Plaque</th>
          <th>Heures</th>
          <th>Email</th>
          <th>Téléphone</th>
          <th>Début</th>
          <th>Fin</th>
          {showOvertime && <th>Dépassement</th>}
        </tr>
      </thead>
      <tbody>
        {bookings.map((b) => {
          const overtime = showOvertime ? Math.max(0, Math.round((Date.now() - new Date(b.endTime)) / (1000 * 60))) : 0;
          return (
            <tr key={b._id}>
              <td style={{ fontWeight: '500' }}>{b.userId?.fullName || 'N/A'}</td>
              <td><span className="badge badge-primary">{b.carPlate}</span></td>
              <td>{b.totalHours}h</td>
              <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{b.userId?.email || 'N/A'}</td>
              <td style={{ fontSize: '13px' }}>{b.userId?.phone || 'N/A'}</td>
              <td style={{ fontSize: '13px' }}>{formatDate(b.startTime)}</td>
              <td style={{ fontSize: '13px' }}>{formatDate(b.endTime)}</td>
              {showOvertime && (
                <td>
                  <span className="badge badge-danger">{overtime} min</span>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div>
      <div className="page-header">
        <h1>Réservations</h1>
        <p>Suivi des réservations actives et historique</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button className={`btn ${tab === 'active' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('active')}>
          Actives ({data.active.length})
        </button>
        <button className={`btn ${tab === 'completed' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('completed')}>
          Terminées ({data.completed.length})
        </button>
        <button className={`btn ${tab === 'overtime' ? 'btn-danger' : 'btn-outline'}`} onClick={() => setTab('overtime')}>
          ⚠️ Dépassements ({data.overtime.length})
        </button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Chargement...</p>
          ) : tab === 'active' ? (
            data.active.length > 0 ? renderTable(data.active) : <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Aucune réservation active</p>
          ) : tab === 'completed' ? (
            data.completed.length > 0 ? renderTable(data.completed) : <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Aucune réservation terminée</p>
          ) : (
            data.overtime.length > 0 ? renderTable(data.overtime, true) : <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Aucun dépassement</p>
          )}
        </div>
      </div>
    </div>
  );
}
