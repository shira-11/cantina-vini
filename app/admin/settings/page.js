'use client';
// Version 2.1.0 - Premium 2-Column Layout with Cellar & Location Management

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, ArrowLeft, Check, X, Save, Shield, Eye, Search, Image as ImageIcon, Clock, Lock, Sliders, Users, Building2, Plus, Edit2, Trash2, RotateCcw, FileText, List, FileSpreadsheet, History, CheckSquare, QrCode } from 'lucide-react';

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
  { id: 'bottleType', label: 'Tipo Bottiglia' }
];

const HEADER_BUTTON_OPTIONS = [
  { id: 'print_scheda', label: 'Stampa Scheda Vino (Copertine)', icon: FileText, color: '#475569' },
  { id: 'print_nazioni', label: 'Elenco Giacenze Vini per Nazione', icon: List, color: '#475569' },
  { id: 'print_pdf', label: 'Stampa Giacenze Dettagliato (PDF Rosso)', icon: FileText, color: '#f43f5e' },
  { id: 'export_excel', label: 'Esporta Giacenze in Excel (Verde)', icon: FileSpreadsheet, color: '#16a34a' },
  { id: 'history_log', label: 'Storico e Cronologia Movimenti (Blu)', icon: History, color: '#3b82f6' },
  { id: 'inventory', label: 'Inventario Fisico (Conteggio e Rettifica)', icon: CheckSquare, color: '#10b981' },
  { id: 'qr_scanner', label: 'Scanner QR Code (Fotocamera & Codice a Barre)', icon: QrCode, color: '#6366f1' }
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

  // Location Management states
  const [locations, setLocations] = useState([]);
  const [newLocationName, setNewLocationName] = useState('');
  const [editingLocId, setEditingLocId] = useState(null);
  const [editingLocName, setEditingLocName] = useState('');

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

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
    fetchLocations();
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
    setMessage({ text: 'Caricamento immagine in corso...', type: 'info' });

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

  // Location Handlers
  const handleAddLocation = async () => {
    if (!newLocationName.trim()) return;
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLocationName.trim() })
      });
      if (res.ok) {
        setNewLocationName('');
        setMessage({ text: 'Nuova cantina aggiunta con successo!', type: 'success' });
        fetchLocations();
      } else {
        const err = await res.json();
        alert(err.error || 'Errore durante la creazione della cantina');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRenameLocation = async (id) => {
    if (!editingLocName.trim()) return;
    try {
      const res = await fetch(`/api/locations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingLocName.trim() })
      });
      if (res.ok) {
        setEditingLocId(null);
        setEditingLocName('');
        setMessage({ text: 'Cantina rinominata con successo!', type: 'success' });
        fetchLocations();
      } else {
        const err = await res.json();
        alert(err.error || 'Errore durante la rinomina');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearLocationStock = async (loc) => {
    const userPin = prompt(`🔑 Inserisci il PIN di Sicurezza per azzerare tutte le bottiglie in "${loc.name}":`);
    if (userPin !== deletionPin) {
      alert("❌ PIN di Sicurezza errato. Operazione annullata.");
      return;
    }

    if (!confirm(`⚠️ Sei sicuro di voler SVUOTARE LA CANTINA "${loc.name}"?\n\nTutte le giacenze attive in questa cantina verranno azzerate. Non verranno aggiunte bottiglie su altre cantine.`)) return;

    try {
      const res = await fetch(`/api/locations/${loc.id}/clear`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setMessage({ text: data.message || `Cantina "${loc.name}" svuotata con successo.`, type: 'success' });
        fetchLocations();
      } else {
        const err = await res.json();
        alert(err.error || 'Errore durante lo svuotamento della cantina');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLocation = async (loc) => {
    const userPin = prompt(`🔑 Inserisci il PIN di Sicurezza per ELIMINARE la cantina "${loc.name}":`);
    if (userPin !== deletionPin) {
      alert("❌ PIN di Sicurezza errato. Eliminazione annullata.");
      return;
    }

    if (!confirm(`⚠️ Sei sicuro di voler ELIMINARE DEFINITIVAMENTE la cantina "${loc.name}"?`)) return;

    try {
      const res = await fetch(`/api/locations/${loc.id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ text: `Cantina "${loc.name}" eliminata con successo!`, type: 'success' });
        fetchLocations();
      } else {
        const err = await res.json();
        alert(err.error || 'Errore durante l\'eliminazione della cantina');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '2.5rem', height: '2.5rem', borderWidth: '3px', borderColor: '#e2e8f0', borderBottomColor: '#6366f1', borderRadius: '50%', animation: 'rotation 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: '#64748b', fontWeight: '500' }}>Caricamento impostazioni...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#0f172a' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Top Header Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => router.push('/')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1px solid #cbd5e1', padding: '0.6rem 1.1rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', color: '#334155', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}
            >
              <ArrowLeft size={18} /> Home
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.55rem', fontWeight: '700' }}>
                <Settings size={26} color="#6366f1" /> Impostazioni Gestionale
              </h1>
              <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                Personalizza la sicurezza, le cantine, l&apos;estetica ed i permessi visitatori
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push('/admin/users')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#e0e7ff', border: '1px solid #818cf8', color: '#4338ca', padding: '0.6rem 1.1rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              <Users size={18} /> Gestione Utenti e Dispositivi
            </button>
            <button
              onClick={() => router.push('/admin/sessions')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1px solid #cbd5e1', color: '#334155', padding: '0.6rem 1.1rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              <Clock size={18} color="#6366f1" /> Registro Accessi
            </button>
          </div>
        </div>

        {/* Global Feedback Alert Banner */}
        {message.text && (
          <div style={{
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            backgroundColor: message.type === 'success' ? '#dcfce7' : message.type === 'error' ? '#fee2e2' : '#e0f2fe',
            color: message.type === 'success' ? '#15803d' : message.type === 'error' ? '#b91c1c' : '#0369a1',
            border: `1px solid ${message.type === 'success' ? '#86efac' : message.type === 'error' ? '#fca5a5' : '#7dd3fc'}`,
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
          }}>
            {message.type === 'success' ? <Check size={20} /> : message.type === 'error' ? <X size={20} /> : <Settings size={20} />}
            {message.text}
          </div>
        )}

        {/* Main 2-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '5rem' }}>
          
          {/* COLUMN 1: Gestione Cantine & Impostazioni Generali */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Card: Gestione Cantine e Locazioni */}
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ background: '#e0e7ff', padding: '0.45rem', borderRadius: '8px', display: 'flex' }}>
                  <Building2 size={20} color="#4338ca" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: '700' }}>Gestione Cantine e Locazioni</h3>
                  <span style={{ fontSize: '0.825rem', color: '#64748b' }}>Crea, rinomina, elimina o svuota le tue cantine</span>
                </div>
              </div>

              {/* Form Aggiunta Cantina */}
              <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  placeholder="Nome nuova cantina..."
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={handleAddLocation}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.6rem 1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  <Plus size={16} /> Aggiungi
                </button>
              </div>

              {/* Lista Cantine Esistenti */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {locations.map(loc => (
                  <div
                    key={loc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0.9rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      gap: '0.5rem'
                    }}
                  >
                    {editingLocId === loc.id ? (
                      <div style={{ display: 'flex', gap: '0.4rem', flex: 1, alignItems: 'center' }}>
                        <input
                          type="text"
                          value={editingLocName}
                          onChange={(e) => setEditingLocName(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '0.4rem 0.6rem',
                            borderRadius: '6px',
                            border: '1px solid #6366f1',
                            fontSize: '0.9rem'
                          }}
                        />
                        <button
                          onClick={() => handleRenameLocation(loc.id)}
                          style={{ background: '#16a34a', color: 'white', border: 'none', padding: '0.4rem 0.65rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                        >
                          Salva
                        </button>
                        <button
                          onClick={() => { setEditingLocId(null); setEditingLocName(''); }}
                          style={{ background: '#64748b', color: 'white', border: 'none', padding: '0.4rem 0.65rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          Annulla
                        </button>
                      </div>
                    ) : (
                      <>
                        <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.95rem' }}>
                          🏰 {loc.name}
                        </span>

                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button
                            onClick={() => { setEditingLocId(loc.id); setEditingLocName(loc.name); }}
                            title="Rinomina Cantina"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: '#e0e7ff', border: 'none', color: '#4338ca', padding: '0.35rem 0.65rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500' }}
                          >
                            <Edit2 size={13} /> Rinomina
                          </button>

                          <button
                            onClick={() => handleClearLocationStock(loc)}
                            title="Svuota Cantina (Zero Giacenza)"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: '#fef3c7', border: 'none', color: '#92400e', padding: '0.35rem 0.65rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500' }}
                          >
                            <RotateCcw size={13} /> Svuota Cantina
                          </button>

                          <button
                            onClick={() => handleDeleteLocation(loc)}
                            title="Elimina Cantina"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: '#fee2e2', border: 'none', color: '#991b1b', padding: '0.35rem 0.65rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500' }}
                          >
                            <Trash2 size={13} /> Elimina
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Card: PIN Sicurezza */}
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ background: '#fef3c7', padding: '0.45rem', borderRadius: '8px', display: 'flex' }}>
                  <Lock size={20} color="#d97706" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: '700' }}>PIN Sicurezza Eliminazioni</h3>
                  <span style={{ fontSize: '0.825rem', color: '#64748b' }}>Protezione per eliminare/svuotare cantine, vini o foto</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1.1rem', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fde68a' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.975rem', color: '#92400e', fontWeight: '600' }}>PIN di Sicurezza (default 1234)</span>
                  <span style={{ fontSize: '0.825rem', color: '#b45309', marginTop: '0.2rem' }}>
                    Verrà richiesto per eliminare/svuotare Cantine, Nazioni, Vini o Foto.
                  </span>
                </div>
                <input
                  type="text"
                  value={deletionPin}
                  onChange={(e) => setDeletionPin(e.target.value)}
                  placeholder="1234"
                  style={{
                    width: '100px',
                    padding: '0.5rem 0.6rem',
                    fontSize: '1.2rem',
                    fontWeight: '800',
                    textAlign: 'center',
                    borderRadius: '8px',
                    border: '2px solid #f59e0b',
                    background: 'white',
                    color: '#78350f',
                    letterSpacing: '2px'
                  }}
                />
              </div>
            </div>

            {/* Card: Suggerimenti di Ricerca */}
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ background: '#e0f2fe', padding: '0.45rem', borderRadius: '8px', display: 'flex' }}>
                  <Search size={20} color="#0284c7" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: '700' }}>Ricerca & Suggerimenti</h3>
                  <span style={{ fontSize: '0.825rem', color: '#64748b' }}>Autocompletamento dinamico durante la digitazione</span>
                </div>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.1rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: enableSearchAutocomplete ? '#f0f9ff' : '#f8fafc',
                  border: `1px solid ${enableSearchAutocomplete ? '#bae6fd' : '#e2e8f0'}`,
                  transition: 'all 0.2s'
                }}
              >
                <input
                  type="checkbox"
                  checked={enableSearchAutocomplete}
                  onChange={() => setEnableSearchAutocomplete(!enableSearchAutocomplete)}
                  style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer', accentColor: '#0284c7' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.975rem', color: '#0369a1', fontWeight: '600' }}>Suggerimenti di Ricerca Automatici (stile Google)</span>
                  <span style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.15rem' }}>
                    Mostra il menu a comparsa con i nomi dei vini e dei produttori corrispondenti.
                  </span>
                </div>
              </label>
            </div>

            {/* Card: Anteprima Foto Vini */}
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ background: '#f3e8ff', padding: '0.45rem', borderRadius: '8px', display: 'flex' }}>
                  <ImageIcon size={20} color="#9333ea" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: '700' }}>Anteprima Foto Vini</h3>
                  <span style={{ fontSize: '0.825rem', color: '#64748b' }}>Tempo di persistenza visiva dell&apos;immagine</span>
                </div>
              </div>

              <div style={{ padding: '1.1rem', borderRadius: '10px', background: '#faf5ff', border: '1px solid #e9d5ff' }}>
                <span style={{ fontSize: '0.975rem', color: '#7e22ce', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                  Durata scomparsa foto (secondi)
                </span>
                <span style={{ fontSize: '0.825rem', color: '#64748b', display: 'block', marginBottom: '1rem' }}>
                  Secondi di permanenza a schermo dell&apos;anteprima della bottiglia dopo aver rilasciato il mouse o il dito.
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setPhotoPreviewSeconds(prev => Math.max(1, prev - 1))}
                    style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '8px',
                      border: '1px solid #d8b4fe',
                      background: 'white',
                      fontSize: '1.3rem',
                      fontWeight: 'bold',
                      color: '#7e22ce',
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
                      fontSize: '1.15rem',
                      fontWeight: '800',
                      borderRadius: '8px',
                      border: '2px solid #a855f7',
                      background: 'white',
                      color: '#6b21a8'
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setPhotoPreviewSeconds(prev => prev + 1)}
                    style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '8px',
                      border: '1px solid #d8b4fe',
                      background: 'white',
                      fontSize: '1.3rem',
                      fontWeight: 'bold',
                      color: '#7e22ce',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    +
                  </button>

                  <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#6b21a8' }}>
                    secondi
                  </span>
                </div>
              </div>
            </div>

            {/* Card: Estetica Login */}
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ background: '#fce7f3', padding: '0.45rem', borderRadius: '8px', display: 'flex' }}>
                  <ImageIcon size={20} color="#db2777" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: '700' }}>Estetica Pagina Login</h3>
                  <span style={{ fontSize: '0.825rem', color: '#64748b' }}>Personalizzazione dello sfondo della schermata di accesso</span>
                </div>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.1rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: loginPageBackground ? '#fdf2f8' : '#f8fafc',
                  border: `1px solid ${loginPageBackground ? '#fbcfe8' : '#e2e8f0'}`,
                  transition: 'all 0.2s'
                }}
              >
                <input
                  type="checkbox"
                  checked={loginPageBackground}
                  onChange={() => setLoginPageBackground(!loginPageBackground)}
                  style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer', accentColor: '#db2777' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.975rem', color: '#be185d', fontWeight: '600' }}>Usa immagine come sfondo del Login</span>
                  <span style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.15rem' }}>
                    Se disattivato, la pagina di login avrà un colore solido pulito.
                  </span>
                </div>
              </label>

              {loginPageBackground && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff1f2', borderRadius: '10px', border: '1px dashed #fda4af' }}>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: '600', color: '#9f1239' }}>Cambia l&apos;immagine di sfondo</p>
                  <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.8rem', color: '#be123c' }}>Carica un file JPG o PNG per sostituire la foto attuale.</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBgUpload}
                    disabled={uploadingBg}
                    style={{ fontSize: '0.85rem' }}
                  />
                  {uploadingBg && <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', color: '#be185d', fontWeight: 'bold' }}>Caricamento in corso...</span>}
                </div>
              )}
            </div>

          </div>

          {/* COLUMN 2: Permessi & Visibilità Visitatori */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Card: Accesso Scheda Vino */}
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ background: '#dcfce7', padding: '0.45rem', borderRadius: '8px', display: 'flex' }}>
                  <Eye size={20} color="#16a34a" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: '700' }}>Accesso Scheda Dettaglio Vino</h3>
                  <span style={{ fontSize: '0.825rem', color: '#64748b' }}>Permessi di consultazione giacenze e movimenti per Visitatori</span>
                </div>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.1rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: allowWineDetails ? '#f0fdf4' : '#f8fafc',
                  border: `1px solid ${allowWineDetails ? '#bbf7d0' : '#e2e8f0'}`,
                  transition: 'all 0.2s'
                }}
              >
                <input
                  type="checkbox"
                  checked={allowWineDetails}
                  onChange={() => setAllowWineDetails(!allowWineDetails)}
                  style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer', accentColor: '#16a34a' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.975rem', color: '#15803d', fontWeight: '600' }}>Consenti apertura Scheda Vino</span>
                  <span style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.15rem' }}>
                    Se disattivato, i visitatori non potranno cliccare sui vini per aprire la scheda di dettaglio.
                  </span>
                </div>
              </label>
            </div>

            {/* Card: Pulsanti Barra Superiore */}
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ background: '#e0e7ff', padding: '0.45rem', borderRadius: '8px', display: 'flex' }}>
                    <Sliders size={20} color="#4f46e5" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: '700' }}>Pulsanti Barra Superiore (Header)</h3>
                    <span style={{ fontSize: '0.825rem', color: '#64748b' }}>Tasti azione visibili agli utenti Visitatori</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button
                    onClick={() => handleSelectAllBtns(true)}
                    style={{ background: '#f1f5f9', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', padding: '0.35rem 0.65rem', borderRadius: '6px' }}
                  >
                    Tutti
                  </button>
                  <button
                    onClick={() => handleSelectAllBtns(false)}
                    style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', padding: '0.35rem 0.65rem', borderRadius: '6px' }}
                  >
                    Nessuno
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {HEADER_BUTTON_OPTIONS.map(btn => {
                  const IconComponent = btn.icon;
                  return (
                    <label
                      key={btn.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: allowedButtons.includes(btn.id) ? '#f5f3ff' : '#f8fafc',
                        border: `1px solid ${allowedButtons.includes(btn.id) ? '#ddd6fe' : '#e2e8f0'}`,
                        transition: 'all 0.15s'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={allowedButtons.includes(btn.id)}
                        onChange={() => handleToggleBtn(btn.id)}
                        style={{ width: '1.15rem', height: '1.15rem', cursor: 'pointer', accentColor: '#6366f1' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        {IconComponent && <IconComponent size={20} color={btn.color} />}
                        <span style={{ fontSize: '0.925rem', color: allowedButtons.includes(btn.id) ? '#5b21b6' : '#334155', fontWeight: allowedButtons.includes(btn.id) ? '600' : '400' }}>
                          {btn.label}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Card: Filtri di Ricerca */}
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ background: '#f0fdf4', padding: '0.45rem', borderRadius: '8px', display: 'flex' }}>
                    <Shield size={20} color="#16a34a" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: '700' }}>Filtri di Ricerca Visibili</h3>
                    <span style={{ fontSize: '0.825rem', color: '#64748b' }}>Filtri abilitati per gli utenti Visitatori</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button
                    onClick={() => handleSelectAll(true)}
                    style={{ background: '#f1f5f9', border: 'none', color: '#16a34a', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', padding: '0.35rem 0.65rem', borderRadius: '6px' }}
                  >
                    Tutti
                  </button>
                  <button
                    onClick={() => handleSelectAll(false)}
                    style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', padding: '0.35rem 0.65rem', borderRadius: '6px' }}
                  >
                    Nessuno
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.6rem' }}>
                {FILTER_OPTIONS.map(filter => (
                  <label
                    key={filter.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.7rem 0.85rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: allowedFilters.includes(filter.id) ? '#f0fdf4' : '#f8fafc',
                      border: `1px solid ${allowedFilters.includes(filter.id) ? '#bbf7d0' : '#e2e8f0'}`,
                      transition: 'all 0.15s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={allowedFilters.includes(filter.id)}
                      onChange={() => handleToggle(filter.id)}
                      style={{ width: '1.15rem', height: '1.15rem', cursor: 'pointer', accentColor: '#16a34a' }}
                    />
                    <span style={{ fontSize: '0.9rem', color: allowedFilters.includes(filter.id) ? '#14532d' : '#334155', fontWeight: allowedFilters.includes(filter.id) ? '600' : '400' }}>
                      {filter.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Floating Bottom Save Bar */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid #e2e8f0',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 100,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.06)'
        }}>
          <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {message.text ? (
                <span style={{ color: message.type === 'success' ? '#16a34a' : message.type === 'error' ? '#dc2626' : '#2563eb', fontWeight: '600', fontSize: '0.95rem' }}>
                  {message.text}
                </span>
              ) : (
                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  Ricordati di salvare le modifiche apportate alle impostazioni.
                </span>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '0.75rem 2rem',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                transition: 'all 0.2s'
              }}
            >
              {saving ? (
                <span>Salvataggio in corso...</span>
              ) : (
                <>
                  <Save size={20} /> Salva Tutte le Modifiche
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
