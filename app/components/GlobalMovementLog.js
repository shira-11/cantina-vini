'use client';
import { useState, useEffect } from 'react';
import { X, Loader2, ArrowRightCircle, ArrowLeftCircle, User, Edit3, Trash2, Sparkles, RefreshCw, Search } from 'lucide-react';

export default function GlobalMovementLog({ isOpen, onClose }) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'stock' | 'edits'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchMovements();
    }
  }, [isOpen]);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/movements/global?limit=300');
      const data = await res.json();
      if (data.movements) {
        setMovements(data.movements);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Classifica i tipi di movimento
  const isEditType = (type) => {
    if (!type) return false;
    const t = type.toLowerCase();
    return t.includes('modifica') || t.includes('eliminazione') || t.includes('creazione') || t.includes('scheda');
  };

  const filteredMovements = movements.filter(m => {
    // Filtro per Tab Sezione
    if (activeTab === 'stock' && isEditType(m.movementType)) return false;
    if (activeTab === 'edits' && !isEditType(m.movementType)) return false;

    // Filtro per Barra di Ricerca interna
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const wineName = (m.wine?.name || '').toLowerCase();
      const producer = (m.wine?.producer || '').toLowerCase();
      const user = (m.user || '').toLowerCase();
      const notes = (m.notes || '').toLowerCase();
      const reason = (m.reason || '').toLowerCase();
      const location = (m.location?.name || '').toLowerCase();
      
      const match = wineName.includes(q) || producer.includes(q) || user.includes(q) || notes.includes(q) || reason.includes(q) || location.includes(q);
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px', width: '100%', height: '90vh', display: 'flex', flexDirection: 'column', padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
        
        {/* Header Modal */}
        <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'white' }}>📋 Registro Attività Globale</h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Storico completo di carichi, scarichi, modifiche ed eliminazioni degli utenti
              </p>
            </div>
            <button className="btn btn-close" onClick={onClose} style={{ color: 'white', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', padding: '0.5rem' }}><X size={20} /></button>
          </div>

          {/* Sezione Filtri Tab (Tutti, Carichi/Scarichi, Sezione Modifiche) */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: '0.45rem 0.9rem', borderRadius: '8px', border: 'none',
                backgroundColor: activeTab === 'all' ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                color: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
                transition: 'all 0.2s'
              }}
            >
              🌐 Tutti ({movements.length})
            </button>

            <button
              onClick={() => setActiveTab('stock')}
              style={{
                padding: '0.45rem 0.9rem', borderRadius: '8px', border: 'none',
                backgroundColor: activeTab === 'stock' ? '#10b981' : 'rgba(255,255,255,0.1)',
                color: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
                transition: 'all 0.2s'
              }}
            >
              📦 Carichi & Scarichi
            </button>

            <button
              onClick={() => setActiveTab('edits')}
              style={{
                padding: '0.45rem 0.9rem', borderRadius: '8px', border: 'none',
                backgroundColor: activeTab === 'edits' ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
                color: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '0.35rem'
              }}
            >
              <Edit3 size={15} /> Sezione Modifiche & Eliminazioni
            </button>
          </div>

          {/* Campo di Ricerca Interno */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Filtra per vino, utente, cantina o nota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem 0.55rem 2.3rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: 'white',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>
        </div>
        
        {/* Lista Eventi */}
        <div style={{ padding: '1rem', overflowY: 'auto', flex: 1, backgroundColor: '#f1f5f9' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}><Loader2 className="animate-spin" size={36} color="#4f46e5" /></div>
          ) : filteredMovements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <p style={{ fontSize: '1rem', fontWeight: '500', margin: 0 }}>Nessun evento registrato in questa sezione.</p>
              {searchQuery && <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Prova a modificare la ricerca "{searchQuery}".</p>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredMovements.map(m => {
                const typeLower = (m.movementType || '').toLowerCase();
                const isIngresso = m.movementType === 'Ingresso';
                const isUscita = m.movementType === 'Uscita';
                const isEliminazione = typeLower.includes('eliminazione');
                const isModificaMovimento = typeLower.includes('modifica movimento');
                const isModifica = typeLower.includes('modifica') || typeLower.includes('scheda');

                let icon = <Edit3 size={18} />;
                let badgeBg = '#eff6ff';
                let badgeColor = '#2563eb';
                let badgeBorder = '#bfdbfe';
                let label = 'Modifica Scheda';
                let quantityStr = '';

                if (isIngresso) {
                  icon = <ArrowRightCircle size={18} />;
                  badgeBg = '#f0fdf4';
                  badgeColor = '#16a34a';
                  badgeBorder = '#bbf7d0';
                  label = 'Carico Bottiglie';
                  quantityStr = `+${m.quantity} bt`;
                } else if (isUscita) {
                  icon = <ArrowLeftCircle size={18} />;
                  badgeBg = '#fef2f2';
                  badgeColor = '#dc2626';
                  badgeBorder = '#fecaca';
                  label = 'Scarico Bottiglie';
                  quantityStr = `-${m.quantity} bt`;
                } else if (isEliminazione) {
                  icon = <Trash2 size={18} />;
                  badgeBg = '#fff7ed';
                  badgeColor = '#c2410c';
                  badgeBorder = '#ffedd5';
                  label = 'Eliminazione Movimento';
                  quantityStr = '';
                } else if (isModificaMovimento) {
                  icon = <RefreshCw size={18} />;
                  badgeBg = '#fefce8';
                  badgeColor = '#ca8a04';
                  badgeBorder = '#fef08a';
                  label = 'Modifica Movimento';
                  quantityStr = '';
                } else if (m.reason === 'Nuova Scheda Vino') {
                  icon = <Sparkles size={18} />;
                  badgeBg = '#f3e8ff';
                  badgeColor = '#7e22ce';
                  badgeBorder = '#e9d5ff';
                  label = 'Nuova Scheda Vino';
                  quantityStr = '';
                }

                return (
                  <div key={m.id} style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '10px', 
                    padding: '0.9rem 1.1rem', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center'
                  }}>
                    {/* Thumbnail Immagine Vino */}
                    <div style={{ width: '54px', height: '54px', flexShrink: 0, backgroundColor: '#f8fafc', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {m.wine?.photo ? (
                        <img src={m.wine.photo} alt={m.wine.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ fontSize: '22px', opacity: 0.3 }}>🍷</div>
                      )}
                    </div>
                    
                    {/* Informazioni Operazione */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '500' }}>
                          📅 {new Date(m.date).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {m.user && (
                          <span style={{ fontSize: '0.78rem', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <User size={12}/> {m.user}
                          </span>
                        )}
                      </div>

                      <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.wine?.name || 'Vino Sconosciuto'} {m.wine?.vintage && <span style={{ fontWeight: '400', color: '#64748b' }}>({m.wine.vintage})</span>}
                      </div>

                      <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.15rem' }}>
                        {m.wine?.producer && <span>Prod: <strong>{m.wine.producer}</strong> | </span>}
                        {m.location?.name && <span>Cantina: <strong>{m.location.name}</strong></span>}
                      </div>

                      {(m.notes || m.reason) && (
                        <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.35rem', backgroundColor: '#f8fafc', padding: '0.3rem 0.55rem', borderRadius: '6px', borderLeft: '3px solid #cbd5e1' }}>
                          💬 {m.notes || m.reason}
                        </div>
                      )}
                    </div>

                    {/* Badge Stato e Quantità */}
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'flex-end',
                      gap: '0.35rem',
                      flexShrink: 0
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        border: `1px solid ${badgeBorder}`
                      }}>
                        {icon} {label}
                      </span>
                      {quantityStr && (
                        <span style={{ fontSize: '1.1rem', fontWeight: '800', color: badgeColor }}>
                          {quantityStr}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
