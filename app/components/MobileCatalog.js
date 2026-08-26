import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wine, Search, Monitor, Filter, X, Loader2, Plus, Settings, Shield, History, LogOut, Mic, CheckSquare, QrCode } from 'lucide-react';
import { getCountryFlag, getBadgeClass, getStockBreakdown, correctSpokenWineTranscript, getWineSearchSuggestions } from '../utils/wineHelpers';
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
  canViewButton,
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
  setIsGlobalLogOpen,
  enableSearchAutocomplete = true,
  onOpenQRScanner,
  onOpenQRModal
}) => {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(30);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = getWineSearchSuggestions(search, wines, 8);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setSpeechSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    }
  }, []);

  // Infinite scroll automatic loading
  React.useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        setVisibleCount(prev => (prev < wines.length ? Math.min(prev + 30, wines.length) : prev));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [wines.length]);

  // Reset count when filters change
  React.useEffect(() => {
    setVisibleCount(30);
  }, [filters, wines.length]);

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Il tuo telefono non supporta la ricerca vocale.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'it-IT';
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let rawTranscript = event.results[0][0].transcript;
      if (event.results[0].length > 1) {
        for (let k = 0; k < event.results[0].length; k++) {
          const alt = event.results[0][k].transcript;
          if (alt) {
            rawTranscript = alt;
            break;
          }
        }
      }

      let transcript = correctSpokenWineTranscript(rawTranscript, wines);

      const newFilters = { ...filters };

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
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        if (regex.test(transcript)) {
          newFilters.category = val;
          transcript = transcript.replace(regex, '').replace(/\s+/g, ' ').trim();
          break;
        }
      }

      const locMap = {
        "cantina milano": "Cantina Milano",
        "cantina arezzo": "Cantina Arezzo",
        "cantina saint moritz": "Cantina Saint Moritz",
        "cantina levanzo": "Cantina Levanzo"
      };

      for (const [key, val] of Object.entries(locMap)) {
        if (transcript.includes(key)) {
          newFilters.location = val;
          transcript = transcript.replace(key, '').replace(/\s+/g, ' ').trim();
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

  const filteredMobileWines = wines.filter(w => {
    if (!search || !search.trim()) return true;
    const q = search.toLowerCase().trim();
    const idMatch = String(w.id) === q;
    const nameMatch = w.name?.toLowerCase().includes(q);
    const producerMatch = (w.producerCellar || w.producer || '')?.toLowerCase().includes(q);
    const vintageMatch = String(w.vintage || '').toLowerCase().includes(q);
    const categoryMatch = w.category?.toLowerCase().includes(q);
    const countryMatch = w.country?.toLowerCase().includes(q);
    const regionMatch = w.region?.toLowerCase().includes(q);
    const classificationMatch = w.classification?.toLowerCase().includes(q);
    return idMatch || nameMatch || producerMatch || vintageMatch || categoryMatch || countryMatch || regionMatch || classificationMatch;
  });

  // Reset visible count when wines list changes (e.g., due to filters/search)
  React.useEffect(() => {
    // eslint-disable-next-line
    setVisibleCount(20);
  }, [wines, search]);

  const visibleWines = filteredMobileWines.slice(0, visibleCount);

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
    <div style={{ backgroundColor: '#e2e8f0', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      {/* Sticky Header & Search Area */}
      <div
        className="sticky-top-header"
        style={{
          paddingTop: '0.75rem',
          paddingBottom: '0.75rem',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          borderBottom: '2px solid #cbd5e1',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h1
            onClick={() => {
              if (typeof window !== 'undefined' && window.location.pathname !== '/') {
                window.location.href = '/';
              } else {
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
              }
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
                  onClick={() => router.push('/inventory')}
                  style={{ background: 'none', border: 'none', color: '#10b981', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0.25rem' }}
                  title="Inventario Fisico"
                >
                  <CheckSquare size={22} />
                </button>
                <button
                  onClick={() => router.push('/admin/users')}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: 'var(--primary-color)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', padding: '0.25rem 0.5rem' }}
                  title="Gestione Utenti"
                >
                  <Shield size={18} />
                  <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Utenti</span>
                </button>
                <button
                  onClick={() => router.push('/admin/settings')}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: 'var(--primary-color)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', padding: '0.25rem 0.5rem' }}
                  title="Impostazioni Visitatore"
                >
                  <Settings size={18} />
                  <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Impostazioni</span>
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

        {/* Search Bar with Autocomplete Suggestions */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: search ? '#10b981' : '#94a3b8' }} />
            <input
              type="text"
              placeholder="Cerca vino..."
              value={search}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSuggestions(true);
              }}
              style={{
                width: '100%',
                padding: `0.75rem ${speechSupported ? '3.5rem' : '2.5rem'} 0.75rem 2.5rem`,
                borderRadius: '12px',
                border: search ? '2px solid #10b981' : '1px solid #cbd5e1',
                backgroundColor: search ? '#ecfdf5' : 'white',
                color: search ? '#047857' : 'inherit',
                fontWeight: search ? 'bold' : 'normal',
                fontSize: '1rem',
                outline: 'none'
              }}
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
                  color: isListening ? '#ef4444' : (search ? '#10b981' : '#94a3b8'),
                  animation: isListening ? 'pulse 1.5s infinite' : 'none'
                }}
              >
                <Mic size={18} />
              </button>
            )}
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setShowSuggestions(false);
                }}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', display: 'flex', alignItems: 'center', padding: 0 }}
              >
                <X size={18} />
              </button>
            )}

            {/* Google-style Autocomplete Dropdown */}
            {enableSearchAutocomplete !== false && showSuggestions && suggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  zIndex: 100,
                  marginTop: '6px',
                  overflow: 'hidden'
                }}
              >
                {suggestions.map((s, idx) => (
                  <div
                    key={idx}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearch(s.text);
                      setShowSuggestions(false);
                    }}
                    style={{
                      padding: '0.65rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      cursor: 'pointer',
                      borderBottom: idx < suggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                      fontSize: '0.9rem',
                      color: '#1e293b'
                    }}
                  >
                    <Wine size={16} color="#8b5cf6" style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 600 }}>{s.text}</span>
                    {s.subtext && (
                      <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 'auto' }}>
                        {s.subtext}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Pulsante dedicato QR Scanner per Smartphone */}
          {(!canViewButton || canViewButton('qr_scanner')) && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onOpenQRScanner) onOpenQRScanner();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onOpenQRScanner) onOpenQRScanner();
              }}
              title="Scansiona QR Code da Fotocamera"
              style={{
                marginLeft: '0.4rem',
                background: '#e0e7ff',
                color: '#4f46e5',
                border: '1px solid #a5b4fc',
                borderRadius: '10px',
                padding: '0.75rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                touchAction: 'manipulation'
              }}
            >
              <QrCode size={20} />
            </button>
          )}
          {(() => {
            const activeFiltersCount = Object.values(filters).filter(Boolean).length;
            return (
              <button
                onClick={() => setShowFilters(true)}
                style={{
                  marginLeft: '0.4rem',
                  background: activeFiltersCount > 0 ? '#ecfdf5' : '#f1f5f9',
                  border: activeFiltersCount > 0 ? '2px solid #10b981' : '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  color: activeFiltersCount > 0 ? '#047857' : '#475569',
                  fontWeight: activeFiltersCount > 0 ? 'bold' : 'normal',
                  flexShrink: 0
                }}
              >
                <Filter size={20} color={activeFiltersCount > 0 ? '#10b981' : '#475569'} />
                {activeFiltersCount > 0 && (
                  <span style={{ background: '#10b981', color: 'white', borderRadius: '50%', padding: '0.1rem 0.45rem', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            );
          })()}
        </div>

        {/* Wine Count Line */}
        {!loading && (
          <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>
            Trovati {wines.length} vini
          </div>
        )}
      </div>

      {/* Wine List */}
      <div style={{ padding: '1rem', paddingBottom: '2rem' }}>
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
                    {(wine.vintage || wine.bottleType) && (
                      <span style={{ fontWeight: '600', color: '#334155' }}>
                        {wine.vintage ? `Annata: ${wine.vintage}` : ''} {wine.bottleType ? `(${wine.bottleType})` : ''}
                      </span>
                    )}
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
              <div style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: '2rem' }}>
                <button
                  onClick={() => setVisibleCount(prev => Math.min(prev + 40, wines.length))}
                  style={{
                    padding: '0.75rem 2rem',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '24px',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  <span>🔄 Caricamento automatico... ({wines.length - visibleCount} rimanenti)</span>
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

            {/* Visual Touch Chips for fast 1-tap filtering */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {canViewFilter('location') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 'bold', color: filters.location ? '#047857' : '#334155' }}>
                    {filters.location ? '🟢 ' : ''}Cantina Fisica
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {['', ...uniqueLocations].map(l => {
                      const isSelected = (filters.location || '') === l;
                      const label = l ? l.replace(/^cantina\s+/i, '') : 'Tutte';
                      return (
                        <button
                          key={l || 'all'}
                          type="button"
                          onClick={() => setFilters({ ...filters, location: l })}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '20px',
                            border: isSelected && l ? '2px solid #10b981' : (isSelected ? '2px solid #6366f1' : '1px solid #cbd5e1'),
                            backgroundColor: isSelected && l ? '#ecfdf5' : (isSelected ? '#eeeffe' : '#f8fafc'),
                            color: isSelected && l ? '#047857' : (isSelected ? '#4338ca' : '#475569'),
                            fontWeight: isSelected ? 'bold' : 'normal',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {canViewFilter('country') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 'bold', color: filters.country ? '#047857' : '#334155' }}>
                    {filters.country ? '🟢 ' : ''}Nazione
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}>
                    {['', ...uniqueCountries].map(c => {
                      const isSelected = (filters.country || '') === c;
                      const label = c ? `${getCountryFlag(c)} ${c}` : 'Tutte';
                      return (
                        <button
                          key={c || 'all'}
                          type="button"
                          onClick={() => setFilters({ ...filters, country: c, region: '' })}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '20px',
                            border: isSelected && c ? '2px solid #10b981' : (isSelected ? '2px solid #6366f1' : '1px solid #cbd5e1'),
                            backgroundColor: isSelected && c ? '#ecfdf5' : (isSelected ? '#eeeffe' : '#f8fafc'),
                            color: isSelected && c ? '#047857' : (isSelected ? '#4338ca' : '#475569'),
                            fontWeight: isSelected ? 'bold' : 'normal',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {canViewFilter('region') && filters.country && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 'bold', color: filters.region ? '#047857' : '#334155' }}>
                    {filters.region ? '🟢 ' : ''}Regione ({filters.country})
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}>
                    {['', ...uniqueRegions].map(r => {
                      const isSelected = (filters.region || '') === r;
                      const label = r || 'Tutte';
                      return (
                        <button
                          key={r || 'all'}
                          type="button"
                          onClick={() => setFilters({ ...filters, region: r })}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '20px',
                            border: isSelected && r ? '2px solid #10b981' : (isSelected ? '2px solid #6366f1' : '1px solid #cbd5e1'),
                            backgroundColor: isSelected && r ? '#ecfdf5' : (isSelected ? '#eeeffe' : '#f8fafc'),
                            color: isSelected && r ? '#047857' : (isSelected ? '#4338ca' : '#475569'),
                            fontWeight: isSelected ? 'bold' : 'normal',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {canViewFilter('category') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 'bold', color: filters.category ? '#047857' : '#334155' }}>
                    {filters.category ? '🟢 ' : ''}Categoria
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {['', ...uniqueCategories].map(cat => {
                      const isSelected = (filters.category || '') === cat;
                      const label = cat || 'Tutte';
                      return (
                        <button
                          key={cat || 'all'}
                          type="button"
                          onClick={() => setFilters({ ...filters, category: cat })}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '20px',
                            border: isSelected && cat ? '2px solid #10b981' : (isSelected ? '2px solid #6366f1' : '1px solid #cbd5e1'),
                            backgroundColor: isSelected && cat ? '#ecfdf5' : (isSelected ? '#eeeffe' : '#f8fafc'),
                            color: isSelected && cat ? '#047857' : (isSelected ? '#4338ca' : '#475569'),
                            fontWeight: isSelected ? 'bold' : 'normal',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {canViewFilter('availability') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 'bold', color: filters.availability ? '#047857' : '#334155' }}>
                    {filters.availability ? '🟢 ' : ''}Disponibilità
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {[
                      { value: '', label: 'Tutte' },
                      { value: 'available', label: 'Solo Disponibili' },
                      { value: 'unavailable', label: 'Giacenze Non Disponibili' }
                    ].map(opt => {
                      const isSelected = (filters.availability || '') === opt.value;
                      return (
                        <button
                          key={opt.value || 'all'}
                          type="button"
                          onClick={() => setFilters({ ...filters, availability: opt.value })}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '20px',
                            border: isSelected && opt.value ? '2px solid #10b981' : (isSelected ? '2px solid #6366f1' : '1px solid #cbd5e1'),
                            backgroundColor: isSelected && opt.value ? '#ecfdf5' : (isSelected ? '#eeeffe' : '#f8fafc'),
                            color: isSelected && opt.value ? '#047857' : (isSelected ? '#4338ca' : '#475569'),
                            fontWeight: isSelected ? 'bold' : 'normal',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {canViewFilter('producerCellar') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: filters.producerCellar ? '#047857' : '#475569', fontWeight: filters.producerCellar ? 'bold' : 'normal' }}>
                    {filters.producerCellar ? '🟢 ' : ''}Cantina Produttrice
                  </label>
                  <select
                    value={filters.producerCellar}
                    onChange={e => setFilters({ ...filters, producerCellar: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: filters.producerCellar ? '2px solid #10b981' : '1px solid #cbd5e1',
                      backgroundColor: filters.producerCellar ? '#ecfdf5' : 'white',
                      color: filters.producerCellar ? '#047857' : 'inherit',
                      fontWeight: filters.producerCellar ? 'bold' : 'normal'
                    }}
                  >
                    <option value="">Tutte</option>
                    {uniqueProducerCellars.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              )}

              {canViewFilter('producer') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: filters.producer ? '#047857' : '#475569', fontWeight: filters.producer ? 'bold' : 'normal' }}>
                    {filters.producer ? '🟢 ' : ''}Produttore
                  </label>
                  <select
                    value={filters.producer || ''}
                    onChange={e => setFilters({ ...filters, producer: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: filters.producer ? '2px solid #10b981' : '1px solid #cbd5e1',
                      backgroundColor: filters.producer ? '#ecfdf5' : 'white',
                      color: filters.producer ? '#047857' : 'inherit',
                      fontWeight: filters.producer ? 'bold' : 'normal'
                    }}
                  >
                    <option value="">Tutti</option>
                    {uniqueProducers.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              )}

              {canViewFilter('classification') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: filters.classification ? '#047857' : '#475569', fontWeight: filters.classification ? 'bold' : 'normal' }}>
                    {filters.classification ? '🟢 ' : ''}Classificazione
                  </label>
                  <select
                    value={filters.classification}
                    onChange={e => setFilters({ ...filters, classification: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: filters.classification ? '2px solid #10b981' : '1px solid #cbd5e1',
                      backgroundColor: filters.classification ? '#ecfdf5' : 'white',
                      color: filters.classification ? '#047857' : 'inherit',
                      fontWeight: filters.classification ? 'bold' : 'normal'
                    }}
                  >
                    <option value="">Tutte</option>
                    {uniqueClassifications.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              {canViewFilter('bottleType') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: filters.bottleType ? '#047857' : '#475569', fontWeight: filters.bottleType ? 'bold' : 'normal' }}>
                    {filters.bottleType ? '🟢 ' : ''}Tipo Bottiglia
                  </label>
                  <select
                    value={filters.bottleType || ''}
                    onChange={e => setFilters({ ...filters, bottleType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: filters.bottleType ? '2px solid #10b981' : '1px solid #cbd5e1',
                      backgroundColor: filters.bottleType ? '#ecfdf5' : 'white',
                      color: filters.bottleType ? '#047857' : 'inherit',
                      fontWeight: filters.bottleType ? 'bold' : 'normal'
                    }}
                  >
                    <option value="">Tutte</option>
                    {uniqueBottleTypes.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              )}

              {canViewFilter('photo') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 'bold', color: filters.photo ? '#047857' : '#334155' }}>
                    {filters.photo ? '🟢 ' : ''}Foto
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {[
                      { value: '', label: 'Tutte' },
                      { value: 'with_photo', label: 'Con Foto 📷' },
                      { value: 'without_photo', label: 'Senza Foto' }
                    ].map(opt => {
                      const isSelected = (filters.photo || '') === opt.value;
                      return (
                        <button
                          key={opt.value || 'all'}
                          type="button"
                          onClick={() => setFilters({ ...filters, photo: opt.value })}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '20px',
                            border: isSelected && opt.value ? '2px solid #10b981' : (isSelected ? '2px solid #6366f1' : '1px solid #cbd5e1'),
                            backgroundColor: isSelected && opt.value ? '#ecfdf5' : (isSelected ? '#eeeffe' : '#f8fafc'),
                            color: isSelected && opt.value ? '#047857' : (isSelected ? '#4338ca' : '#475569'),
                            fontWeight: isSelected ? 'bold' : 'normal',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
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
