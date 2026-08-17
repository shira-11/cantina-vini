'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wine, Lock, User, Loader2, Eye, EyeOff, X } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showBg, setShowBg] = useState(true);
  const [bgVersion, setBgVersion] = useState('');
  const router = useRouter();

  useEffect(() => {
    setBgVersion(Date.now().toString());

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reason') === 'timeout') {
        setError('⏱️ Disconnessione automatica eseguita per inattività. Effettua nuovamente il login.');
      }
    }

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.loginPageBackground === false) {
          setShowBg(false);
        }
      })
      .catch(err => console.error('Error fetching settings:', err));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('homeFilters');
          sessionStorage.removeItem('homeSearch');
          sessionStorage.removeItem('homeWines');
          sessionStorage.removeItem('homeExpandedGroups');
        }
        window.location.href = '/';
      } else {
        setError(data.error || 'Errore durante il login');
      }
    } catch (err) {
      setError('Errore di connessione al server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: showBg ? `url('/login-bg.png${bgVersion ? `?v=${bgVersion}` : ''}') center center / cover no-repeat` : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative',
      padding: '1rem'
    }}>
      {showBg && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dark overlay for better contrast
          zIndex: 0
        }} />
      )}
      <div style={{
        background: showBg ? 'rgba(255, 255, 255, 0.85)' : 'white',
        backdropFilter: showBg ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: showBg ? 'blur(12px)' : 'none',
        padding: '3rem 2.5rem',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 1
      }}>
        
        <div style={{ 
          background: '#8b5cf6', 
          color: 'white', 
          width: '64px', 
          height: '64px', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: '1.5rem',
          boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.3)'
        }}>
          <Wine size={32} />
        </div>
        
        <h1 style={{ margin: '0 0 2rem 0', fontSize: '1.75rem', color: '#0f172a', fontWeight: 'bold' }}>
          Cantina
        </h1>


        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#ef4444',
            padding: '0.75rem',
            borderRadius: '8px',
            width: '100%',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            textAlign: 'center',
            border: '1px solid #fca5a5'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>
              Nome Utente
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Inserisci username"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="username"
                style={{
                  width: '100%',
                  padding: '0.75rem 2.5rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                required
              />
              {username && (
                <button
                  type="button"
                  onClick={() => setUsername('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Cancella username"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Inserisci password"
                style={{
                  width: '100%',
                  padding: '0.75rem 2.5rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={showPassword ? "Nascondi password" : "Mostra password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '1rem',
              width: '100%',
              padding: '0.875rem',
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s',
              opacity: loading ? 0.8 : 1
            }}
            onMouseOver={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#7c3aed' }}
            onMouseOut={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#8b5cf6' }}
          >
            {loading ? <Loader2 size={20} className="spin" /> : 'Accedi al Gestionale'}
          </button>
        </form>
      </div>
      
      <div style={{ 
        marginTop: '2rem', 
        color: showBg ? 'rgba(255, 255, 255, 0.7)' : '#94a3b8', 
        fontSize: '0.85rem', 
        letterSpacing: '0.05em', 
        zIndex: 1, 
        textShadow: showBg ? '0 1px 2px rgba(0,0,0,0.5)' : 'none' 
      }}>
        Powered by SHI
      </div>


      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}} />
    </div>
  );
}
