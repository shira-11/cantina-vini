import { Wine, Lock, Key } from 'lucide-react';

export default function RecuperoPassword() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '1rem' }}>
      <div style={{ maxWidth: '400px', width: '100%', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '2rem' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Wine size={24} color="#ef4444" />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>Recupero Emergenza</h1>
          <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.875rem', textAlign: 'center' }}>
            Modalità Ultra Sicura (HTML puro)
          </p>
        </div>

        <form action="/api/auth/force-reset-html" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
              Nome Utente
            </label>
            <input
              type="text"
              name="username"
              required
              defaultValue="Shirantha"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
              Nuova Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="password"
                name="newPassword"
                required
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                placeholder="Inserisci nuova password"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
              Codice di Sicurezza (PIN)
            </label>
            <div style={{ position: 'relative' }}>
              <Key size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="password"
                name="secretCode"
                required
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                placeholder="Codice segreto"
              />
            </div>
          </div>

          <button
            type="submit"
            style={{ width: '100%', padding: '0.75rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '500', cursor: 'pointer' }}
          >
            Forza Cambio Password
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <a href="/login" style={{ color: '#3b82f6', fontSize: '0.875rem', textDecoration: 'none' }}>
              Torna al Login
            </a>
          </div>

        </form>
      </div>
    </div>
  );
}
