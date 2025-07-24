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
        const res = await fetch(`${process.env.REACT_APP_API_URL || ''}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setUsers(data.data);
        } else {
          setError(data.error || 'Loading error');
        }
      } catch (e) {
        setError('Server error');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [success]); // refresh after creation

  // Création utilisateur
  const handleCreate = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.prenom || !form.email || !form.password) return setError('All fields are required');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL || ''}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('User created successfully');
        setForm({ prenom: '', email: '', password: '', role: 'user' });
        setShowCreateForm(false);
      } else {
        setError(data.error || 'Error during creation');
      }
    } catch (e) {
      setError('Server error');
    }
  };

  // Suppression utilisateur
  const handleDelete = async (id) => {
    setError('');
    setSuccess('');
    if (!window.confirm('Confirm deletion of this user?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL || ''}/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('User deleted successfully');
      } else {
        setError(data.error || 'Error during deletion');
      }
    } catch (e) {
      setError('Server error');
    }
  };

  // Design constants

  return (
    <div className="admin-container">
      <div className="admin-main-section">
        <h1 className="admin-title">User administration</h1>
        <div className="admin-title-bar" />
        <div className="admin-subtitle">User management for Hanalytics</div>
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-h2">Users</h2>
            <button type="button" className="admin-btn-create-user" onClick={()=>setShowCreateForm(s=>!s)}>Create a user</button>
          </div>
          {showCreateForm && (
            <div className="admin-create-form">
              <div className="admin-create-form-title">Create a user</div>
              <form onSubmit={handleCreate} className="admin-create-form-fields">
                <input
                  type="text"
                  placeholder="First name"
                  value={form.prenom}
                  onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                  className="admin-input"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="admin-input"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="admin-input"
                  required
                />
                <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} className="admin-select">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" className="admin-btn-create">Create</button>
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
                  <tr>{['First name','Email','Role','Created at','Last login','Status','Actions'].map(h=><th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {users.map(u=> (
                    <tr key={u.id}>
                      {[u.prenom,u.email,u.role,u.created_at,u.last_login].map((val,i)=><td key={i}>{val}</td>)}
                      <td><span className={u.is_active ? 'admin-status admin-status-actif' : 'admin-status admin-status-inactif'}>{u.is_active?'active':'inactive'}</span></td>
                      <td>
                        {u.id !== JSON.parse(localStorage.getItem('user')||'{}').id && (
                          <button type="button" className="admin-btn-delete" onClick={()=>handleDelete(u.id)}>Delete</button>
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
