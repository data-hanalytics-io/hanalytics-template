import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';
import LoadingPage from '../components/ui/LoadingPage';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({ prenom: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Protection : rediriger si pas admin
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [navigate]);

  // Charger les utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setUsers(data.data);
        } else {
          setError(data.error || 'Erreur de chargement');
        }
      } catch (e) {
        setError('Erreur serveur');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [success]); // refresh après création

  // Création utilisateur
  const handleCreate = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.prenom || !form.email || !form.password) return setError('Tous les champs sont requis');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Utilisateur créé avec succès');
        setForm({ prenom: '', email: '', password: '', role: 'user' });
        setShowCreateForm(false);
      } else {
        setError(data.error || 'Erreur lors de la création');
      }
    } catch (e) {
      setError('Erreur serveur');
    }
  };

  // Suppression utilisateur
  const handleDelete = async (id) => {
    setError('');
    setSuccess('');
    if (!window.confirm('Confirmer la suppression de cet utilisateur ?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Utilisateur supprimé avec succès');
      } else {
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch (e) {
      setError('Erreur serveur');
    }
  };

  // Design constants

  return (
    <div className="admin-container">
      <div className="admin-main-section">
        <h1 className="admin-title">Administration des utilisateurs</h1>
        <div className="admin-title-bar" />
        <div className="admin-subtitle">Gestion des utilisateurs Hanalytics</div>
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-h2">Utilisateurs</h2>
            <button type="button" className="admin-btn-create-user" onClick={()=>setShowCreateForm(s=>!s)}>Créer un utilisateur</button>
          </div>
          {showCreateForm && (
            <div className="admin-create-form">
              <div className="admin-create-form-title">Créer un utilisateur</div>
              <form onSubmit={handleCreate} className="admin-create-form-fields">
                {['Prénom','Email','Mot de passe'].map((ph, i) => (
                  <input
                    key={i}
                    type={ph==='Email'?'email':ph==='Mot de passe'?'password':'text'}
                    placeholder={ph}
                    value={i===0?form.prenom:i===1?form.email:form.password}
                    onChange={e=>setForm(f=>({ ...f, [i===0?'prenom':i===1?'email':'password']:e.target.value }))}
                    className="admin-input"
                    required
                  />
                ))}
                <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} className="admin-select">
                  <option value="user">Utilisateur</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" className="admin-btn-create">Créer</button>
              </form>
              {error && <div className="admin-error">{error}</div>}
              {success && <div className="admin-success">{success}</div>}
            </div>
          )}
          {loading ? (
            <LoadingPage />
          ) : error && !showCreateForm ? (
            <div className="admin-error">{error}</div>
          ) : (
            <div className="admin-table-section">
              <table className="admin-table">
                <thead>
                  <tr>{['PRÉNOM','EMAIL','RÔLE','CRÉÉ LE','DERNIÈRE CONNEXION','STATUT','ACTIONS'].map(h=><th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {users.map(u=> (
                    <tr key={u.id}>
                      {[u.prenom,u.email,u.role,u.created_at,u.last_login].map((val,i)=><td key={i}>{val}</td>)}
                      <td><span className={u.is_active ? 'admin-status admin-status-actif' : 'admin-status admin-status-inactif'}>{u.is_active?'actif':'inactif'}</span></td>
                      <td>
                        {u.id !== JSON.parse(localStorage.getItem('user')||'{}').id && (
                          <button type="button" className="admin-btn-delete" onClick={()=>handleDelete(u.id)}>Supprimer</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
