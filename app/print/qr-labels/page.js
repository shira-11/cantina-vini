'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, QrCode, Filter, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode';

export default function PrintQRLabelsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [wines, setWines] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [qrCodesMap, setQrCodesMap] = useState({}); // wineId -> dataUrl
  const [labelSize, setLabelSize] = useState('medium'); // 'small' (24 per sheet), 'medium' (12 per sheet)

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

  // Filter wines by location if selected
  const filteredWines = wines.filter(wine => {
    if (selectedLocation === 'all') return true;
    const locId = parseInt(selectedLocation, 10);
    return wine.movements?.some(m => m.locationId === locId);
  });

  // Generate QR Codes for visible wines
  useEffect(() => {
    if (filteredWines.length === 0) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    const generateQRs = async () => {
      const map = {};
      for (const wine of filteredWines.slice(0, 100)) { // limit to top 100 per print batch
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
  }, [filteredWines]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '2.5rem', height: '2.5rem', borderWidth: '3px', borderColor: '#e2e8f0', borderBottomColor: '#6366f1', borderRadius: '50%', animation: 'rotation 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: '#64748b' }}>Generazione foglio etichette QR in corso...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Control Header Bar (Hidden during printing) */}
      <div className="no-print" style={{ maxWidth: '1200px', margin: '0 auto 1.5rem auto', background: 'white', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
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
              Mostrati {filteredWines.length} vini • Formato A4 etichette adesive
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Location Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '0.4rem 0.75rem', borderRadius: '8px' }}>
            <Filter size={16} color="#64748b" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontWeight: '600', color: '#1e293b', outline: 'none', fontSize: '0.9rem' }}
            >
              <option value="all">Tutte le Cantine</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#4f46e5', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)' }}
          >
            <Printer size={18} /> Stampa Fogli Etichette A4
          </button>
        </div>
      </div>

      {/* Printable Sheet Area */}
      <div style={{ maxWidth: '210mm', margin: '0 auto', background: 'white', padding: '10mm', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', boxSizing: 'border-box' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6mm',
          boxSizing: 'border-box'
        }}>
          {filteredWines.map(wine => (
            <div
              key={wine.id}
              style={{
                border: '1px dashed #cbd5e1',
                borderRadius: '8px',
                padding: '3.5mm',
                display: 'flex',
                alignItems: 'center',
                gap: '3mm',
                background: '#ffffff',
                boxSizing: 'border-box',
                minHeight: '40mm',
                pageBreakInside: 'avoid'
              }}
            >
              {qrCodesMap[wine.id] ? (
                <img src={qrCodesMap[wine.id]} alt="QR" style={{ width: '28mm', height: '28mm', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '28mm', height: '28mm', background: '#f1f5f9', borderRadius: '4px' }}></div>
              )}

              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: '9.5pt', fontWeight: 'bold', color: '#0f172a', lineHeight: 1.15, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
