'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, CheckCircle, ArrowLeft } from 'lucide-react';

export default function PasswordResetPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('shira123456');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', text: '' });

    try {
      const res = await fetch('/api/auth/force-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'Adriano', newPassword })
      });

      if (res.ok) {
        setStatus({ type: 'success', text: `Password dell'utente Adriano impostata con successo a "${newPassword}"!` });
      } else {
        const data = await res.json();
        setStatus({ type: 'error', text: data.error || 'Errore durante il ripristino.' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: 'Errore di connessione' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2rem', maxWidth: '420px', width: '100%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <button
          onClick={() => router.push('/login')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '1.5rem', fontWeight: '500' }}
        >
          <ArrowLeft size={18} /> Vai al Login
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: '#eeeffe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <KeyRound size={24} color="#6366f1" />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Ripristino Password Admin</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Imposta una nuova password per l'amministratore <strong>Adriano</strong>
          </p>
        </div>

        {status.text && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', backgroundColor: status.type === 'success' ? '#dcfce7' : '#fee2e2', color: status.type === 'success' ? '#15803d' : '#b91c1c', fontSize: '0.9rem', fontWeight: '500', textAlign: 'center' }}>
            {status.text}
          </div>
        )}

        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>Nuova Password per Adriano</label>
            <input
              type="text"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ padding: '0.75rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem' }}
          >
            {loading ? 'Aggiornamento...' : 'Imposta Password Ora'}
          </button>
        </form>

        {status.type === 'success' && (
          <button
            onClick={() => router.push('/login')}
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
          >
            Vai al Login con la nuova password 🚀
          </button>
        )}
      </div>
    </div>
  );
}
