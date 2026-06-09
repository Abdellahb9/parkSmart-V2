import { useState, useEffect } from 'react';
import api from '../../api';

export default function ParkingPage() {
  const [parkings, setParkings] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({
    name: '', ownerId: '', type: 'normal', latitude: '', longitude: '',
    totalSpots: '', pricePerHour: '', pricePerDay: '', commissionPercent: '10', address: '',
  });

  const fetchData = async () => {
    try {
      const [parkingsRes, usersRes] = await Promise.all([
        api.get('/parkings'),
        api.get('/admin/users'),
      ]);
      setParkings(parkingsRes.data);
      setOwners(usersRes.data.filter(u => u.role === 'parking_owner'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.post('/parkings', {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        totalSpots: parseInt(form.totalSpots),
        pricePerHour: parseFloat(form.pricePerHour),
        pricePerDay: parseFloat(form.pricePerDay) || 0,
        commissionPercent: parseFloat(form.commissionPercent),
      });
      setMessage({ type: 'success', text: 'Parking créé avec succès!' });
      setForm({ name: '', ownerId: '', type: 'normal', latitude: '', longitude: '', totalSpots: '', pricePerHour: '', pricePerDay: '', commissionPercent: '10', address: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur de création' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <h1>Parkings</h1>
          <p>Gérer tous les parkings du système</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Fermer' : '+ Ajouter un parking'}
        </button>
      </div>

      {message && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', background: message.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, color: message.type === 'success' ? 'var(--success)' : 'var(--danger)', fontSize: '13px' }}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="card animate-in" style={{ marginBottom: '20px' }}>
          <div className="card-body">
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>Nouveau parking</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                <div className="form-group">
                  <label className="form-label">Nom</label>
                  <input className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Propriétaire</label>
                  <select className="form-select" required value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
                    <option value="">Sélectionner...</option>
                    {owners.map(o => <option key={o._id} value={o._id}>{o.fullName} ({o.email})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="normal">Normal</option>
                    <option value="open_street">Voie publique</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Adresse</label>
                  <input className="form-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input className="form-input" type="number" step="any" required value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="27.1536" />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input className="form-input" type="number" step="any" required value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="-13.2033" />
                </div>
                <div className="form-group">
                  <label className="form-label">Nombre de places</label>
                  <input className="form-input" type="number" min="1" required value={form.totalSpots} onChange={(e) => setForm({ ...form, totalSpots: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Prix/heure (MAD)</label>
                  <input className="form-input" type="number" min="0" step="0.5" required value={form.pricePerHour} onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Prix/jour (MAD)</label>
                  <input className="form-input" type="number" min="0" step="0.5" value={form.pricePerDay} onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Commission (%)</label>
                  <input className="form-input" type="number" min="0" max="100" value={form.commissionPercent} onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Création...' : 'Créer le parking'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Parkings list */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Chargement...</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Places</th>
                  <th>Disponibles</th>
                  <th>Prix/h</th>
                  <th>Commission</th>
                  <th>Propriétaire</th>
                </tr>
              </thead>
              <tbody>
                {parkings.map((p) => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: '600' }}>{p.name}</td>
                    <td>
                      <span className={`badge ${p.type === 'normal' ? 'badge-primary' : 'badge-warning'}`}>
                        {p.type === 'normal' ? 'Normal' : 'Voie publique'}
                      </span>
                    </td>
                    <td>{p.totalSpots}</td>
                    <td>
                      <span style={{ color: p.availableSpots > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
                        {p.availableSpots}
                      </span>
                    </td>
                    <td>{p.pricePerHour} MAD</td>
                    <td>{p.commissionPercent}%</td>
                    <td style={{ fontSize: '13px' }}>{p.ownerId?.fullName || 'N/A'}</td>
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
