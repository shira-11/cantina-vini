'use client';
// Version 1.0.5 - Clean Visitor Settings & Header Buttons Permissions

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, ArrowLeft, Check, X, Save } from 'lucide-react';

const FILTER_OPTIONS = [
  { id: 'country', label: 'Nazione' },
  { id: 'region', label: 'Regione' },
  { id: 'producerCellar', label: 'Cantina' },
  { id: 'producer', label: 'Produttore' },
  { id: 'classification', label: 'Classificazione' },
  { id: 'category', label: 'Categoria' },
  { id: 'location', label: 'Locazione' },
  { id: 'availability', label: 'Disponibilità' },
  { id: 'photo', label: 'Foto' },
  { id: 'bottleType', label: 'Formato Bottiglia' }
];

const HEADER_BUTTON_OPTIONS = [
  { id: 'print_scheda', label: '📄 Stampa Scheda Vino (Copertine)' },
  { id: 'print_nazioni', label: '📋 Elenco Giacenze Vini per Nazione' },
  { id: 'print_pdf', label: '📄 Stampa Giacenze Dettagliato (PDF Rosso)' },
  { id: 'export_excel', label: '📊 Esporta Giacenze in Excel (Verde)' },
  { id: 'history_log', label: '🕒 Storico e Cronologia Movimenti (Blu)' },
  { id: 'inventory', label: '☑️ Inventario Fisico (Conteggio e Rettifica)' }
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allowedFilters, setAllowedFilters] = useState([]);
  const [allowedButtons, setAllowedButtons] = useState([]);
  const [allowWineDetails, setAllowWineDetails] = useState(true);
  const [loginPageBackground, setLoginPageBackground] = useState(true);
  const [photoPreviewSeconds, setPhotoPreviewSeconds] = useState(3);
  const [enableSearchAutocomplete, setEnableSearchAutocomplete] = useState(true);
  const [deletionPin, setDeletionPin] = useState('1234');
  const [uploadingBg, setUploadingBg] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          setAllowedFilters(data.visitorAllowedFilters || FILTER_OPTIONS.map(f => f.id));
          setAllowedButtons(data.visitorAllowedButtons || HEADER_BUTTON_OPTIONS.map(b => b.id));
          setAllowWineDetails(data.visitorAllowWineDetails !== false);
          setLoginPageBackground(data.loginPageBackground !== false);
          setEnableSearchAutocomplete(data.enableSearchAutocomplete !== false);
          if (data.deletionPin) {
            setDeletionPin(data.deletionPin);
          }
          if (data.photoPreviewSeconds !== undefined) {
            setPhotoPreviewSeconds(data.photoPreviewSeconds);
          }
        } else if (res.status === 403) {
          router.push('/');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [router]);

  const handleToggle = (filterId) => {
    setAllowedFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const handleToggleBtn = (btnId) => {
    setAllowedButtons(prev =>
      prev.includes(btnId)
        ? prev.filter(id => id !== btnId)
        : [...prev, btnId]
    );
  };

  const handleSelectAll = (select) => {
    if (select) {
      setAllowedFilters(FILTER_OPTIONS.map(f => f.id));
    } else {
      setAllowedFilters([]);
    }
  };

  const handleSelectAllBtns = (select) => {
    if (select) {
      setAllowedButtons(HEADER_BUTTON_OPTIONS.map(b => b.id));
    } else {
      setAllowedButtons([]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorAllowedFilters: allowedFilters,
          visitorAllowedButtons: allowedButtons,
          visitorAllowWineDetails: allowWineDetails,
          loginPageBackground: loginPageBackground,
          photoPreviewSeconds: photoPreviewSeconds,
          enableSearchAutocomplete: enableSearchAutocomplete,
          deletionPin: deletionPin
        })
      });

      if (res.ok) {
        setMessage({ text: 'Impostazioni salvate con successo!', type: 'success' });
      } else {
        setMessage({ text: 'Errore durante il salvataggio', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Errore di connessione', type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleBgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBg(true);
    setMessage({ text: 'Caricamento immagine...', type: 'info' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/settings/upload-bg', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setMessage({ text: 'Nuovo sfondo caricato con successo!', type: 'success' });
      } else {
        setMessage({ text: 'Errore durante il caricamento dello sfondo', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Errore di caricamento', type: 'error' });
    } finally {
      setUploadingBg(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui' }}>
        <p>Caricamento impostazioni...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button
          onClick={() => router.push('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#64748b' }}
        >
          <ArrowLeft size={20} /> Torna alla Home
        </button>
        <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={28} color="#6366f1" /> Impostazioni Gestionale
        </h1>
      </div>

      {message.text && (
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          backgroundColor: message.type === 'success' ? '#dcfce7' : message.type === 'error' ? '#fee2e2' : '#e0f2fe',
          color: message.type === 'success' ? '#166534' : message.type === 'error' ? '#991b1b' : '#075985',
          fontWeight: '500'
        }}>
          {message.text}
        </div>
      )}

      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Sezione PIN di Sicurezza per Eliminazioni */}
          <div>
            <h3 style={{ margin: '0 0 1rem 0', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🔐 PIN di Sicurezza per Eliminazioni
            </h3>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                padding: '1.25rem',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1.05rem', color: '#1e293b', fontWeight: '600' }}>PIN di Sicurezza per la Cancellazione</span>
                <span style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Questo PIN verrà richiesto ogni volta che un utente preme il pulsante elimina (🗑️) per cancellare un elemento (Nazione, Regione, Cantina, Foto, ecc.).
                </span>
              </div>
              <input
                type="text"
                value={deletionPin}
                onChange={(e) => setDeletionPin(e.target.value)}
                placeholder="1234"
                style={{
                  width: '110px',
                  padding: '0.6rem 0.75rem',
                  fontSize: '1.15rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  borderRadius: '8px',
                  border: '2px solid #6366f1',
                  background: 'white',
                  letterSpacing: '2px'
                }}
              />
            </div>
          </div>

          {/* Sezione Autocompletamento Ricerca */}
          <div>
            <h3 style={{ margin: '0 0 1rem 0', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>Ricerca & Suggerimenti</h3>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                background: enableSearchAutocomplete ? '#f8fafc' : 'transparent',
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                type="checkbox"
                checked={enableSearchAutocomplete}
                onChange={() => setEnableSearchAutocomplete(!enableSearchAutocomplete)}
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1.05rem', color: '#1e293b', fontWeight: '500' }}>Suggerimenti di Ricerca Automatici (stile Google)</span>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Se attivo, digitando nella barra di ricerca comparirà il menu con i nomi dei vini e produttori corrispondenti. Se disattivato, il menu dei suggerimenti non apparirà.</span>
              </div>
            </label>
          </div>

          {/* Sezione Accesso Scheda Vino */}
          <div>
            <h3 style={{ margin: '0 0 1rem 0', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>Permessi Generali</h3>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                background: allowWineDetails ? '#f8fafc' : 'transparent',
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                type="checkbox"
                checked={allowWineDetails}
                onChange={() => setAllowWineDetails(!allowWineDetails)}
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1.05rem', color: '#1e293b', fontWeight: '500' }}>Consenti accesso alla Scheda Vino</span>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Se disattivato, i visitatori non potranno cliccare sui vini per vedere giacenze e movimenti.</span>
              </div>
            </label>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {saving ? 'Salvataggio...' : <><Save size={18} /> Salva Modifiche</>}
          </button>
        </div>
      </div>

      <div className="admin-content" style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '2rem' }}>
        <p style={{ marginBottom: '2rem', color: '#64748b', lineHeight: '1.5' }}>
          Seleziona quali filtri vuoi rendere visibili agli utenti &quot;Visitatori&quot; (Viewer) e gestisci la durata di visualizzazione delle foto.
        </p>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="form-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Sezione Durata Anteprima Foto Vini */}
            <div>
              <h3 style={{ margin: '0 0 1rem 0', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>Anteprima Foto Vini</h3>
              <div style={{ padding: '1rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '1.05rem', color: '#1e293b', fontWeight: '500', display: 'block', marginBottom: '0.25rem' }}>
                  Durata scomparsa foto (secondi)
                </span>
                <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '1rem' }}>
                  Imposta per quanti secondi deve rimanere visibile l&apos;anteprima della foto della bottiglia dopo aver rilasciato il mouse o il dito.
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setPhotoPreviewSeconds(prev => Math.max(1, prev - 1))}
                    style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: 'white',
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    -
                  </button>

                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={photoPreviewSeconds}
                    onChange={(e) => setPhotoPreviewSeconds(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    style={{
                      width: '4.5rem',
                      height: '2.5rem',
                      textAlign: 'center',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: 'white'
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setPhotoPreviewSeconds(prev => prev + 1)}
                    style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: 'white',
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    +
                  </button>

                  <span style={{ fontSize: '1rem', fontWeight: '500', color: '#475569' }}>
                    secondi
                  </span>
                </div>
              </div>
            </div>

            {/* Sezione Accesso Scheda Vino */}
            <div>
              <h3 style={{ margin: '0 0 1rem 0', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>Permessi Generali</h3>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: allowWineDetails ? '#f8fafc' : 'transparent',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  type="checkbox"
                  checked={allowWineDetails}
                  onChange={() => setAllowWineDetails(!allowWineDetails)}
                  style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '1.05rem', color: '#1e293b', fontWeight: '500' }}>Consenti accesso alla Scheda Vino</span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Se disattivato, i visitatori non potranno cliccare sui vini per vedere giacenze e movimenti.</span>
                </div>
              </label>
            </div>

            {/* Sezione Sfondo Pagina Login */}
            <div>
              <h3 style={{ margin: '0 0 1rem 0', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>Estetica Generale</h3>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: loginPageBackground ? '#f8fafc' : 'transparent',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  type="checkbox"
                  checked={loginPageBackground}
                  onChange={() => setLoginPageBackground(!loginPageBackground)}
                  style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '1.05rem', color: '#1e293b', fontWeight: '500' }}>Usa immagine come sfondo del Login</span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Se disattivato, la pagina di login avrà un colore semplice e pulito.</span>
                </div>
              </label>

              {loginPageBackground && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: '500', color: '#334155' }}>Cambia l'immagine di sfondo</p>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#64748b' }}>Carica un'immagine JPG o PNG. Verrà applicata immediatamente.</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBgUpload}
                    disabled={uploadingBg}
                    style={{ fontSize: '0.9rem' }}
                  />
                  {uploadingBg && <span style={{ marginLeft: '1rem', fontSize: '0.85rem', color: '#8b5cf6' }}>Caricamento in corso...</span>}
                </div>
              )}
            </div>

            {/* Sezione Pulsanti Header */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Pulsanti Barra Superiore (Header)</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Scegli quali tasti della barra in alto mostrare all&apos;utente Visitatore.</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => handleSelectAllBtns(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.875rem' }}
                  >
                    Seleziona Tutti
                  </button>
                  <button
                    onClick={() => handleSelectAllBtns(false)}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.875rem' }}
                  >
                    Deseleziona Tutti
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {HEADER_BUTTON_OPTIONS.map(btn => (
                  <label
                    key={btn.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: allowedButtons.includes(btn.id) ? '#f8fafc' : 'transparent',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={allowedButtons.includes(btn.id)}
                      onChange={() => handleToggleBtn(btn.id)}
                      style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '1.05rem', color: '#1e293b', fontWeight: '500' }}>{btn.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sezione Filtri */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: 0 }}>Filtri di Ricerca</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => handleSelectAll(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.875rem' }}
                  >
                    Seleziona Tutti
                  </button>
                  <button
                    onClick={() => handleSelectAll(false)}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.875rem' }}
                  >
                    Deseleziona Tutti
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {FILTER_OPTIONS.map(filter => (
                  <label
                    key={filter.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: allowedFilters.includes(filter.id) ? '#f8fafc' : 'transparent',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={allowedFilters.includes(filter.id)}
                      onChange={() => handleToggle(filter.id)}
                      style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '1.05rem', color: '#1e293b' }}>{filter.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                {message.text && (
                  <span style={{ color: message.type === 'success' ? '#10b981' : '#ef4444', fontWeight: '500' }}>
                    {message.type === 'success' ? <Check size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> : <X size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} />}
                    {message.text}
                  </span>
                )}
              </div>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '140px', justifyContent: 'center' }}
              >
                {saving ? (
                  <span className="spinner" style={{ width: '1.25rem', height: '1.25rem', borderBottomColor: 'white' }}></span>
                ) : (
                  <>
                    <Save size={18} />
                    Salva Modifiche
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .admin-container {
          min-height: 100vh;
          background: #f8fafc;
          padding-bottom: 3rem;
        }
        .admin-header {
          background: white;
          padding: 1.25rem 2rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .admin-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #0f172a;
        }
        .icon-btn {
          background: none;
          border: none;
          padding: 0.5rem;
          cursor: pointer;
          color: #64748b;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .icon-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        .btn-primary {
          background: var(--primary-color);
          color: white;
        }
        .btn-primary:hover:not(:disabled) {
          opacity: 0.9;
        }
        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid #e2e8f0;
          border-bottom-color: var(--primary-color);
          border-radius: 50%;
          display: inline-block;
          box-sizing: border-box;
          animation: rotation 1s linear infinite;
        }
        @keyframes rotation {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
