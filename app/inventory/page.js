'use client';
// Version 1.0.4 - Clean Wine Titles without Camera Icon or Underline

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Wine, CheckCircle2, AlertTriangle, Plus, Search,
  Printer, Save, Check, RefreshCw, XCircle, FileText, Calendar,
  ChevronDown, ChevronUp, Layers, CheckSquare, ShieldCheck, Camera, Trash2
} from 'lucide-react';

export default function InventoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState([]);

  // Photo preview hover state
  const [hoveredPhoto, setHoveredPhoto] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const photoTimerRef = useRef(null);
  const [photoPreviewSeconds, setPhotoPreviewSeconds] = useState(3);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.photoPreviewSeconds) {
          setPhotoPreviewSeconds(data.photoPreviewSeconds);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const showWinePhotoNearElement = (e, photoUrl) => {
    if (!photoUrl) return;
    if (e && e.stopPropagation) e.stopPropagation();

    if (photoTimerRef.current) {
      clearTimeout(photoTimerRef.current);
      photoTimerRef.current = null;
    }

    let posX = 0;
    let posY = 0;

    if (e && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      posY = rect.bottom + 12;
      posX = Math.max(10, rect.left + 20);

      if (typeof window !== 'undefined' && posX + 250 > window.innerWidth) {
        posX = Math.max(10, window.innerWidth - 260);
      }
    } else if (e) {
      posX = e.clientX + 20;
      posY = e.clientY + 20;
    }

    setMousePos({ x: posX || 200, y: posY || 200 });
    setHoveredPhoto(photoUrl);
  };

  const startPhotoHideTimerAfterLeave = () => {
    if (photoTimerRef.current) {
      clearTimeout(photoTimerRef.current);
    }
    photoTimerRef.current = setTimeout(() => {
      setHoveredPhoto(null);
      photoTimerRef.current = null;
    }, photoPreviewSeconds * 1000);
  };
  
  // Modal for new inventory
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMonth, setNewMonth] = useState(() => {
    const months = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    return months[new Date().getMonth()];
  });
  const [newYear, setNewYear] = useState(() => new Date().getFullYear());
  const [newNotes, setNewNotes] = useState('');
  const [newLocId, setNewLocId] = useState('');

  // Counting workspace state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all'); // 'all', 'pending', 'done', 'discrepancy'
  const [selectedLocFilter, setSelectedLocFilter] = useState('');
  const [items, setItems] = useState([]);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  const userAllowedLocations = (() => {
    if (!currentUser || currentUser.role === 'admin' || !currentUser.allowedLocations || currentUser.allowedLocations === 'ALL') {
      return null;
    }
    try {
      const parsed = JSON.parse(currentUser.allowedLocations);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch(e) {}
    return null;
  })();

  const availableLocations = userAllowedLocations
    ? locations.filter(l => userAllowedLocations.includes(l.name))
    : locations;

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setCurrentUser(data.user);
          if (data.user.role !== 'admin' && data.user.canAccessInventory === false) {
            alert('Accesso negato: non disponi delle autorizzazioni per accedere alla funzione Inventario Fisico.');
            router.push('/');
            return;
          }
        }
      })
      .catch(console.error);
    fetchSessions();
    fetchLocations();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        // Automatically select first in_progress session if exists
        const inProgress = data.find(s => s.status === 'in_progress');
        if (inProgress) {
          loadSessionDetails(inProgress.id);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSessionDetails = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/inventory/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data);
        setItems(data.items || []);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle || `Inventario ${newYear}`,
          year: newYear,
          notes: newNotes,
          locationId: newLocId || null
        })
      });

      if (res.ok) {
        const newSess = await res.json();
        setShowNewModal(false);
        setNewTitle('');
        setNewNotes('');
        await fetchSessions();
        await loadSessionDetails(newSess.id);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert("Errore durante la creazione della sessione d'inventario: " + (errData.error || res.statusText));
      }
      setSaving(false);
    } catch (err) {
      console.error(err);
      alert("Errore di rete: " + err.message);
      setSaving(false);
    }
  };

  const handleUpdateItemCount = (itemId, countedQty, isChecked = true) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          countedQty: countedQty !== null ? Math.max(0, parseInt(countedQty) || 0) : null,
          isChecked: isChecked
        };
      }
      return item;
    }));
  };

  const handleConfirmExpected = (itemId, expectedQty) => {
    handleUpdateItemCount(itemId, expectedQty, true);
  };

  const handleSaveDraft = async () => {
    if (!activeSession) return;
    try {
      setSaving(true);
      const payloadItems = items.map(i => ({
        id: i.id,
        countedQty: i.countedQty,
        isChecked: i.isChecked,
        notes: i.notes
      }));

      const res = await fetch(`/api/inventory/${activeSession.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payloadItems })
      });

      if (res.ok) {
        const updated = await res.json();
        setActiveSession(updated);
        setItems(updated.items || []);
        alert("Bozza inventario salvata con successo!");
      } else {
        alert("Errore durante il salvataggio della bozza.");
      }
      setSaving(false);
    } catch (err) {
      console.error(err);
      alert("Errore di salvataggio: " + err.message);
      setSaving(false);
    }
  };

  const handleFinalizeSession = async () => {
    if (!activeSession) return;
    try {
      setSaving(true);
      // Save items first
      const payloadItems = items.map(i => ({
        id: i.id,
        countedQty: i.countedQty,
        isChecked: i.isChecked,
        notes: i.notes
      }));

      await fetch(`/api/inventory/${activeSession.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payloadItems })
      });

      // Finalize session
      const res = await fetch(`/api/inventory/${activeSession.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finalize' })
      });

      if (res.ok) {
        const result = await res.json();
        setShowFinalizeModal(false);
        alert(`Inventario completato! ${result.movementsCreated} movimenti di rettifica applicati.`);
        await fetchSessions();
        setActiveSession(null);
      } else {
        alert("Errore nella chiusura dell'inventario.");
      }
      setSaving(false);
    } catch (err) {
      console.error(err);
      alert("Errore durante la chiusura: " + err.message);
      setSaving(false);
    }
  };

  const handleCancelSession = async () => {
    if (!activeSession) return;
    if (!confirm("Sei sicuro di voler annullare questa sessione d'inventario? Le rettifiche non verranno applicate.")) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/inventory/${activeSession.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      });

      if (res.ok) {
        alert("Inventario annullato.");
        await fetchSessions();
        setActiveSession(null);
      }
      setSaving(false);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const handleDeleteSession = async (sessionIdToDelete, e) => {
    if (e) e.stopPropagation();
    const idToDelete = sessionIdToDelete || activeSession?.id;
    if (!idToDelete) return;

    if (!confirm("Sei sicuro di voler eliminare definitivamente questa sessione d'inventario e tutte le sue righe? L'operazione è irreversibile.")) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/inventory/${idToDelete}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert("Sessione d'inventario eliminata con successo!");
        if (activeSession && activeSession.id === idToDelete) {
          setActiveSession(null);
          setItems([]);
        }
        await fetchSessions();
      } else {
        alert("Errore durante l'eliminazione dell'inventario.");
      }
      setSaving(false);
    } catch (err) {
      console.error(err);
      alert("Errore elimina inventario: " + err.message);
      setSaving(false);
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const wine = item.wine || {};
    const loc = item.location || {};
    
    // Text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = wine.name?.toLowerCase().includes(q);
      const matchVintage = wine.vintage?.toLowerCase().includes(q);
      const matchProducer = wine.producer?.toLowerCase().includes(q);
      const matchLoc = loc.name?.toLowerCase().includes(q);
      if (!matchName && !matchVintage && !matchProducer && !matchLoc) return false;
    }

    // Location filter
    if (selectedLocFilter && loc.name !== selectedLocFilter) return false;
    if (userAllowedLocations && loc.name && !userAllowedLocations.includes(loc.name)) return false;

    // Tab filter
    if (selectedTab === 'pending' && item.isChecked) return false;
    if (selectedTab === 'done' && !item.isChecked) return false;
    if (selectedTab === 'discrepancy') {
      if (item.countedQty === null) return false;
      if (item.countedQty === item.expectedQty) return false;
    }

    return true;
  });

  // Calculate session stats
  const totalCount = items.length;
  const checkedCount = items.filter(i => i.isChecked).length;
  const pendingCount = totalCount - checkedCount;
  const discrepancyCount = items.filter(i => i.countedQty !== null && i.countedQty !== i.expectedQty).length;
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  // Group filtered items by Wine Name
  const groupedItems = new Map();
  for (const item of filteredItems) {
    const name = item.wine ? item.wine.name : 'Vino sconosciuto';
    if (!groupedItems.has(name)) {
      groupedItems.set(name, []);
    }
    groupedItems.get(name).push(item);
  }

  const handleOpenNewModal = () => {
    const months = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    const curM = months[new Date().getMonth()];
    const curY = new Date().getFullYear();
    setNewMonth(curM);
    setNewYear(curY);

    if (userAllowedLocations && availableLocations.length > 0) {
      const firstLoc = availableLocations[0];
      setNewLocId(String(firstLoc.id));
      setNewTitle(`Inventario ${curM} ${curY} - ${firstLoc.name}`);
    } else {
      setNewLocId('');
      setNewTitle(`Inventario ${curM} ${curY}`);
    }
    setShowNewModal(true);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'Arial, sans-serif' }}>
      {/* Top Header Bar */}
      <header style={{
        backgroundColor: '#1e293b',
        color: 'white',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} onClick={() => router.push('/')}>
          <ArrowLeft size={24} color="white" />
          <Wine size={28} color="#3b82f6" />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>INVENTARIO FISICO</h1>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Conteggio e rettifica giacenze cantina</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handleOpenNewModal}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <Plus size={18} /> Nuovo Inventario
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={32} className="spin" style={{ marginBottom: '12px' }} />
            <div>Caricamento inventario in corso...</div>
          </div>
        ) : !activeSession ? (
          /* Session Selection Dashboard */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 'bold' }}>Sessioni di Inventario</h2>
                <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
                  Seleziona una sessione attiva o avviane una nuova per iniziare il conteggio delle bottiglie.
                </div>
              </div>
            </div>

            {sessions.length === 0 ? (
              <div style={{
                background: 'white',
                border: '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '48px 24px',
                textAlign: 'center'
              }}>
                <FileText size={48} color="#94a3b8" style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 8px 0' }}>Nessun Inventario Registrato</h3>
                <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 20px auto' }}>
                  Non hai ancora avviato nessuna sessione di conteggio fisico per le tue cantine.
                </p>
                <button
                  onClick={handleOpenNewModal}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  ➕ Avvia Nuovo Inventario
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                {sessions.map(s => {
                  const isInProgress = s.status === 'in_progress';
                  const isCompleted = s.status === 'completed';
                  const isCancelled = s.status === 'cancelled';
                  const progress = s.totalItems > 0 ? Math.round((s.checkedItems / s.totalItems) * 100) : 0;

                  return (
                    <div
                      key={s.id}
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        padding: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: isInProgress ? '#ecfdf5' : isCompleted ? '#eff6ff' : '#f1f5f9',
                            color: isInProgress ? '#047857' : isCompleted ? '#1d4ed8' : '#64748b',
                            border: isInProgress ? '1px solid #a7f3d0' : isCompleted ? '1px solid #bfdbfe' : '1px solid #cbd5e1'
                          }}>
                            {isInProgress ? '🔄 IN CORSO' : isCompleted ? '✅ COMPLETATO' : '❌ ANNULLATO'}
                          </span>
                          <span style={{ fontSize: '13px', color: '#64748b' }}>
                            <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                            {new Date(s.createdAt).toLocaleDateString('it-IT')}
                          </span>
                        </div>

                        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', color: '#0f172a' }}>{s.title}</h3>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4338ca', backgroundColor: '#e0e7ff', border: '1px solid #c7d2fe', padding: '3px 8px', borderRadius: '6px', display: 'inline-block', marginBottom: '10px' }}>
                          📍 Cantina: {s.locationName || 'Tutte le Cantine'}
                        </div>
                        {s.notes && <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>{s.notes}</div>}

                        <div style={{ margin: '16px 0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>
                            <span>Avanzamento Conteggio</span>
                            <span>{s.checkedItems} / {s.totalItems} ({progress}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${progress}%`, height: '100%', backgroundColor: isInProgress ? '#10b981' : '#3b82f6', transition: 'width 0.3s' }}></div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#475569', margin: '12px 0' }}>
                          <div>Teoriche: <strong>{s.totalExpected} bt.</strong></div>
                          <div>Contate: <strong>{s.totalCounted} bt.</strong></div>
                          {s.hasDiscrepancy && (
                            <div style={{ color: '#d97706', fontWeight: 'bold' }}>⚠️ Discrepanze</div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                          onClick={() => loadSessionDetails(s.id)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: isInProgress ? '#3b82f6' : '#f1f5f9',
                            color: isInProgress ? 'white' : '#1e293b',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          {isInProgress ? '📱 Continua Conteggio' : '👁️ Visualizza Dettagli'}
                        </button>
                        <button
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          title="Elimina Inventario"
                          style={{
                            padding: '10px 14px',
                            backgroundColor: '#fff1f2',
                            color: '#e11d48',
                            border: '1px solid #fecdd3',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Trash2 size={16} /> Elimina
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Active Inventory Workspace */
          <div>
            {/* Session Top Bar */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 'bold' }}>{activeSession.title}</h2>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: activeSession.status === 'in_progress' ? '#ecfdf5' : '#eff6ff',
                      color: activeSession.status === 'in_progress' ? '#047857' : '#1d4ed8'
                    }}>
                      {activeSession.status === 'in_progress' ? '🔄 In Corso' : '✅ Completato'}
                    </span>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: '#e0e7ff',
                      color: '#4338ca',
                      border: '1px solid #c7d2fe'
                    }}>
                      📍 Cantina: {activeSession.locationName || (items[0]?.location?.name || 'Tutte le Cantine')}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                    Data Avvio: {new Date(activeSession.createdAt).toLocaleDateString('it-IT')} | Totale Vini e Annate: {totalCount}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setActiveSession(null)}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      color: '#334155',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title="Torna alla lista delle sessioni di inventario"
                  >
                    📂 Elenco Sessioni
                  </button>

                  <button
                    onClick={() => window.open(`/print/inventario?sessionId=${activeSession.id}`, '_blank')}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      color: '#334155',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title="Stampa foglio spunta per conteggio a penna"
                  >
                    <Printer size={16} /> Foglio Cartaceo (PDF)
                  </button>

                  {activeSession.status === 'in_progress' && (
                    <>
                      <button
                        onClick={handleSaveDraft}
                        disabled={saving}
                        style={{
                          padding: '8px 14px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Save size={16} /> Salva Bozza
                      </button>

                      <button
                        onClick={() => setShowFinalizeModal(true)}
                        disabled={saving}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <ShieldCheck size={18} /> Applica Rettifica & Chiudi
                      </button>

                      <button
                        onClick={handleCancelSession}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#fef2f2',
                          color: '#ef4444',
                          border: '1px solid #fca5a5',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                        title="Annulla sessione"
                      >
                        Annulla
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Progress Bar & Stat Badges */}
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', fontWeight: 'bold' }}>
                  <span>Avanzamento del Conteggio</span>
                  <span style={{ color: progressPercent === 100 ? '#059669' : '#2563eb' }}>
                    {checkedCount} di {totalCount} verificati ({progressPercent}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: progressPercent === 100 ? '#10b981' : '#3b82f6', transition: 'width 0.3s' }}></div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                  <div style={{ padding: '6px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px' }}>
                    🌐 Totale: <strong>{totalCount}</strong>
                  </div>
                  <div style={{ padding: '6px 12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', fontSize: '12px', color: '#065f46' }}>
                    🟢 Inventariati: <strong>{checkedCount}</strong>
                  </div>
                  <div style={{ padding: '6px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12px', color: '#991b1b' }}>
                    🔴 Da Inventariare: <strong>{pendingCount}</strong>
                  </div>
                  <div style={{ padding: '6px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '12px', color: '#92400e' }}>
                    ⚠️ Discrepanze: <strong>{discrepancyCount}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Tabs & Search Controls */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                {/* Search Bar */}
                <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
                  <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Cerca per nome vino, annata, produttore o cantina..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 38px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Location Filter */}
                <select
                  value={selectedLocFilter}
                  onChange={e => setSelectedLocFilter(e.target.value)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    background: 'white',
                    color: '#334155'
                  }}
                >
                  <option value="">Tutte le Cantine / Posizioni</option>
                  {availableLocations.map(l => (
                    <option key={l.id} value={l.name}>{l.name}</option>
                  ))}
                </select>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setSelectedTab('all')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    background: selectedTab === 'all' ? '#1e293b' : '#f1f5f9',
                    color: selectedTab === 'all' ? 'white' : '#64748b'
                  }}
                >
                  🌐 Tutti ({totalCount})
                </button>
                <button
                  onClick={() => setSelectedTab('pending')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    background: selectedTab === 'pending' ? '#ef4444' : '#fef2f2',
                    color: selectedTab === 'pending' ? 'white' : '#b91c1c'
                  }}
                >
                  🔴 Da Inventariare ({pendingCount})
                </button>
                <button
                  onClick={() => setSelectedTab('done')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    background: selectedTab === 'done' ? '#10b981' : '#ecfdf5',
                    color: selectedTab === 'done' ? 'white' : '#047857'
                  }}
                >
                  🟢 Già Inventariati ({checkedCount})
                </button>
                <button
                  onClick={() => setSelectedTab('discrepancy')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    background: selectedTab === 'discrepancy' ? '#f59e0b' : '#fffbeb',
                    color: selectedTab === 'discrepancy' ? 'white' : '#b45309'
                  }}
                >
                  ⚠️ Discrepanze ({discrepancyCount})
                </button>
              </div>
            </div>

            {/* Checklist items list */}
            {groupedItems.size === 0 ? (
              <div style={{ background: 'white', padding: '32px', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>
                Nessun vino trovato con i filtri selezionati.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Array.from(groupedItems.entries()).map(([wineName, itemsInGroup]) => {
                  const groupPhoto = itemsInGroup.find(i => i.wine?.photo)?.wine?.photo;
                  return (
                    <div
                      key={wineName}
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                      }}
                    >
                      {/* Wine Group Title */}
                      <div style={{
                        backgroundColor: '#f8fafc',
                        padding: '12px 16px',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Wine size={20} color="#3b82f6" />
                          <h3
                            onClick={(e) => groupPhoto && showWinePhotoNearElement(e, groupPhoto)}
                            onMouseEnter={(e) => groupPhoto && showWinePhotoNearElement(e, groupPhoto)}
                            onMouseLeave={startPhotoHideTimerAfterLeave}
                            style={{
                              margin: 0,
                              fontSize: '1.1rem',
                              color: '#0f172a',
                              fontWeight: 'bold',
                              cursor: groupPhoto ? 'pointer' : 'default'
                            }}
                            title={groupPhoto ? "Passa il mouse o tocca per vedere la foto della bottiglia" : ""}
                          >
                            {wineName}
                          </h3>
                          <span style={{ fontSize: '12px', color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px' }}>
                            {itemsInGroup.length} {itemsInGroup.length === 1 ? 'annata/formato' : 'annate/formati'}
                          </span>
                        </div>
                      </div>

                    {/* Vintages Checklist Rows */}
                    <div style={{ divideY: '1px solid #f1f5f9' }}>
                      {itemsInGroup.map(item => {
                        const wine = item.wine || {};
                        const loc = item.location || {};
                        const isDone = item.isChecked;
                        const counted = item.countedQty;
                        const expected = item.expectedQty || 0;
                        const diff = counted !== null ? counted - expected : 0;
                        const isDiscrepant = counted !== null && diff !== 0;

                        return (
                          <div
                            key={item.id}
                            style={{
                              padding: '14px 16px',
                              display: 'flex',
                              justify: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '12px',
                              backgroundColor: isDone ? '#fafafa' : 'white',
                              borderBottom: '1px solid #f1f5f9'
                            }}
                          >
                            {/* Vintage Info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1', minWidth: '220px' }}>
                              <div
                                onClick={() => handleUpdateItemCount(item.id, item.countedQty !== null ? item.countedQty : expected, !isDone)}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '6px',
                                  border: isDone ? '2px solid #10b981' : '2px solid #cbd5e1',
                                  backgroundColor: isDone ? '#10b981' : 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  flexShrink: 0
                                }}
                              >
                                {isDone && <Check size={16} color="white" />}
                              </div>

                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span
                                    onClick={(e) => (wine.photo || groupPhoto) && showWinePhotoNearElement(e, wine.photo || groupPhoto)}
                                    onMouseEnter={(e) => (wine.photo || groupPhoto) && showWinePhotoNearElement(e, wine.photo || groupPhoto)}
                                    onMouseLeave={startPhotoHideTimerAfterLeave}
                                    style={{
                                      fontSize: '13px',
                                      fontWeight: 'bold',
                                      padding: '2px 8px',
                                      backgroundColor: '#e0f2fe',
                                      color: '#0369a1',
                                      borderRadius: '4px',
                                      cursor: (wine.photo || groupPhoto) ? 'pointer' : 'default'
                                    }}
                                    title={(wine.photo || groupPhoto) ? "Passa il mouse o tocca per vedere la foto" : ""}
                                  >
                                    Annata {wine.vintage || 'S.A.'}
                                  </span>

                                  {wine.bottleType && (
                                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>
                                      {wine.bottleType}
                                    </span>
                                  )}

                                  {loc.name && (
                                    <span style={{ fontSize: '12px', color: '#047857', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
                                      📍 {loc.name}
                                    </span>
                                  )}
                                </div>
                                {wine.producer && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{wine.producer}</div>}
                              </div>
                            </div>

                            {/* Stock Comparison & Inputs */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              {/* Computer Expected Stock */}
                              <div style={{ textAlign: 'center', minWidth: '80px' }}>
                                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Teorico PC</div>
                                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#334155' }}>
                                  {expected} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>bt.</span>
                                </div>
                              </div>

                              {/* Action button to confirm expected quantity */}
                              {activeSession.status === 'in_progress' && (
                                <button
                                  onClick={() => handleConfirmExpected(item.id, expected)}
                                  style={{
                                    padding: '6px 10px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    borderRadius: '6px',
                                    border: isDone && !isDiscrepant ? '2px solid #10b981' : '1px solid #cbd5e1',
                                    backgroundColor: isDone && !isDiscrepant ? '#ecfdf5' : 'white',
                                    color: isDone && !isDiscrepant ? '#047857' : '#475569',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title="Conferma la giacenza teorica di computer"
                                >
                                  {isDone && !isDiscrepant ? '✅ OK (' + expected + ')' : 'Conferma ' + expected}
                                </button>
                              )}

                              {/* Actual Counted Stepper / Input */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {activeSession.status === 'in_progress' && (
                                  <button
                                    onClick={() => handleUpdateItemCount(item.id, (counted !== null ? counted : expected) - 1, true)}
                                    style={{
                                      width: '30px',
                                      height: '30px',
                                      borderRadius: '6px',
                                      border: '1px solid #cbd5e1',
                                      background: '#f8fafc',
                                      fontWeight: 'bold',
                                      fontSize: '16px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    -
                                  </button>
                                )}

                                <input
                                  type="number"
                                  min="0"
                                  placeholder="Reale"
                                  value={counted !== null ? counted : ''}
                                  disabled={activeSession.status !== 'in_progress'}
                                  onChange={e => {
                                    const val = e.target.value === '' ? null : parseInt(e.target.value);
                                    handleUpdateItemCount(item.id, val, true);
                                  }}
                                  style={{
                                    width: '60px',
                                    textAlign: 'center',
                                    padding: '6px 4px',
                                    borderRadius: '6px',
                                    border: isDiscrepant ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                                    fontSize: '15px',
                                    fontWeight: 'bold',
                                    backgroundColor: isDiscrepant ? '#fffbeb' : counted !== null ? '#f0fdf4' : 'white'
                                  }}
                                />

                                {activeSession.status === 'in_progress' && (
                                  <button
                                    onClick={() => handleUpdateItemCount(item.id, (counted !== null ? counted : expected) + 1, true)}
                                    style={{
                                      width: '30px',
                                      height: '30px',
                                      borderRadius: '6px',
                                      border: '1px solid #cbd5e1',
                                      background: '#f8fafc',
                                      fontWeight: 'bold',
                                      fontSize: '16px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    +
                                  </button>
                                )}
                              </div>

                              {/* Discrepancy Indicator Badge */}
                              <div style={{ minWidth: '70px', textAlign: 'right' }}>
                                {counted !== null ? (
                                  diff === 0 ? (
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#059669', background: '#ecfdf5', padding: '3px 8px', borderRadius: '10px' }}>
                                      OK
                                    </span>
                                  ) : (
                                    <span style={{
                                      fontSize: '12px',
                                      fontWeight: 'bold',
                                      color: diff > 0 ? '#d97706' : '#dc2626',
                                      background: diff > 0 ? '#fffbeb' : '#fef2f2',
                                      padding: '3px 8px',
                                      borderRadius: '10px',
                                      border: diff > 0 ? '1px solid #fde68a' : '1px solid #fecaca'
                                    }}>
                                      {diff > 0 ? `+${diff}` : diff}
                                    </span>
                                  )
                                ) : (
                                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Da contare</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Modalita Nuovo Inventario */}
      {showNewModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.3rem', fontWeight: 'bold', color: '#0f172a' }}>
              ➕ Avvia Nuovo Inventario Fisico
            </h2>

            <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#1e293b' }}>
                  🏬 Seleziona Cantina / Posizione da Inventariare:
                </label>
                <select
                  value={newLocId}
                  onChange={e => {
                    const selectedId = e.target.value;
                    setNewLocId(selectedId);
                    const selectedLoc = locations.find(l => String(l.id) === String(selectedId));
                    if (selectedLoc) {
                      setNewTitle(`Inventario ${newYear} - ${selectedLoc.name}`);
                    } else {
                      setNewTitle(`Inventario ${newYear}`);
                    }
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '2px solid #6366f1', fontSize: '14px', boxSizing: 'border-box', background: '#f8fafc', fontWeight: 'bold', color: '#312e81' }}
                >
                  {!userAllowedLocations && <option value="">🏢 Tutte le Cantine (Generale)</option>}
                  {availableLocations.map(l => (
                    <option key={l.id} value={l.id}>📍 {l.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                  Titolo Sessione Inventario:
                </label>
                <input
                  type="text"
                  placeholder={`es. Inventario ${newYear} o Inventario Fine Anno`}
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              {/* Mese e Anno di Riferimento */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#1e293b' }}>
                    Mese Riferimento:
                  </label>
                  <select
                    value={newMonth}
                    onChange={e => {
                      const m = e.target.value;
                      setNewMonth(m);
                      const selectedLoc = locations.find(l => String(l.id) === String(newLocId));
                      const locSuffix = selectedLoc ? ` - ${selectedLoc.name}` : '';
                      setNewTitle(`Inventario ${m} ${newYear}${locSuffix}`);
                    }}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', background: 'white' }}
                  >
                    {["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#1e293b' }}>
                    Anno Riferimento:
                  </label>
                  <input
                    type="number"
                    value={newYear}
                    onChange={e => {
                      const y = parseInt(e.target.value) || new Date().getFullYear();
                      setNewYear(y);
                      const selectedLoc = locations.find(l => String(l.id) === String(newLocId));
                      const locSuffix = selectedLoc ? ` - ${selectedLoc.name}` : '';
                      setNewTitle(`Inventario ${newMonth} ${y}${locSuffix}`);
                    }}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                  Note o Dettagli Operatore:
                </label>
                <textarea
                  rows="2"
                  placeholder="es. Conteggio scaffali cantina principale"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {saving ? 'Creazione...' : 'Crea e Inizia Conteggio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chiusura e Rettifica Automatica */}
      {showFinalizeModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '1.3rem', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck color="#10b981" size={24} /> Conferma Chiusura & Rettifica Inventario
            </h2>

            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              Stai per completare l'inventario <strong>"{activeSession?.title}"</strong>. L'applicazione confronterà i tuoi numeri reali con la giacenza di computer ed effettuerà le rettifiche automatiche.
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span>Vini Verificati:</span>
                <strong>{checkedCount} / {totalCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span>Discrepanze che genereranno rettifiche:</span>
                <strong style={{ color: discrepancyCount > 0 ? '#d97706' : '#059669' }}>
                  {discrepancyCount} vini/annate
                </strong>
              </div>
            </div>

            {pendingCount > 0 && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#991b1b', marginBottom: '16px' }}>
                ⚠️ Attenzione: Ci sono ancora <strong>{pendingCount} vini</strong> non ancora inventariati. Se prosegui, verranno mantenute le giacenze teoriche attuali per questi vini.
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setShowFinalizeModal(false)}
                style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Torna al Conteggio
              </button>
              <button
                type="button"
                onClick={handleFinalizeSession}
                disabled={saving}
                style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {saving ? 'Applicazione...' : 'Applica Rettifiche e Chiudi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottle Photo Preview Popup */}
      {hoveredPhoto && (
        <div
          onMouseEnter={() => {
            if (photoTimerRef.current) {
              clearTimeout(photoTimerRef.current);
              photoTimerRef.current = null;
            }
          }}
          onMouseLeave={() => {
            setHoveredPhoto(null);
          }}
          onClick={() => setHoveredPhoto(null)}
          style={{
            position: 'fixed',
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            zIndex: 99999,
            backgroundColor: 'white',
            padding: '8px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
            pointerEvents: 'auto',
            cursor: 'pointer',
            border: '2px solid #3b82f6',
            maxWidth: '240px'
          }}
        >
          <img
            src={hoveredPhoto}
            alt="Anteprima bottiglia"
            style={{
              maxWidth: '220px',
              maxHeight: '300px',
              width: 'auto',
              height: 'auto',
              borderRadius: '8px',
              display: 'block',
              objectFit: 'contain',
              margin: '0 auto'
            }}
          />
        </div>
      )}
    </div>
  );
}
