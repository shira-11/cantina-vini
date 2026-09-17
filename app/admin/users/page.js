'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Shield, Plus, UserPlus, Edit2, Trash2, ArrowLeft, Check, X, Lock, Unlock, Clock, Eye, EyeOff, KeyRound, AlertTriangle } from 'lucide-react';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Sezioni e Protezione Password Admin
  const [activeTab, setActiveTab] = useState('regular'); // 'regular' (Operatori/Visitatori) | 'admins' (Amministratori)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'viewer',
    isActive: true,
    autoLogoutEnabled: true,
    autoLogoutMinutes: 30,
    maxDevices: 2,
    allowedLocationsType: 'ALL',
    allowedLocationsList: []
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
    fetch('/api/locations').then(r => r.json()).then(data => {
      setLocations(Array.isArray(data) ? data : []);
    }).catch(console.error);
    fetchUsers();
  }, []);

  // Gestione Sblocco Sezione Admin con Password
  const handleVerifyAdminPassword = async (e) => {
    e.preventDefault();
    if (!adminPasswordInput) return;
    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch('/api/admin/users/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPasswordInput })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAdminUnlocked(true);
        setIsAuthModalOpen(false);
        setActiveTab('admins');
        setAdminPasswordInput('');
        setAuthError('');
      } else {
        setAuthError(data.error || '🔑 Password errata. Accesso negato.');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Errore di connessione durante la verifica.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOpenAdminTab = () => {
    if (isAdminUnlocked) {
      setActiveTab('admins');
    } else {
      setAdminPasswordInput('');
      setAuthError('');
      setShowAuthPassword(false);
      setIsAuthModalOpen(true);
    }
  };

  const handleOpenModal = (user = null, forceAdminRole = false) => {
    setShowPassword(false);
    setIsCreatingAdmin(forceAdminRole || (user && user.role === 'admin'));

    let locType = 'ALL';
    let locList = [];
    if (user && user.allowedLocations && user.allowedLocations !== 'ALL') {
      try {
        const val = user.allowedLocations;
        const parsed = typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))
          ? JSON.parse(val)
          : (Array.isArray(val) ? val : [val]);
        
        if (Array.isArray(parsed) && parsed.length > 0) {
          locType = 'SPECIFIC';
          locList = parsed;
        } else if (typeof val === 'string' && val.trim().length > 0 && val !== 'ALL') {
          locType = 'SPECIFIC';
          locList = [val];
        }
      } catch (e) {
        if (typeof user.allowedLocations === 'string' && user.allowedLocations.trim().length > 0) {
          locType = 'SPECIFIC';
          locList = [user.allowedLocations];
        }
      }
    }

    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        role: user.role,
        isActive: user.isActive,
        autoLogoutEnabled: user.autoLogoutEnabled !== false,
        autoLogoutMinutes: user.autoLogoutMinutes || 30,
        maxDevices: user.maxDevices ?? 2,
        canAccessInventory: (user.canAccessInventory === 0 || user.canAccessInventory === false || user.canAccessInventory === '0') ? false : true,
        allowedLocationsType: locType,
        allowedLocationsList: locList
      });
    } else {
      setEditingUser(null);
      setFormData({ 
        username: '', 
        password: '', 
        role: forceAdminRole ? 'admin' : 'viewer', 
        isActive: true, 
        autoLogoutEnabled: true, 
        autoLogoutMinutes: 30, 
        maxDevices: 2,
        canAccessInventory: true,
        allowedLocationsType: 'ALL',
        allowedLocationsList: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const payload = { 
        ...formData,
        allowedLocations: formData.allowedLocationsType === 'ALL'
          ? 'ALL'
          : JSON.stringify(formData.allowedLocationsList)
      };
      delete payload.allowedLocationsType;
      delete payload.allowedLocationsList;

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

  // Separazione Utenti Normali (Visitatori/Operatori) da Amministratori
  const regularUsers = users.filter(u => u.role !== 'admin');
  const adminUsers = users.filter(u => u.role === 'admin');

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Caricamento in corso...</div>;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)' }}>
      {/* Header Pagina */}
      <div className="header" style={{ padding: '1rem', background: 'white', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn" style={{ padding: '0.4rem 0.8rem', background: '#f1f5f9', border: '1px solid var(--border-color)' }} onClick={() => router.push('/')}>
          <ArrowLeft size={16} style={{ marginRight: '0.4rem' }} /> Torna alla Cantina
        </button>
        <h1 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={20} color="var(--primary-color)" /> Gestione Utenti e Autorizzazioni
        </h1>
      </div>

      <div style={{ flex: 1, padding: '1.5rem', maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
        
        {/* Selettore Sezioni Tab (Visitatori/Operatori vs Sezione Riservata Admin) */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('regular')}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'regular' ? '#0f172a' : '#f1f5f9',
              color: activeTab === 'regular' ? 'white' : '#475569',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <Users size={18} /> Visitatori & Operatori ({regularUsers.length})
          </button>

          <button
            onClick={handleOpenAdminTab}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              border: isAdminUnlocked ? '2px solid #3b82f6' : '1px solid #cbd5e1',
              backgroundColor: activeTab === 'admins' ? '#1e1b4b' : (isAdminUnlocked ? '#eff6ff' : '#f8fafc'),
              color: activeTab === 'admins' ? 'white' : (isAdminUnlocked ? '#1d4ed8' : '#64748b'),
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            {isAdminUnlocked ? <Unlock size={18} color="#2563eb" /> : <Lock size={18} color="#dc2626" />}
            Sezione Riservata Admin {isAdminUnlocked ? `(${adminUsers.length})` : '🔒 (Protetta)'}
          </button>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <button className="btn" style={{ background: '#f1f5f9', border: '1px solid var(--border-color)' }} onClick={() => router.push('/admin/sessions')}>
              <Clock size={16} style={{ marginRight: '0.4rem' }} /> Registro Accessi
            </button>
            {activeTab === 'regular' ? (
              <button className="btn btn-primary" onClick={() => handleOpenModal(null, false)}>
                <UserPlus size={16} style={{ marginRight: '0.4rem' }} /> Nuovo Utente
              </button>
            ) : (
              <button className="btn" style={{ backgroundColor: '#4338ca', color: 'white', fontWeight: 'bold' }} onClick={() => handleOpenModal(null, true)}>
                <Shield size={16} style={{ marginRight: '0.4rem' }} /> + Nuovo Amministratore
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: OPERATORI E VISITATORI */}
        {activeTab === 'regular' && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Elenco Operatori e Visitatori</h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Gestisci gli account per gli operatori di magazzino ed i clienti/visitatori in sola lettura.
              </p>
            </div>

            <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: '#64748b' }}>
                    <th style={{ padding: '1rem' }}>Username</th>
                    <th>Ruolo</th>
                    <th style={{ textAlign: 'center' }}>Stato Account</th>
                    <th style={{ textAlign: 'center' }}>Accesso Cantine</th>
                    <th style={{ textAlign: 'center' }}>Auto-Logout</th>
                    <th style={{ textAlign: 'center' }}>Dispositivi Collegati</th>
                    <th style={{ textAlign: 'right', padding: '1rem' }}>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {regularUsers.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>{user.username}</td>
                      <td>
                        <span style={{ 
                          display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.6rem', 
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
                      <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                        {(() => {
                          if (!user.allowedLocations || user.allowedLocations === 'ALL') {
                            return (
                              <span style={{ color: '#059669', backgroundColor: '#d1fae5', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' }}>
                                🏰 Tutte le Cantine
                              </span>
                            );
                          }
                          try {
                            const list = JSON.parse(user.allowedLocations);
                            if (Array.isArray(list) && list.length > 0) {
                              return (
                                <span title={list.join(', ')} style={{ color: '#4338ca', backgroundColor: '#e0e7ff', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold', cursor: 'help' }}>
                                  🏰 {list.length} {list.length === 1 ? 'Cantina' : 'Cantine'}
                                </span>
                              );
                            }
                          } catch(e) {}
                          return (
                            <span style={{ color: '#059669', backgroundColor: '#d1fae5', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' }}>
                              🏰 Tutte le Cantine
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '0.85rem', color: '#475569' }}>
                        {user.autoLogoutEnabled !== false ? (
                          <span style={{ color: '#0284c7', fontWeight: '500' }}>⏱️ {user.autoLogoutMinutes || 30} Min</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Disattivato</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                        <span style={{ 
                          fontWeight: 'bold', 
                          color: (user.activeDevicesCount || 0) >= (user.maxDevices || 2) ? '#e11d48' : '#059669',
                          backgroundColor: (user.activeDevicesCount || 0) >= (user.maxDevices || 2) ? '#ffe4e6' : '#d1fae5',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px'
                        }}>
                          📱 {user.activeDevicesCount || 0} / {user.maxDevices || 2} max
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button className="btn" style={{ padding: '0.4rem', border: '1px solid var(--border-color)', background: 'white' }} onClick={() => handleToggleStatus(user)} title={user.isActive ? "Blocca Accesso" : "Sblocca Accesso"}>
                            {user.isActive ? <Lock size={16} color="#64748b" /> : <Unlock size={16} color="var(--success-color)" />}
                          </button>
                          <button className="btn" style={{ padding: '0.4rem', border: '1px solid var(--border-color)', background: 'white' }} onClick={() => handleOpenModal(user, false)} title="Modifica Utente">
                            <Edit2 size={16} color="var(--primary-color)" />
                          </button>
                          <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={() => handleDelete(user)} title="Elimina Utente">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {regularUsers.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Nessun utente/operatore trovato</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SEZIONE RISERVATA AMMINISTRATORI (PROTETTA DA PASSWORD) */}
        {activeTab === 'admins' && isAdminUnlocked && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', backgroundColor: '#e0e7ff', padding: '0.85rem 1.25rem', borderRadius: '10px', border: '1px solid #c7d2fe' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#312e81', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🛡️ Sezione Riservata Account Amministratore (Sbloccata)
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.825rem', color: '#4338ca' }}>
                  Ciascun amministratore gestisce le proprie credenziali in autonomia. L'accesso richiede la password personale.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAdminUnlocked(false);
                  setActiveTab('regular');
                }}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  border: '1px solid #a5b4fc',
                  backgroundColor: 'white',
                  color: '#3730a3',
                  fontWeight: '600',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Lock size={14} /> Blocca Sezione Admin
              </button>
            </div>

            <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid var(--border-color)', color: '#334155' }}>
                    <th style={{ padding: '1rem' }}>Username Admin</th>
                    <th>Ruolo</th>
                    <th style={{ textAlign: 'center' }}>Stato Account</th>
                    <th style={{ textAlign: 'center' }}>Auto-Logout</th>
                    <th style={{ textAlign: 'center' }}>Dispositivi Collegati</th>
                    <th style={{ textAlign: 'right', padding: '1rem' }}>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#faf5ff' }}>
                      <td style={{ padding: '1rem', fontWeight: 'bold', color: '#581c87' }}>
                        👑 {user.username}
                      </td>
                      <td>
                        <span style={{ 
                          display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.6rem', 
                          borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold',
                          backgroundColor: '#f3e8ff', color: '#6b21a8', border: '1px solid #e9d5ff'
                        }}>
                          Amministratore
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {user.isActive ? (
                          <span style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontWeight: 'bold' }}>
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
                      <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                        <span style={{ 
                          fontWeight: 'bold', 
                          color: (user.activeDevicesCount || 0) >= (user.maxDevices || 2) ? '#e11d48' : '#059669',
                          backgroundColor: (user.activeDevicesCount || 0) >= (user.maxDevices || 2) ? '#ffe4e6' : '#d1fae5',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px'
                        }}>
                          📱 {user.activeDevicesCount || 0} / {user.maxDevices || 2} max
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button className="btn" style={{ padding: '0.4rem', border: '1px solid var(--border-color)', background: 'white' }} onClick={() => handleToggleStatus(user)} title={user.isActive ? "Blocca Accesso" : "Sblocca Accesso"}>
                            {user.isActive ? <Lock size={16} color="#64748b" /> : <Unlock size={16} color="var(--success-color)" />}
                          </button>
                          <button className="btn" style={{ padding: '0.4rem', border: '1px solid var(--border-color)', background: 'white' }} onClick={() => handleOpenModal(user, true)} title="Modifica Password / Credenziali Admin">
                            <Edit2 size={16} color="#4338ca" />
                          </button>
                          <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={() => handleDelete(user)} title="Elimina Account Admin">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {adminUsers.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Nessun amministratore presente</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODALE 1: VERIFICA PASSWORD ADMIN PRIMA DI ACCEDERE */}
      {isAuthModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', padding: '1.5rem', borderRadius: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto', border: '1px solid #bfdbfe' }}>
                <KeyRound size={28} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', textAlign: 'center' }}>
                🔑 Conferma Password Admin
              </h3>
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#64748b', lineHeight: '1.4', textAlign: 'center' }}>
                Per motivi di sicurezza, inserisci la tua password personale per accedere alla <strong>Sezione Riservata Amministratori</strong>:
              </p>
            </div>

            {authError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.65rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyAdminPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
              <div className="form-group" style={{ textAlign: 'center' }}>
                <label style={{ fontWeight: '600', fontSize: '0.875rem', color: '#334155', textAlign: 'center', display: 'block', width: '100%', marginBottom: '0.35rem' }}>Password Personale Admin</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                  <input
                    type={showAuthPassword ? "text" : "password"}
                    value={adminPasswordInput}
                    onChange={e => setAdminPasswordInput(e.target.value)}
                    placeholder="Inserisci la tua password..."
                    autoFocus
                    required
                    style={{ width: '100%', textAlign: 'center', padding: '0.65rem 2.5rem 0.65rem 2.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '1rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthPassword(!showAuthPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.6rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {showAuthPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsAuthModalOpen(false)}
                  style={{ flex: 1, border: '1px solid #cbd5e1', background: 'white' }}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn"
                  style={{ flex: 1.2, backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem' }}
                >
                  {authLoading ? 'Verifica in corso...' : '🔓 Sblocca Sezione'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE 2: NUOVO / MODIFICA UTENTE O ADMIN */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
                {editingUser 
                  ? (isCreatingAdmin ? 'Modifica Account Admin' : 'Modifica Utente')
                  : (isCreatingAdmin ? '👑 Nuovo Amministratore' : '👤 Nuovo Utente')}
              </h3>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setIsModalOpen(false)} 
                title="Chiudi" 
                style={{ marginLeft: 'auto', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18}/>
              </button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.75rem' }}>
              <div className="form-group">
                <label style={{ fontWeight: '600' }}>Nome Utente</label>
                <input 
                  type="text" 
                  value={formData.username} 
                  onChange={e => setFormData({...formData, username: e.target.value})} 
                  disabled={!!editingUser}
                  required 
                  style={{ width: '100%', padding: '0.65rem 0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '1rem' }}
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: '600' }}>{editingUser ? 'Nuova Password (lascia vuoto per non cambiare)' : 'Password'}</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    required={!editingUser}
                    style={{ width: '100%', padding: '0.65rem 2.5rem 0.65rem 0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '1rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.25rem'
                    }}
                    title={showPassword ? "Nascondi Password" : "Mostra Password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: '600' }}>Livello di Accesso (Ruolo)</label>
                {isCreatingAdmin ? (
                  <input
                    type="text"
                    disabled
                    value="Amministratore (Pieno Accesso)"
                    style={{ width: '100%', padding: '0.65rem 0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.95rem', fontWeight: 'bold', color: '#4338ca', backgroundColor: '#e0e7ff' }}
                  />
                ) : (
                  <select 
                    value={formData.role} 
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    style={{ width: '100%', padding: '0.65rem 0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '1rem' }}
                  >
                    <option value="editor">Operatore (Aggiunge/Modifica Vini)</option>
                    <option value="viewer">Visitatore (Solo Lettura, nessuna modifica)</option>
                  </select>
                )}
              </div>

              {/* AUTORIZZAZIONE CANTINE FISICHE */}
              <div style={{ background: '#f0f9ff', padding: '0.85rem', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0369a1', fontSize: '0.95rem' }}>
                  🏰 Accesso Cantine Fisiche Autorizzate
                </label>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0.65rem 0' }}>
                  Seleziona quali cantine fisiche questo utente può aprire, consultare e modificare.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#0c4a6e', fontWeight: formData.allowedLocationsType === 'ALL' ? 'bold' : 'normal' }}>
                    <input
                      type="radio"
                      name="allowedLocType"
                      checked={formData.allowedLocationsType === 'ALL'}
                      onChange={() => setFormData({ ...formData, allowedLocationsType: 'ALL' })}
                    />
                    🌐 Tutte le Cantine Fisiche (Accesso Completo)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#0c4a6e', fontWeight: formData.allowedLocationsType === 'SPECIFIC' ? 'bold' : 'normal' }}>
                    <input
                      type="radio"
                      name="allowedLocType"
                      checked={formData.allowedLocationsType === 'SPECIFIC'}
                      onChange={() => setFormData({
                        ...formData,
                        allowedLocationsType: 'SPECIFIC',
                        allowedLocationsList: formData.allowedLocationsList.length > 0 ? formData.allowedLocationsList : locations.map(l => l.name)
                      })}
                    />
                    🎯 Seleziona Cantine Specifiche...
                  </label>

                  {formData.allowedLocationsType === 'SPECIFIC' && (
                    <div style={{ marginTop: '0.35rem', paddingLeft: '1.4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.4rem' }}>
                      {locations.map(loc => {
                        const isChecked = formData.allowedLocationsList.includes(loc.name);
                        return (
                          <label key={loc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', color: isChecked ? '#0284c7' : '#475569', fontWeight: isChecked ? '600' : '400' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const newList = e.target.checked
                                  ? [...formData.allowedLocationsList, loc.name]
                                  : formData.allowedLocationsList.filter(n => n !== loc.name);
                                setFormData({ ...formData, allowedLocationsList: newList });
                              }}
                            />
                            {loc.name}
                          </label>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px dashed #bae6fd' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: '#0369a1', fontWeight: 'bold' }}>
                      <input
                        type="checkbox"
                        checked={formData.canAccessInventory}
                        onChange={(e) => setFormData({ ...formData, canAccessInventory: e.target.checked })}
                      />
                      📋 Consenti Accesso a "Inventario Fisico" (Conteggio Bottiglie)
                    </label>
                  </div>
                </div>
              </div>

              {/* AUTORIZZAZIONE DISPOSITIVI SIMULTANEI */}
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1e293b', fontSize: '0.95rem' }}>
                  📱 Dispositivi Contemporanei Consentiti
                </label>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0.5rem 0' }}>
                  Numero massimo di dispositivi (telefoni/PC) collegati contemporaneamente (default: 2).
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="number" 
                    min="1" 
                    max="50" 
                    value={formData.maxDevices || 2} 
                    onChange={e => setFormData({...formData, maxDevices: Math.max(1, Number(e.target.value))})} 
                    style={{ width: '90px', padding: '0.5rem', border: '2px solid #6366f1', borderRadius: '6px', fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: '600' }}>dispositivi max autorizzati</span>
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={formData.isActive} 
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="isActive" style={{ margin: 0, cursor: 'pointer', fontWeight: '600' }}>Account Attivo</label>
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
