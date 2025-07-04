import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const mainBg = '#F5F5F5';
  const fontFamily = 'Inter, Arial, sans-serif';
  const radius = 12;
  const titleColor = '#B5A2D8';
  const subtitleColor = '#2E1065';
  const bodyColor = subtitleColor;
  const cardBg = 'rgba(199,183,227,0.15)';
  const cardShadow = '4px 5px 6px rgba(181,162,216,0.35)';
  const innerBg = 'rgba(255,255,255,0.5)';
  const innerShadow = '8px 6px 15px rgba(181,162,216,0.25)';
  const inputBg = '#ECE6F0';
  const h1 = { fontSize: 40, fontWeight: 900 };
  const h2 = { fontSize: 28, fontWeight: 700 };
  const subtitle = { fontSize: 14, fontWeight: 500 };
  const text = { fontSize: 14, fontWeight: 400 };
  const thStyle = { padding: 18, fontSize: 14, fontWeight: 700, color: subtitleColor, textTransform: 'uppercase', textAlign: 'left' };
  const theadBg = '#ECE6F0';
  const tagBtn = { background: 'rgba(155,111,157,0.15)', color: '#9B6F9D', border: 'none', borderRadius: radius, padding: '4px 12px', fontSize: 12, fontWeight: 500, fontFamily, cursor: 'pointer' };
  const actionBtn = { border: 'none', borderRadius: 0, padding: '8px 16px', fontSize: 12, fontWeight: 700, fontFamily, cursor: 'pointer' };
  const activeBg = 'rgba(108,211,134,0.15)';
  const activeColor = '#6CD386';
  const deleteBg = 'rgba(255,63,82,0.15)';
  const deleteColor = '#FF3F52';

  return (
    <div style={{ minHeight: '100vh', background: mainBg, fontFamily }}>
      <div style={{ maxWidth: 1200, margin: '40px auto', background: '#FFFFFF', borderRadius: radius, boxShadow: innerShadow, padding: 48 }}>
        <h1 style={{ ...h1, color: titleColor, textAlign: 'center', margin: 0 }}>Administration des utilisateurs</h1>
        <div style={{ width: 60, height: 2, margin: '8px auto', background: 'linear-gradient(to right, rgba(181,162,216,0) 0%, rgba(181,162,216,1) 50%, rgba(181,162,216,0) 100%)' }} />
        <div style={{ ...subtitle, color: subtitleColor, textAlign: 'center', margin: '8px 0 24px' }}>Gestion des utilisateurs Hanalytics</div>
        <div style={{ background: cardBg, borderRadius: radius, boxShadow: cardShadow, padding: 40, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ ...h2, color: titleColor, textTransform: 'uppercase', margin: 0 }}>Utilisateurs</h2>
            <button onClick={()=>setShowCreateForm(s=>!s)} style={tagBtn}>Créer un utilisateur</button>
          </div>
          {showCreateForm && (
            <div style={{ background: cardBg, borderRadius: radius, boxShadow: cardShadow, padding: 32, marginBottom: 24 }}>
              <div style={{ ...subtitle, fontWeight: 900, color: titleColor, opacity: 0.5, marginBottom: 18, textTransform: 'uppercase' }}>Créer un utilisateur</div>
              <form onSubmit={handleCreate} style={{ display: 'flex', gap: 24 }}>
                {['Prénom','Email','Mot de passe'].map((ph, i) => (
                  <input
                    key={i}
                    type={ph==='Email'?'email':ph==='Mot de passe'?'password':'text'}
                    placeholder={ph}
                    value={i===0?form.prenom:i===1?form.email:form.password}
                    onChange={e=>setForm(f=>({ ...f, [i===0?'prenom':i===1?'email':'password']:e.target.value }))}
                    style={{ flex:1, padding:16, background: inputBg, border: 'none', borderRadius: radius, fontSize:14, fontFamily, color: subtitleColor }}
                    required
                  />
                ))}
                <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} style={{ flex:1, padding:16, background: inputBg, border:'none', borderRadius:radius, fontSize:14, fontFamily, color:subtitleColor }}>
                  <option value="user">Utilisateur</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" style={{ marginLeft: 16, background:titleColor, color:'#FFF', border:'none', borderRadius:radius, padding:'12px 32px', fontSize:16, fontWeight:700, fontFamily, cursor:'pointer', boxShadow:'0 2px 8px rgba(181,162,216,0.15)' }}>Créer</button>
              </form>
              {error && <div style={{ marginTop:10, color: deleteColor, fontWeight:700, fontSize:14 }}>{error}</div>}
              {success && <div style={{ marginTop:10, color: activeColor, fontWeight:700, fontSize:14 }}>{success}</div>}
            </div>
          )}
          {loading ? (
            <LoadingPage />
          ) : error && !showCreateForm ? (
            <div style={{ color: deleteColor, fontWeight:700, fontSize:14 }}>{error}</div>
          ) : (
            <div style={{ background: innerBg, borderRadius: radius, boxShadow: innerShadow, padding: 32 }}>
              <table style={{ width:'100%', borderCollapse:'separate', fontFamily, borderRadius:radius, overflow:'hidden' }}>
                <thead style={{ background: theadBg }}>
                  <tr>{['PRÉNOM','EMAIL','RÔLE','CRÉÉ LE','DERNIÈRE CONNEXION','STATUT','ACTIONS'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {users.map(u=> (
                    <tr key={u.id}>
                      {[u.prenom,u.email,u.role,u.created_at,u.last_login].map((val,i)=><td key={i} style={{ padding:18, ...text, color: bodyColor }}>{val}</td>)}
                      <td style={{ padding:18 }}><span style={{ ...actionBtn, background: u.is_active?activeBg:deleteBg, color: u.is_active?activeColor:deleteColor }}>{u.is_active?'actif':'inactif'}</span></td>
                      <td style={{ padding:18 }}>
                        {u.id !== JSON.parse(localStorage.getItem('user')||'{}').id && (
                          <button onClick={()=>handleDelete(u.id)} style={{ ...actionBtn, background:deleteBg, color:deleteColor }}>Supprimer</button>
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
