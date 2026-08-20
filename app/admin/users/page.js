'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Shield, Plus, Edit2, Trash2, ArrowLeft, Check, X, Lock, Unlock, Clock } from 'lucide-react';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'viewer',
    isActive: true,
    autoLogoutEnabled: true,
    autoLogoutMinutes: 30
  });

  const [deletionPin, setDeletionPin] = useState('1234');

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        setUsers(await res.json());
      } else if (res.status === 403) {
        router.push('/');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      if (data.deletionPin) setDeletionPin(data.deletionPin);
    }).catch(console.error);
    fetchUsers();
  }, []);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        role: user.role,
        isActive: user.isActive,
        autoLogoutEnabled: user.autoLogoutEnabled !== false,
        autoLogoutMinutes: user.autoLogoutMinutes || 30
      });
    } else {
      setEditingUser(null);
      setFormData({ username: '', password: '', role: 'viewer', isActive: true, autoLogoutEnabled: true, autoLogoutMinutes: 30 });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const payload = { ...formData };
      if (editingUser && !payload.password) {
        delete payload.password; // Non inviare la password se è vuota in modifica
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchUsers();
      } else {
        const errorData = await res.json();
        alert(`Errore: ${errorData.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Errore di rete");
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Errore");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (user) => {
    const input = window.prompt(`🔐 ATTENZIONE! Inserisci il PIN di sicurezza per eliminare l'utente ${user.username}:`);
    if (input === null) return;
    if (input.trim() !== String(deletionPin || '1234').trim()) {
      alert("❌ PIN di Sicurezza errato! Eliminazione annullata.");
      return;
    }
    if (window.confirm(`Sei sicuro di voler eliminare l'utente ${user.username}? Questa azione è irreversibile.`)) {
      try {
        const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchUsers();
        } else {
          const err = await res.json();
          alert(err.error || "Errore");
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const roleLabels = {
    admin: 'Amministratore',
    editor: 'Operatore',
    viewer: 'Visitatore (Sola lettura)'
  };

  const roleColors = {
    admin: 'var(--primary-color)',
    editor: '#059669', // Emerald
    viewer: '#64748b' // Slate
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Caricamento in corso...</div>;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)' }}>
      <div className="header" style={{ padding: '1rem', background: 'white', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn" onClick={() => router.push('/')} style={{ background: 'transparent', color: 'var(--text-color)', border: '1px solid var(--border-color)', padding: '0.5rem' }}>
          <ArrowLeft size={20} />
        </button>
        <Shield size={28} color="var(--primary-color)" />
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Gestione Utenti e Accessi</h1>
      </div>

      <div style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ margin: 0, color: 'var(--text-color)' }}>Elenco Utenti</h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn" onClick={() => router.push('/admin/sessions')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155' }}>
              <Clock size={18} color="#6366f1" /> Registro Accessi
            </button>
            <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} /> Nuovo Utente
            </button>
          </div>
        </div>

        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '600px' }}>
            <thead>
              <tr>
                <th style={{ padding: '1rem' }}>Username</th>
                <th>Ruolo</th>
                <th style={{ textAlign: 'center' }}>Stato</th>
                <th style={{ textAlign: 'center' }}>Auto-Logout</th>
                <th style={{ textAlign: 'right', padding: '1rem' }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{user.username}</td>
                  <td>
                    <span style={{ 
                      display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.5rem', 
                      borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold',
                      backgroundColor: `${roleColors[user.role]}15`, color: roleColors[user.role]
                    }}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {user.isActive ? (
                      <span style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        <Check size={16} /> Attivo
                      </span>
                    ) : (
                      <span style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        <Lock size={16} /> Bloccato
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '0.85rem', color: '#475569' }}>
                    {user.autoLogoutEnabled !== false ? (
                      <span style={{ color: '#0284c7', fontWeight: '500' }}>⏱️ {user.autoLogoutMinutes || 30} Min</span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Disattivato</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn" style={{ padding: '0.4rem', border: '1px solid var(--border-color)', background: 'white' }} onClick={() => handleToggleStatus(user)} title={user.isActive ? "Blocca Accesso" : "Sblocca Accesso"}>
                        {user.isActive ? <Lock size={16} color="#64748b" /> : <Unlock size={16} color="var(--success-color)" />}
                      </button>
                      <button className="btn" style={{ padding: '0.4rem', border: '1px solid var(--border-color)', background: 'white' }} onClick={() => handleOpenModal(user)} title="Modifica Utente">
                        <Edit2 size={16} color="var(--primary-color)" />
                      </button>
                      <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={() => handleDelete(user)} title="Elimina Utente">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Nessun utente trovato</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>{editingUser ? 'Modifica Utente' : 'Nuovo Utente'}</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Nome Utente</label>
                <input 
                  type="text" 
                  value={formData.username} 
                  onChange={e => setFormData({...formData, username: e.target.value})} 
                  disabled={!!editingUser}
                  required 
                  style={{ width: '100%', padding: '0.75rem 0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '1rem' }}
                />
              </div>

              <div className="form-group">
                <label>{editingUser ? 'Nuova Password (lascia vuoto per non cambiare)' : 'Password'}</label>
                <input 
                  type="password" 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  required={!editingUser}
                  style={{ width: '100%', padding: '0.75rem 0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '1rem' }}
                />
              </div>

              <div className="form-group">
                <label>Livello di Accesso (Ruolo)</label>
                <select 
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem 0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '1rem' }}
                >
                  <option value="admin">Amministratore (Pieno accesso)</option>
                  <option value="editor">Operatore (Aggiunge/Modifica Vini)</option>
                  <option value="viewer">Visitatore (Solo Lettura, nessuna modifica)</option>
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={formData.isActive} 
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="isActive" style={{ margin: 0, cursor: 'pointer' }}>Account Attivo</label>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="autoLogoutEnabled" 
                    checked={formData.autoLogoutEnabled} 
                    onChange={e => setFormData({...formData, autoLogoutEnabled: e.target.checked})}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <label htmlFor="autoLogoutEnabled" style={{ margin: 0, cursor: 'pointer', fontWeight: 'bold' }}>
                    Auto-Logout Inattività (30 min)
                  </label>
                </div>
                {formData.autoLogoutEnabled && (
                  <div className="form-group" style={{ marginTop: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Minuti di inattività prima del logout:</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="1440" 
                      value={formData.autoLogoutMinutes} 
                      onChange={e => setFormData({...formData, autoLogoutMinutes: Number(e.target.value)})}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', marginTop: '0.25rem' }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)} style={{ flex: 1, border: '1px solid var(--border-color)', background: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                  Annulla
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                  {editingUser ? 'Salva Modifiche' : 'Crea Utente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
