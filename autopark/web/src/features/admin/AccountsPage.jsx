import { useState, useEffect } from 'react';
import api from '../../api';

export default function AccountsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', CNE: '', role: 'parking_owner' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = filter === 'all' ? users : users.filter(u => u.role === filter);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.post('/admin/users', form);
      setMessage({ type: 'success', text: 'Compte créé avec succès!' });
      setForm({ fullName: '', email: '', password: '', phone: '', CNE: '', role: 'parking_owner' });
      fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur de création' });
    } finally {
      setSaving(false);
    }
  };

  const roleLabels = { admin: 'Admin', parking_owner: 'Propriétaire', technicien: 'Technicien', user: 'Utilisateur' };
  const roleBadge = { admin: 'badge-danger', parking_owner: 'badge-primary', technicien: 'badge-warning', user: 'badge-success' };

  return (
    <div>
      <div className="page-header">
        <h1>Gestion des comptes</h1>
        <p>Créer et gérer les comptes propriétaires et techniciens</p>
      </div>

      <div className="two-panel sidebar-list">
        {/* Left: Users list */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Tous les comptes ({filteredUsers.length})</h3>
              <select
                className="form-select"
                style={{ width: 'auto' }}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Tous</option>
                <option value="admin">Admin</option>
                <option value="parking_owner">Propriétaire</option>
                <option value="technicien">Technicien</option>
                <option value="user">Utilisateur</option>
              </select>
            </div>

            {loading ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>Chargement...</p>
            ) : (
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Rôle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u._id}>
                        <td style={{ fontWeight: '500' }}>{u.fullName}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{u.email}</td>
                        <td><span className={`badge ${roleBadge[u.role]}`}>{roleLabels[u.role]}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Create account form */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>Créer un compte</h3>

            {message && (
              <div className={message.type === 'success' ? 'badge-success' : 'login-error'} style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', background: message.type === 'success' ? 'rgba(16,185,129,0.08)' : undefined, border: message.type === 'success' ? '1px solid rgba(16,185,129,0.2)' : undefined, color: message.type === 'success' ? 'var(--success)' : undefined, fontSize: '13px' }}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nom complet</label>
                <input className="form-input" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">CNE</label>
                <input className="form-input" value={form.CNE} onChange={(e) => setForm({ ...form, CNE: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <input className="form-input" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Type de compte</label>
                <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="parking_owner">Propriétaire de parking</option>
                  <option value="technicien">Technicien</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
                {saving ? 'Création...' : 'Créer le compte'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
