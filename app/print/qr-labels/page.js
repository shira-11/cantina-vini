'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, QrCode, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import QRCode from 'qrcode';

export default function PrintQRLabelsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [wines, setWines] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24); // 24 etichette per foglio A4 (grid 3x8)
  const [qrCodesMap, setQrCodesMap] = useState({}); // wineId -> dataUrl

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
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter wines by location and search query
  const filteredWines = wines.filter(wine => {
    if (selectedLocation !== 'all') {
      const locId = parseInt(selectedLocation, 10);
      const inLocation = wine.movements?.some(m => m.locationId === locId);
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

  // Calculate pagination
  const totalPages = Math.ceil(filteredWines.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedWines = filteredWines.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  // Reset page when filters change
  const handleLocationChange = (e) => {
    setSelectedLocation(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Generate QR Codes ONLY for currently visible wines on the page
  useEffect(() => {
    if (paginatedWines.length === 0) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    const generateQRs = async () => {
      const map = {};
      for (const wine of paginatedWines) {
        try {
          const url = `${origin}/wine/${wine.id}`;
          const dataUrl = await QRCode.toDataURL(url, {
            width: 200,
            margin: 1,
            color: { dark: '#1e1b4b', light: '#ffffff' }
          });
          map[wine.id] = dataUrl;
        } catch (e) {
          console.error(e);
        }
      }
      setQrCodesMap(map);
    };

    generateQRs();
  }, [paginatedWines]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '2.5rem', height: '2.5rem', borderWidth: '3px', borderColor: '#e2e8f0', borderBottomColor: '#6366f1', borderRadius: '50%', animation: 'rotation 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: '#64748b' }}>Caricamento etichette QR...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Control Header Bar (Hidden during printing) */}
      <div className="no-print" style={{ maxWidth: '1200px', margin: '0 auto 1.5rem auto', background: 'white', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Top Title & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => router.push('/')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.55rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#334155' }}
            >
              <ArrowLeft size={18} /> Home
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <QrCode size={24} color="#6366f1" /> Stampa Fogli Etichette QR Code
              </h1>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                {filteredWines.length} vini trovati • Foglio A4 (Pagina {safeCurrentPage} di {totalPages})
              </span>
            </div>
          </div>

          <button
            onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#4f46e5', color: 'white', border: 'none', padding: '0.65rem 1.35rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)' }}
          >
            <Printer size={18} /> Stampa Foglio A4 ({paginatedWines.length} etichette)
          </button>
        </div>

        {/* Filter Bar & Search */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
          {/* Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '0.45rem 0.75rem', borderRadius: '8px', flex: 1, minWidth: '220px' }}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Cerca vino, produttore, annata..."
              value={searchQuery}
              onChange={handleSearchChange}
              style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '0.9rem', color: '#0f172a' }}
            />
          </div>

          {/* Location Filter */}
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

          {/* Per Page selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '0.45rem 0.75rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Per foglio:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              style={{ border: 'none', background: 'transparent', fontWeight: '600', color: '#1e293b', outline: 'none', fontSize: '0.9rem' }}
            >
              <option value={12}>12 etichette (Grandi)</option>
              <option value={24}>24 etichette (Standard A4)</option>
              <option value={36}>36 etichette (Compatte)</option>
            </select>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
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

              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', minWidth: '80px', textAlign: 'center' }}>
                {safeCurrentPage} / {totalPages}
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

      {/* Printable Sheet Area */}
      {paginatedWines.length === 0 ? (
        <div style={{ maxWidth: '210mm', margin: '0 auto', background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>
          Nessun vino trovato con i filtri selezionati.
        </div>
      ) : (
        <div style={{ maxWidth: '210mm', margin: '0 auto', background: 'white', padding: '8mm', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', boxSizing: 'border-box' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: pageSize === 12 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: '5mm',
            boxSizing: 'border-box'
          }}>
            {paginatedWines.map(wine => (
              <div
                key={wine.id}
                style={{
                  border: '1px dashed #cbd5e1',
                  borderRadius: '8px',
                  padding: '3mm',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3mm',
                  background: '#ffffff',
                  boxSizing: 'border-box',
                  minHeight: pageSize === 12 ? '50mm' : '38mm',
                  pageBreakInside: 'avoid'
                }}
              >
                {qrCodesMap[wine.id] ? (
                  <img src={qrCodesMap[wine.id]} alt="QR" style={{ width: pageSize === 12 ? '34mm' : '26mm', height: pageSize === 12 ? '34mm' : '26mm', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: pageSize === 12 ? '34mm' : '26mm', height: pageSize === 12 ? '34mm' : '26mm', background: '#f1f5f9', borderRadius: '4px', flexShrink: 0 }}></div>
                )}

                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div style={{ fontSize: '9pt', fontWeight: 'bold', color: '#0f172a', lineHeight: 1.15, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {wine.name}
                  </div>
                  <div style={{ fontSize: '7.5pt', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
                    {wine.producerCellar || wine.producer || ''}
                  </div>
                  <div style={{ fontSize: '7.5pt', color: '#64748b', fontWeight: '600' }}>
                    Annata: {wine.vintage || 'S.A.'}
                  </div>
                  <div style={{ display: 'inline-block', background: '#e0e7ff', color: '#4338ca', fontSize: '6.5pt', fontWeight: 'bold', padding: '1px 5px', borderRadius: '3px', marginTop: '3px' }}>
                    ID: #{wine.id}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Print CSS rules */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            padding: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>
    </div>
  );
}

