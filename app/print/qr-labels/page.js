'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, QrCode, Filter, Search, ChevronLeft, ChevronRight, Layers, Eye } from 'lucide-react';
import QRCode from 'qrcode';
import { getCountryFlag } from '../../utils/wineHelpers';

export default function PrintQRLabelsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [wines, setWines] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(14); // 14 etichette per foglio A4 (grid 2x7 su 2 colonne)
  const [selectedWineIdsFilter, setSelectedWineIdsFilter] = useState(null);
  const [qrCodesMap, setQrCodesMap] = useState({}); // wineId -> dataUrl
  const [viewMode, setViewMode] = useState('paginated'); // 'paginated' | 'all'
  const [allowAll, setAllowAll] = useState(false);

  // Carica i vini selezionati dalla Home Page (da URL query string o sessionStorage)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const selectedParam = searchParams.get('selected');
      if (selectedParam) {
        const ids = selectedParam
          .split(',')
          .map(id => parseInt(id, 10))
          .filter(id => !isNaN(id) && id > 0);
        if (ids.length > 0) {
          setSelectedWineIdsFilter(ids);
          return;
        }
      }
      const stored = sessionStorage.getItem('selectedWineIds');
      if (stored) {
        try {
          const ids = JSON.parse(stored);
          if (Array.isArray(ids) && ids.length > 0) {
            const parsedIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id) && id > 0);
            if (parsedIds.length > 0) {
              setSelectedWineIdsFilter(parsedIds);
            }
          }
        } catch (e) {
          console.error("Errore lettura vini selezionati da sessionStorage:", e);
        }
      }
    }
  }, []);

  // Carica lista vini e cantine
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [winesRes, locsRes] = await Promise.all([
          fetch('/api/wines'),
          fetch('/api/locations')
        ]);

        if (winesRes.ok) {
          const winesData = await winesRes.json();
          setWines(winesData.filter(w => !w.isArchived));
        }

        if (locsRes.ok) {
          const locsData = await locsRes.json();
          setLocations(locsData);
        }
      } catch (err) {
        console.error("Errore caricamento dati per etichette QR:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtra i vini in base ai selezionati (o tutti se esplicitamente sbloccato)
  const hasSelection = selectedWineIdsFilter && selectedWineIdsFilter.length > 0;

  const filteredWines = wines.filter(wine => {
    if (hasSelection) {
      const selectedSet = new Set(selectedWineIdsFilter.map(Number));
      if (!selectedSet.has(Number(wine.id))) return false;
    } else if (!allowAll) {
      return false; // Se non ci sono selezionati e non è sbloccato 'allowAll', non mostrare nulla per salvare risorse CPU/RAM
    }

    if (selectedLocation !== 'all') {
      const locId = parseInt(selectedLocation, 10);
      const inLocation = wine.movements?.some(m => Number(m.locationId) === locId);
      if (!inLocation) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = wine.name?.toLowerCase().includes(q);
      const producerMatch = (wine.producerCellar || wine.producer || '')?.toLowerCase().includes(q);
      const vintageMatch = String(wine.vintage || '').toLowerCase().includes(q);
      const idMatch = String(wine.id) === q;
      if (!nameMatch && !producerMatch && !vintageMatch && !idMatch) return false;
    }

    return true;
  });

  // Dividi i vini filtrati in fogli A4 da `pageSize` etichette ciascuno
  const sheets = [];
  for (let i = 0; i < filteredWines.length; i += pageSize) {
    sheets.push(filteredWines.slice(i, i + pageSize));
  }
  const totalPages = sheets.length || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Reset pagina al cambio filtri
  const handleLocationChange = (e) => {
    setSelectedLocation(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Genera i QR Code SOLTANTO per i vini selezionati mostrati
  const filteredWineIdsKey = filteredWines.map(w => w.id).join(',');

  useEffect(() => {
    if (!filteredWineIdsKey || filteredWines.length === 0) {
      setQrCodesMap({});
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    let isCancelled = false;

    const generateQRs = async () => {
      const newMap = {};

      for (const wine of filteredWines) {
        if (isCancelled) break;
        try {
          const url = `${origin}/wine/${wine.id}`;
          const dataUrl = await QRCode.toDataURL(url, {
            width: 220,
            margin: 1,
            color: { dark: '#1e1b4b', light: '#ffffff' }
          });
          newMap[wine.id] = dataUrl;
        } catch (e) {
          console.error("Errore generazione QR per vino", wine.id, e);
        }
      }

      if (!isCancelled) {
        setQrCodesMap(newMap);
      }
    };

    generateQRs();

    return () => {
      isCancelled = true;
    };
  }, [filteredWineIdsKey]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '2.5rem', height: '2.5rem', borderWidth: '3px', borderColor: '#e2e8f0', borderBottomColor: '#6366f1', borderRadius: '50%', animation: 'rotation 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: '#64748b', fontWeight: '500' }}>Caricamento etichette QR Code...</p>
        </div>
      </div>
    );
  }

  // Se non ci sono vini selezionati con il tik e l'utente non ha richiesto esplicitamente di caricare tutti i vini
  if (!hasSelection && !allowAll) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ maxWidth: '620px', margin: '3rem auto', background: 'white', padding: '2.5rem', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          
          <div style={{ width: '64px', height: '64px', background: '#e0e7ff', color: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
            <QrCode size={32} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.75rem 0' }}>
            Nessun vino selezionato per la stampa QR
          </h2>

          <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>
            Per evitare di sovraccaricare il Mac generando centinaia di codici QR contemporaneamente, la stampa carica <strong>esclusivamente i vini selezionati con la spunta (tik)</strong> in Home Page.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={() => router.push('/')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#4f46e5', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)' }}
            >
              <ArrowLeft size={18} /> Vai alla Home Page e Seleziona i Vini
            </button>

            <button
              onClick={() => setAllowAll(true)}
              style={{ background: 'transparent', border: 'none', color: '#64748b', textDecoration: 'underline', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.5rem' }}
            >
              Oppure carica tutti i vini della cantina ({wines.length} vini)
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Barra di Controllo Toolbar (Nascosta durante la stampa) */}
      <div className="no-print" style={{ maxWidth: '1200px', margin: '0 auto 1.5rem auto', background: 'white', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Titolo Principale e Pulsante Stampa */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => router.push('/')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.55rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#334155' }}
            >
              <ArrowLeft size={18} /> Home
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.35rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <QrCode size={24} color="#6366f1" /> Stampa Etichette QR Code ({filteredWines.length} Selezionati)
              </h1>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                {filteredWines.length} etichette pronti per la stampa • {totalPages} {totalPages === 1 ? 'foglio A4' : 'fogli A4'} ({pageSize} etichette per foglio)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#4f46e5', color: 'white', border: 'none', padding: '0.65rem 1.35rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)' }}
            >
              <Printer size={18} /> Stampa Tutti i Fogli A4 ({filteredWines.length} etichette)
            </button>
          </div>
        </div>

        {/* Banner Informativo Selezionati */}
        {hasSelection && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#e0e7ff', border: '1px solid #c7d2fe', padding: '0.5rem 1rem', borderRadius: '8px', color: '#3730a3', fontWeight: '600', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem' }}>✓</span>
              <span>Stai stampando solo i <strong>{filteredWines.length} vini selezionati con il tik</strong> in Home Page</span>
            </div>
            <button
              onClick={() => {
                setSelectedWineIdsFilter(null);
                if (typeof window !== 'undefined') sessionStorage.removeItem('selectedWineIds');
                setAllowAll(true);
              }}
              style={{ background: '#4338ca', color: 'white', border: 'none', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Mostra Tutti i Vini
            </button>
          </div>
        )}

        {/* Barra Filtri, Formato A4 e Controlli Vista */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
          
          {/* Cerca Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '0.45rem 0.75rem', borderRadius: '8px', flex: 1, minWidth: '200px' }}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Cerca vino, produttore, annata..."
              value={searchQuery}
              onChange={handleSearchChange}
              style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '0.9rem', color: '#0f172a' }}
            />
          </div>

          {/* Filtro Cantina */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '0.45rem 0.75rem', borderRadius: '8px' }}>
            <Filter size={16} color="#64748b" />
            <select
              value={selectedLocation}
              onChange={handleLocationChange}
              style={{ border: 'none', background: 'transparent', fontWeight: '600', color: '#1e293b', outline: 'none', fontSize: '0.9rem' }}
            >
              <option value="all">Tutte le Cantine</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          {/* Selettore Layout Etichette per Foglio A4 (Sempre su 2 Colonne) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '0.45rem 0.75rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Etichette per A4:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              style={{ border: 'none', background: 'transparent', fontWeight: '600', color: '#1e293b', outline: 'none', fontSize: '0.9rem' }}
            >
              <option value={12}>12 etichette (2 Col. x 6 Righe - Grandi)</option>
              <option value={14}>14 etichette (2 Col. x 7 Righe - Standard A4)</option>
              <option value={16}>16 etichette (2 Col. x 8 Righe - Compatte)</option>
            </select>
          </div>

          {/* Toggle Modalità Vista Anteprima */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <button
              onClick={() => setViewMode('paginated')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.35rem 0.65rem', borderRadius: '6px', border: 'none',
                background: viewMode === 'paginated' ? 'white' : 'transparent',
                color: viewMode === 'paginated' ? '#4f46e5' : '#64748b',
                fontWeight: viewMode === 'paginated' ? '700' : '500',
                fontSize: '0.825rem', cursor: 'pointer',
                boxShadow: viewMode === 'paginated' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
              title="Mostra un foglio A4 alla volta sullo schermo"
            >
              <Eye size={15} /> Pagina Singola
            </button>
            <button
              onClick={() => setViewMode('all')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.35rem 0.65rem', borderRadius: '6px', border: 'none',
                background: viewMode === 'all' ? 'white' : 'transparent',
                color: viewMode === 'all' ? '#4f46e5' : '#64748b',
                fontWeight: viewMode === 'all' ? '700' : '500',
                fontSize: '0.825rem', cursor: 'pointer',
                boxShadow: viewMode === 'all' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
              title="Mostra tutti i fogli A4 uno sotto l'altro sullo schermo"
            >
              <Layers size={15} /> Tutti i Fogli A4 ({totalPages})
            </button>
          </div>

          {/* Controlli di Paginazione in Anteprima Pagina Singola */}
          {totalPages > 1 && viewMode === 'paginated' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
              <button
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.2rem',
                  padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1',
                  background: safeCurrentPage <= 1 ? '#f1f5f9' : 'white',
                  color: safeCurrentPage <= 1 ? '#94a3b8' : '#1e293b',
                  cursor: safeCurrentPage <= 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '600', fontSize: '0.85rem'
                }}
              >
                <ChevronLeft size={16} /> Prec
              </button>

              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', minWidth: '85px', textAlign: 'center' }}>
                Foglio {safeCurrentPage} / {totalPages}
              </span>

              <button
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.2rem',
                  padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1',
                  background: safeCurrentPage >= totalPages ? '#f1f5f9' : 'white',
                  color: safeCurrentPage >= totalPages ? '#94a3b8' : '#1e293b',
                  cursor: safeCurrentPage >= totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: '600', fontSize: '0.85rem'
                }}
              >
                Succ <ChevronRight size={16} />
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Area Fogli A4 per la Stampa e Anteprima */}
      {filteredWines.length === 0 ? (
        <div style={{ maxWidth: '210mm', margin: '0 auto', background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', color: '#64748b', border: '1px solid #e2e8f0' }}>
          Nessun vino trovato con i filtri correnti.
        </div>
      ) : (
        <div className="a4-sheets-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          {sheets.map((sheetWines, pageIdx) => {
            const pageNum = pageIdx + 1;
            const isVisibleOnScreen = viewMode === 'all' || pageNum === safeCurrentPage;

            return (
              <div
                key={`sheet-${pageIdx}`}
                className={`a4-sheet ${!isVisibleOnScreen ? 'sheet-hidden-screen' : ''}`}
                style={{
                  width: '210mm',
                  maxWidth: '210mm',
                  minHeight: '297mm',
                  margin: '0 auto',
                  background: 'white',
                  padding: '8mm',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.05)',
                  boxSizing: 'border-box',
                  position: 'relative'
                }}
              >
                {/* Intestazione Foglio solo per Schermo */}
                <div className="no-print" style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4mm', textTransform: 'uppercase', tracking: '0.05em', borderBottom: '1px dashed #e2e8f0', paddingBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Foglio A4 N° {pageNum} di {totalPages} (Formato 2 Colonne)</span>
                  <span>{sheetWines.length} Etichette</span>
                </div>

                {/* Grid 2 Colonne A4 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '4mm 6mm',
                  boxSizing: 'border-box'
                }}>
                  {sheetWines.map(wine => (
                    <div
                      key={wine.id}
                      style={{
                        border: '1px dashed #94a3b8',
                        borderRadius: '6px',
                        padding: pageSize <= 12 ? '4mm 5mm' : (pageSize <= 14 ? '3.5mm 4mm' : '2.5mm 3.5mm'),
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4mm',
                        background: '#ffffff',
                        boxSizing: 'border-box',
                        minHeight: pageSize <= 12 ? '41mm' : (pageSize <= 14 ? '35mm' : '30mm'),
                        pageBreakInside: 'avoid',
                        breakInside: 'avoid'
                      }}
                    >
                      {/* Immagine QR Code */}
                      {qrCodesMap[wine.id] ? (
                        <img
                          src={qrCodesMap[wine.id]}
                          alt={`QR Code Vino ID #${wine.id}`}
                          style={{
                            width: pageSize <= 12 ? '32mm' : (pageSize <= 14 ? '28mm' : '24mm'),
                            height: pageSize <= 12 ? '32mm' : (pageSize <= 14 ? '28mm' : '24mm'),
                            flexShrink: 0
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: pageSize <= 12 ? '32mm' : (pageSize <= 14 ? '28mm' : '24mm'),
                            height: pageSize <= 12 ? '32mm' : (pageSize <= 14 ? '28mm' : '24mm'),
                            background: '#f1f5f9',
                            borderRadius: '4px',
                            flexShrink: 0
                          }}
                        />
                      )}

                      {/* Informazioni Vino */}
                      <div style={{ overflow: 'hidden', flex: 1 }}>
                        <div style={{ fontSize: '9.5pt', fontWeight: 'bold', color: '#0f172a', lineHeight: 1.15, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {wine.name}
                        </div>
                        <div style={{ fontSize: '8pt', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '3px' }}>
                          {wine.producerCellar || wine.producer || ''}
                        </div>
                        <div style={{ fontSize: '8pt', color: '#334155', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{getCountryFlag(wine.country)}</span>
                          <span>Annata: {wine.vintage || 'S.A.'}</span>
                        </div>
                        <div style={{ display: 'inline-block', background: '#e0e7ff', color: '#4338ca', fontSize: '7pt', fontWeight: 'bold', padding: '1px 6px', borderRadius: '4px', marginTop: '3px' }}>
                          ID: #{wine.id}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Regole CSS per la Stampa A4 */}
      <style jsx global>{`
        @media screen {
          .sheet-hidden-screen {
            display: none !important;
          }
        }

        @media print {
          .no-print {
            display: none !important;
          }
          html, body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .a4-sheets-wrapper {
            gap: 0 !important;
            display: block !important;
          }
          .sheet-hidden-screen {
            display: block !important;
          }
          .a4-sheet {
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .a4-sheet:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 8mm 8mm 8mm;
          }
        }
      `}</style>
    </div>
  );
}


