import { useState, useEffect } from 'react';
import api from '../../api';

export default function OtherPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/owner/complaints')
      .then(({ data }) => setComplaints(data))
      .catch(console.error)
      .finally(() => setLoading(false));
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
        <h1>Réclamations</h1>
        <p>Réclamations des clients concernant vos parkings</p>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Chargement...</p>
          ) : complaints.length === 0 ? (
            <p style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Aucune réclamation</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Parking</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c._id}>
                    <td style={{ fontWeight: '500' }}>{c.userId?.fullName || 'N/A'}</td>
                    <td>{c.parkingId?.name || 'N/A'}</td>
                    <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.message}
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                    </td>
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
    </div>
  );
}
