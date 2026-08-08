import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wine, Search, Monitor, Filter, X, Loader2, Plus, Settings, Shield, History, LogOut, Mic } from 'lucide-react';
import { getCountryFlag, getBadgeClass, getStockBreakdown } from '../utils/wineHelpers';
import { StockCell } from './StockCell';

export const MobileCatalog = ({
  wines,
  loading,
  search,
  setSearch,
  filters,
  setFilters,
  onWineClick,
  canViewFilter,
  setForceDesktop,
  uniqueCountries,
  uniqueRegions,
  uniqueProducerCellars,
  uniqueProducers,
  uniqueClassifications,
  uniqueCategories,
  uniqueLocations,
  uniqueBottleTypes,
  currentUser,
  setIsGlobalLogOpen
}) => {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setSpeechSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    }
  }, []);

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Il tuo telefono non supporta la ricerca vocale.");
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'it-IT';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onresult = (event) => {
      let transcript = event.results[0][0].transcript.toLowerCase();
      
      const newFilters = { ...filters };

      // Extract dynamic filters from existing wines data
      const extractDynamicFilter = (field, list) => {
        // Sort by length descending to match longest phrases first (e.g. "Pinot Nero" before "Pinot")
        const sortedList = [...list].sort((a, b) => b.length - a.length);
        for (const item of sortedList) {
          if (!item) continue;
          // Escape regex characters
          const safeItem = item.toLowerCase().replace(/[-\/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&');
          const regex = new RegExp(`\\\\b${safeItem}\\\\b`, 'g');
          if (regex.test(transcript)) {
            newFilters[field] = item;
            transcript = transcript.replace(regex, '').replace(/\\s+/g, ' ').trim();
            break;
          }
        }
      };

      const uniqueCountries = [...new Set(wines.map(w => w.country).filter(Boolean))];
      const uniqueRegions = [...new Set(wines.map(w => w.region).filter(Boolean))];
      const uniqueClassifications = [...new Set(wines.map(w => w.classification).filter(Boolean))];
      const uniqueBottleTypes = [...new Set(wines.map(w => w.bottleType).filter(Boolean))];
      const uniqueProducerCellars = [...new Set(wines.map(w => w.producerCellar).filter(Boolean))];
      const uniqueProducers = [...new Set(wines.map(w => w.producer).filter(Boolean))];

      extractDynamicFilter('country', uniqueCountries);
      extractDynamicFilter('region', uniqueRegions);
      extractDynamicFilter('classification', uniqueClassifications);
      extractDynamicFilter('bottleType', uniqueBottleTypes);
      extractDynamicFilter('producerCellar', uniqueProducerCellars);
      extractDynamicFilter('producer', uniqueProducers);

      // Handle specific mappings for locations and categories (synonyms)
      const locMap = {
        "cantina milano": "Cantina Milano",
        "milano": "Cantina Milano",
        "cantina arezzo": "Cantina Arezzo",
        "arezzo": "Cantina Arezzo",
        "cantina saint moritz": "Cantina Saint Moritz",
        "saint moritz": "Cantina Saint Moritz",
        "cantina levanzo": "Cantina Levanzo",
        "levanzo": "Cantina Levanzo"
      };
      
      const catMap = {
        "bianco": "Bianco",
        "rosso": "Rosso",
        "champagne": "Champagne",
        "passito": "Passito",
        "moscato": "Moscato",
        "rosè": "Rosè",
        "rosé": "Rosè",
        "rose": "Rosè",
        "franciacorta": "Franciacorta",
        "prosecco": "Prosecco",
        "spumante secco": "Spumante Secco",
        "spumante dolce": "Spumante Dolce"
      };
      
      for (const [key, val] of Object.entries(catMap)) {
        const regex = new RegExp(`\\\\b${key}\\\\b`, 'g');
        if (regex.test(transcript)) {
          newFilters.category = val;
          transcript = transcript.replace(regex, '').replace(/\\s+/g, ' ').trim();
          break;
        }
      }

      for (const [key, val] of Object.entries(locMap)) {
        if (transcript.includes(key)) {
          newFilters.location = val;
          transcript = transcript.replace(key, '').replace(/\\s+/g, ' ').trim();
          break;
        }
      }
      
      setFilters(newFilters);
      setSearch(transcript);
    };
    
    recognition.onerror = (event) => {
      console.error("Errore riconoscimento vocale:", event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };

  // Reset visible count when wines list changes (e.g., due to filters/search)
  React.useEffect(() => {
    // eslint-disable-next-line
    setVisibleCount(20);
  }, [wines]);

  const visibleWines = wines.slice(0, visibleCount);

  // Prevent background scrolling when filters modal is open
  React.useEffect(() => {
    if (showFilters) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showFilters]);


  return (
    <div style={{ padding: '1rem', backgroundColor: '#e2e8f0', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 
          onClick={() => {
            setSearch('');
            setFilters({
              country: '',
              region: '',
              producerCellar: '',
              producer: '',
              classification: '',
              category: '',
              location: '',
              bottleType: ''
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{ fontSize: '1.5rem', margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
          title="Torna alla Home e resetta filtri"
        >
          <Wine size={24} color="#6366f1" /> CANTINA
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {currentUser?.username && (
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
              {currentUser.username}
            </span>
          )}
          {currentUser?.role === 'admin' && (
            <>
              <button 
                onClick={() => router.push('/wine/new')}
                style={{ background: 'none', border: 'none', color: '#10b981', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0.25rem' }}
                title="Aggiungi Vino"
              >
                <Plus size={22} />
              </button>
              <button 
                onClick={() => setIsGlobalLogOpen(true)}
                style={{ background: 'none', border: 'none', color: '#3b82f6', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0.25rem' }}
                title="Cronologia Movimenti"
              >
                <History size={22} />
              </button>
              <button 
                onClick={() => router.push('/admin/users')}
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0.25rem' }}
                title="Gestione Utenti"
              >
                <Shield size={22} />
              </button>
              <button 
                onClick={() => router.push('/admin/settings')}
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0.25rem' }}
                title="Impostazioni Visitatore"
              >
                <Settings size={22} />
              </button>
            </>
          )}
          <button 
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            style={{ background: 'none', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', padding: '0.25rem' }}
            title="Esci dal gestionale"
          >
            <LogOut size={22} color="#ef4444" />
            <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: '600' }}>Esci</span>
          </button>
          {currentUser?.role !== 'viewer' && (
            <button 
              onClick={() => setForceDesktop(true)}
              style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', padding: '0.25rem' }}
              title="Passa alla visualizzazione Desktop"
            >
              <Monitor size={20} />
              <span style={{ fontSize: '0.85rem' }}>Desktop</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text"
            placeholder="Cerca vino..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: `0.75rem ${speechSupported ? '4rem' : '2.5rem'} 0.75rem 2.5rem`, borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}
          />
          {speechSupported && (
            <button 
              onClick={startVoiceSearch}
              title="Ricerca vocale"
              style={{
                background: 'none',
                border: 'none',
                padding: '0',
                cursor: 'pointer',
                position: 'absolute',
                right: search ? '36px' : '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: isListening ? '#ef4444' : '#94a3b8',
                animation: isListening ? 'pulse 1.5s infinite' : 'none'
              }}
            >
              <Mic size={18} />
            </button>
          )}
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 0 }}
            >
              <X size={18} />
            </button>
          )}
        </div>
        <button 
          onClick={() => setShowFilters(true)}
          style={{ marginLeft: '0.5rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.75rem', display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#475569' }}
        >
          <Filter size={20} />
        </button>
      </div>

      {/* Wine List */}
      <div style={{ paddingBottom: '2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <Loader2 className="spinner" size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <p>Caricamento vini...</p>
          </div>
        ) : wines.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Wine size={48} style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
            <h3>Nessun vino trovato</h3>
            <p style={{ fontSize: '0.9rem' }}>Prova a cambiare i filtri di ricerca.</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>
              Trovati {wines.length} vini
            </div>
            {visibleWines.map(wine => (
            <div 
              key={wine.id}
              onClick={() => onWineClick(wine.id)}
              style={{ background: 'white', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', gap: '1rem', cursor: 'pointer' }}
            >
              {/* Photo placeholder or image */}
              <div style={{ width: '80px', height: '100px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {wine.photo ? (
                  <img src={wine.photo} alt={wine.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <Wine size={32} color="#cbd5e1" />
                )}
              </div>
              
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {wine.name}
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span>{getCountryFlag(wine.country)} {wine.country || ''}</span>
                  {wine.category && <span className={getBadgeClass(wine.category)} style={{ transform: 'scale(0.8)', transformOrigin: 'left center' }}>{wine.category}</span>}
                  {wine.vintage && <span style={{ fontWeight: '600', color: '#334155' }}>Annata: {wine.vintage}</span>}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#475569' }}>
                  Cantina: <span style={{ fontWeight: '500' }}>{wine.producerCellar || '-'}</span>
                </div>
                <div style={{ marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                  {(() => {
                    const breakdown = getStockBreakdown([wine]);
                    if (breakdown.length === 0) {
                      return (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Giacenza:</span>
                          <span className="stock-zero" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>0 bt.</span>
                        </div>
                      );
                    }
                    return breakdown.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>{item.loc}</span>
                        <span className="stock-positive" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{item.qty} bt.</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          ))}
          {visibleCount < wines.length && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button
                onClick={() => setVisibleCount(prev => prev + 20)}
                style={{
                  padding: '0.75rem 2rem',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '24px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Mostra altri ({wines.length - visibleCount})
              </button>
            </div>
          )}
          </>
        )}
      </div>

      {/* Filters Modal */}
      {showFilters && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000 }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '1.5rem', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Filtri</h2>
              <button onClick={() => setShowFilters(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
            </div>

            {/* Same filters as desktop but stacked vertically */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {canViewFilter('location') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>Cantina Fisica</label>
                  <select value={filters.location || ''} onChange={e => setFilters({ ...filters, location: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="">Tutte</option>
                    {uniqueLocations.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              )}

              {canViewFilter('country') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>Nazione</label>
                  <select value={filters.country} onChange={e => setFilters({ ...filters, country: e.target.value, region: '' })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="">Tutte</option>
                    {uniqueCountries.map(c => <option key={c} value={c}>{getCountryFlag(c)} {c}</option>)}
                  </select>
                </div>
              )}

              {canViewFilter('region') && filters.country && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>Regione</label>
                  <select value={filters.region} onChange={e => setFilters({ ...filters, region: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="">Tutte</option>
                    {uniqueRegions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}

              {canViewFilter('producerCellar') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>Cantina Produttrice</label>
                  <select value={filters.producerCellar} onChange={e => setFilters({ ...filters, producerCellar: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="">Tutte</option>
                    {uniqueProducerCellars.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              )}

              {canViewFilter('producer') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>Produttore</label>
                  <select value={filters.producer || ''} onChange={e => setFilters({ ...filters, producer: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="">Tutti</option>
                    {uniqueProducers.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              )}

              {canViewFilter('classification') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>Classificazione</label>
                  <select value={filters.classification} onChange={e => setFilters({ ...filters, classification: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="">Tutte</option>
                    {uniqueClassifications.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              {canViewFilter('category') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>Categoria (es. Rosso)</label>
                  <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="">Tutte</option>
                    {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              
              {canViewFilter('bottleType') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>Tipo Bottiglia</label>
                  <select value={filters.bottleType || ''} onChange={e => setFilters({ ...filters, bottleType: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="">Tutte</option>
                    {uniqueBottleTypes.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              )}

              {canViewFilter('availability') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>Disponibilità</label>
                  <select value={filters.availability} onChange={e => setFilters({ ...filters, availability: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="">Tutte</option>
                    <option value="available">Solo Disponibili</option>
                    <option value="unavailable">Giacenze Non Disponibili</option>
                  </select>
                </div>
              )}

              {canViewFilter('photo') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>Foto</label>
                  <select value={filters.photo || ''} onChange={e => setFilters({ ...filters, photo: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="">Tutte</option>
                    <option value="with_photo">Con Foto</option>
                    <option value="without_photo">Senza Foto</option>
                  </select>
                </div>
              )}

              <div style={{ marginTop: '1rem' }}>
                <button 
                  onClick={() => {
                    setFilters({ country: '', region: '', producerCellar: '', producer: '', classification: '', category: '', location: '', availability: '', photo: '', bottleType: '' });
                    setSearch('');
                  }}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', fontSize: '1rem', marginBottom: '0.5rem', cursor: 'pointer' }}
                >
                  🔄 Azzera Filtri
                </button>
                <button 
                  onClick={() => setShowFilters(false)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#6366f1', color: 'white', border: 'none', fontSize: '1rem', fontWeight: '500', cursor: 'pointer' }}
                >
                  Applica e Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
