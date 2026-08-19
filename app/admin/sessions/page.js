'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Shield, ArrowLeft, RefreshCw, Trash2, Search, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AdminSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'ended'

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sessions');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSessions(data);
        } else {
          console.error("Session data format error:", data);
          setSessions([]);
        }
      } else if (res.status === 403) {
        router.push('/');
      }
    } catch (err) {
      console.error(err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleClearHistory = async () => {
    if (!confirm("Sei sicuro di voler cancellare le sessioni storiche già concluse?")) return;
    try {
      const res = await fetch('/api/admin/sessions', { method: 'DELETE' });
      if (res.ok) {
        fetchSessions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const calculateDuration = (loginStr, logoutStr) => {
    if (!loginStr) return '—';
    const start = new Date(loginStr).getTime();
    const end = logoutStr ? new Date(logoutStr).getTime() : Date.now();
    const diffMs = end - start;

    if (diffMs < 0) return '0 min';
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    if (totalMinutes < 1) return '< 1 min';
    if (totalMinutes < 60) return `${totalMinutes} min`;
    
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${mins}m`;
  };

  const filteredSessions = (Array.isArray(sessions) ? sessions : []).filter(s => {
    const usernameStr = s.username || s.user?.username || '';
    const matchesUser = usernameStr.toLowerCase().includes(search.toLowerCase());
    const isActive = !s.logoutTime;
    if (statusFilter === 'active' && !isActive) return false;
    if (statusFilter === 'ended' && isActive) return false;
    return matchesUser;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => router.push('/admin/users')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
          >
            <ArrowLeft size={18} /> Indietro
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={28} color="#6366f1" /> Registro Accessi Utenti
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>
              Cronologia entrate, uscite e tempi di lavoro degli utenti
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={fetchSessions}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
          >
            <RefreshCw size={18} /> Aggiorna
          </button>
          <button
            onClick={handleClearHistory}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff1f2', border: '1px solid #fecdd3', color: '#e11d48', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
          >
            <Trash2 size={18} /> Svuota Storico Concluso
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Cerca per nome utente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { id: 'all', label: 'Tutte le Sessioni' },
            { id: 'active', label: '🟢 Solo Attivi Ora' },
            { id: 'ended', label: '🚪 Concluse' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                border: statusFilter === f.id ? '2px solid #6366f1' : '1px solid #cbd5e1',
                backgroundColor: statusFilter === f.id ? '#eeeffe' : '#f8fafc',
                color: statusFilter === f.id ? '#4338ca' : '#475569',
                fontWeight: statusFilter === f.id ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Caricamento registro sessioni...</div>
      ) : filteredSessions.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
          Nessuna sessione trovata nel registro.
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '0.85rem 1rem' }}>UTENTE</th>
                <th style={{ padding: '0.85rem 1rem' }}>ENTRATA (LOGIN)</th>
                <th style={{ padding: '0.85rem 1rem' }}>USCITA (LOGOUT)</th>
                <th style={{ padding: '0.85rem 1rem' }}>DURATA SESSIONE</th>
                <th style={{ padding: '0.85rem 1rem' }}>STATO / MOTIVO</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((s, idx) => {
                const isActive = !s.logoutTime;
                const isAutoLogout = s.logoutReason === 'auto_timeout';
                const role = s.user?.role || 'viewer';

                return (
                  <tr key={s.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 'bold' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{s.username}</span>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          backgroundColor: role === 'admin' ? '#fef3c7' : '#f1f5f9',
                          color: role === 'admin' ? '#92400e' : '#475569',
                          fontWeight: '600'
                        }}>
                          {role.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                      {formatDateTime(s.loginTime)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                      {isActive ? (
                        <span style={{ color: '#16a34a', fontWeight: 'bold' }}>🟢 Sessione in corso</span>
                      ) : (
                        formatDateTime(s.logoutTime)
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 'bold', color: '#1e293b' }}>
                      {calculateDuration(s.loginTime, s.logoutTime)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {isActive ? (
                        <span style={{ color: '#16a34a', backgroundColor: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          🟢 Attivo Ora
                        </span>
                      ) : isAutoLogout ? (
                        <span style={{ color: '#c2410c', backgroundColor: '#ffedd5', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          ⏱️ Auto-Logout (30 min)
                        </span>
                      ) : (
                        <span style={{ color: '#475569', backgroundColor: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '500' }}>
                          🚪 Uscita Manuale
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
