import { useState, useEffect } from 'react';
import api from '../../api';

export default function OtherPage() {
  const [complaints, setComplaints] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [tab, setTab] = useState('complaints');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [compRes] = await Promise.all([
          api.get('/admin/complaints'),
        ]);
        setComplaints(compRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleResolve = async (id) => {
    try {
      await api.patch(`/complaints/${id}/resolve`);
      setComplaints(complaints.map(c => c._id === id ? { ...c, status: 'resolved' } : c));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Autre</h1>
        <p>Réclamations et promotions</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button className={`btn ${tab === 'complaints' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('complaints')}>
          Réclamations ({complaints.length})
        </button>
        <button className={`btn ${tab === 'rewards' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('rewards')}>
          Promotions
        </button>
      </div>

      {tab === 'complaints' && (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Chargement...</p>
            ) : complaints.length === 0 ? (
              <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Aucune réclamation</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Parking</th>
                    <th>Message</th>
                    <th>Statut</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c._id}>
                      <td style={{ fontWeight: '500' }}>{c.userId?.fullName || 'N/A'}</td>
                      <td>{c.parkingId?.name || 'N/A'}</td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.message}</td>
                      <td>
                        <span className={`badge ${c.status === 'open' ? 'badge-warning' : 'badge-success'}`}>
                          {c.status === 'open' ? 'En cours' : 'Résolu'}
                        </span>
                      </td>
                      <td>
                        {c.status === 'open' && (
                          <button className="btn btn-sm btn-primary" onClick={() => handleResolve(c._id)}>
                            Résoudre
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'rewards' && (
        <div className="card">
          <div className="card-body">
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
              La gestion des promotions sera disponible prochainement.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
