'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wine, Printer, LayoutGrid, List } from 'lucide-react';

import WineBottleLoader from '@/components/WineBottleLoader';

export default function PrintInventarioPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (2 colonne compatto) or 'table' (1 colonna standard)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const query = new URLSearchParams(window.location.search);
      const id = query.get('sessionId');

      if (id) {
        fetch(`/api/inventory/${id}`)
          .then(res => res.json())
          .then(data => {
            if (!data.error) {
              setSession(data);
            }
            setLoading(false);
          })
          .catch(err => {
            console.error(err);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    }
  }, []);

  if (loading) return <WineBottleLoader message="Caricamento Foglio Inventario..." />;
  if (!session) return <div style={{ padding: '2rem' }}>Nessuna sessione di inventario selezionata.</div>;

  const today = new Date(session.createdAt).toLocaleDateString('it-IT');

  // Group items by Location
  const locationMap = new Map();
  for (const item of session.items) {
    const locName = item.location ? item.location.name : 'Generale / Senza Cantina';
    if (!locationMap.has(locName)) {
      locationMap.set(locName, []);
    }
    locationMap.get(locName).push(item);
  }

  // Create a flattened list of items with location info attached for 2-column splitting
  const allItemsWithLoc = [];
  locationMap.forEach((items, locName) => {
    items.forEach((item, idx) => {
      allItemsWithLoc.push({
        ...item,
        locName,
        isFirstInLoc: idx === 0
      });
    });
  });

  const halfIndex = Math.ceil(allItemsWithLoc.length / 2);
  const col1Items = allItemsWithLoc.slice(0, halfIndex);
  const col2Items = allItemsWithLoc.slice(halfIndex);

  const formatBottleType = (rawType) => {
    if (!rawType) return '-';
    const lower = rawType.toLowerCase();
    if (lower.includes('0.75') || lower.includes('0,75') || lower.includes('normale')) return '0.75L';
    if (lower.includes('1.5') || lower.includes('magnum')) return '1.5L';
    if (lower.includes('3.0') || lower.includes('3l') || lower.includes('jeroboam')) return '3.0L';
    if (lower.includes('0.375') || lower.includes('mezza')) return '0.375L';
    return rawType;
  };

  const renderColumnRows = (itemsList) => {
    let lastLoc = null;
    return itemsList.map(item => {
      const showLocHeader = item.locName !== lastLoc;
      lastLoc = item.locName;

      const wine = item.wine;
      const bType = formatBottleType(wine?.bottleType);

      return (
        <React.Fragment key={item.id}>
          {showLocHeader && (
            <tr>
              <td colSpan="5" className="location-header">
                📍 {item.locName}
              </td>
            </tr>
          )}
          <tr>
            <td className="text-left text-bold" style={{ fontSize: '9.5px', padding: '2px 4px' }}>
              <div>{wine ? wine.name : 'Vino non identificato'}</div>
              {wine && wine.producer ? (
                <div style={{ fontSize: '8.5px', color: '#64748b', fontWeight: 'normal' }}>{wine.producer}</div>
              ) : null}
            </td>
            <td style={{ fontSize: '9px', whiteSpace: 'nowrap', padding: '2px 4px' }}>
              <strong>{wine?.vintage || '-'}</strong>
              <div style={{ fontSize: '8px', color: '#64748b' }}>{bType}</div>
            </td>
            <td style={{ fontWeight: 'bold', fontSize: '9.5px', backgroundColor: '#f8fafc', padding: '2px 4px' }}>
              {item.expectedQty}
            </td>
            <td style={{ backgroundColor: '#ffffff', padding: '2px 4px' }}>
              <div className="write-box">
                {item.countedQty !== null ? item.countedQty : ''}
              </div>
            </td>
            <td style={{ padding: '2px 4px' }}>
              <div className="check-box" style={{ backgroundColor: item.isChecked ? '#10b981' : 'transparent' }}></div>
            </td>
          </tr>
        </React.Fragment>
      );
    });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @page {
          size: A4 portrait;
          margin: 6mm;
        }
        body {
          background-color: #525659;
          color: black;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 0 20px 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          html, body, main {
            background-color: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            width: 100% !important;
            position: static !important;
          }
          .no-print { display: none !important; }
          header, footer, nav, .sidebar { display: none !important; }
          @page { size: A4 portrait !important; margin: 6mm !important; }
          .print-page {
            box-shadow: none !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            display: block !important;
            overflow: visible !important;
          }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
        }
        .print-page {
          background: white;
          width: 210mm;
          max-width: 98vw;
          min-height: 270mm;
          padding: 8mm 10mm;
          margin: 15px auto;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          box-sizing: border-box;
          border-radius: 6px;
        }
        .inv-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
          line-height: 1.2;
        }
        .inv-table th, .inv-table td {
          border: 1px solid #cbd5e1;
          padding: 3px 5px;
          text-align: center;
          vertical-align: middle;
        }
        .inv-table th {
          background-color: #f1f5f9;
          font-weight: bold;
          color: #0f172a;
          font-size: 10px;
          padding: 4px 5px;
        }
        .text-left { text-align: left !important; }
        .text-bold { font-weight: bold; }
        .location-header {
          background-color: #e2e8f0;
          font-size: 10.5px;
          font-weight: bold;
          text-align: left;
          padding: 3px 6px;
          color: #1e293b;
          border: 1px solid #cbd5e1;
        }
        .check-box {
          display: inline-block;
          width: 13px;
          height: 13px;
          border: 1.5px solid #475569;
          border-radius: 2px;
          vertical-align: middle;
        }
        .write-box {
          min-height: 14px;
          min-width: 24px;
          display: inline-block;
          font-weight: bold;
          font-size: 11px;
        }
        .grid-columns {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .grid-col {
          flex: 1;
          min-width: 0;
        }
      `}} />

      {/* Top Controls Bar (Hidden when printing) */}
      <div className="no-print" style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        backdropFilter: 'blur(5px)',
        width: '100%',
        boxSizing: 'border-box',
        padding: '12px 24px',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
      }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          onClick={() => router.push('/inventory')}
          title="Torna all'Inventario"
        >
          <ArrowLeft size={24} color="white" />
          <Wine size={24} color="#3b82f6" />
          <div>
            <h2 style={{ color: 'white', margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>STAMPA FOGLIO INVENTARIO</h2>
            <div style={{ color: '#94a3b8', fontSize: '12px' }}>{session.title} ({session.items.length} voci)</div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#334155', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: viewMode === 'grid' ? '#3b82f6' : 'transparent',
              color: viewMode === 'grid' ? 'white' : '#cbd5e1'
            }}
          >
            <LayoutGrid size={15} /> 2 Colonne (Salva Carta 🍃)
          </button>

          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: viewMode === 'table' ? '#3b82f6' : 'transparent',
              color: viewMode === 'table' ? 'white' : '#cbd5e1'
            }}
          >
            <List size={15} /> 1 Colonna Standard
          </button>
        </div>

        <button
          onClick={() => window.print()}
          style={{
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: 'bold',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)'
          }}
        >
          <Printer size={18} /> Stampa Foglio (PDF)
        </button>
      </div>

      <div className="print-page">
        {/* Compact Document Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #0f172a', paddingBottom: '6px', marginBottom: '10px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '17px', textTransform: 'uppercase', color: '#0f172a', fontWeight: 'bold', letterSpacing: '-0.3px' }}>
              {session.title}
            </h1>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
              Foglio di Conteggio Fisico sul Campo (Anno {session.year})
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '11px', color: '#334155', lineHeight: '1.3' }}>
            <div><strong>Data:</strong> {today} | <strong>Totale Voci:</strong> {session.items.length}</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>
              {viewMode === 'grid' ? 'Layout 2 Colonne Ottimizzato Stampa' : 'Layout Tabellare Standard'}
            </div>
          </div>
        </div>

        {viewMode === 'grid' ? (
          /* 2-Column Ultra Compact Printable Grid Layout */
          <div className="grid-columns">
            {/* Left Column */}
            <div className="grid-col">
              <table className="inv-table">
                <thead>
                  <tr>
                    <th style={{ width: '50%' }} className="text-left">Vino / Produttore</th>
                    <th style={{ width: '16%' }}>Ann./Form.</th>
                    <th style={{ width: '11%' }}>Teor.</th>
                    <th style={{ width: '15%' }}>Reali</th>
                    <th style={{ width: '8%' }}>✓</th>
                  </tr>
                </thead>
                <tbody>
                  {renderColumnRows(col1Items)}
                </tbody>
              </table>
            </div>

            {/* Right Column */}
            <div className="grid-col">
              <table className="inv-table">
                <thead>
                  <tr>
                    <th style={{ width: '50%' }} className="text-left">Vino / Produttore</th>
                    <th style={{ width: '16%' }}>Ann./Form.</th>
                    <th style={{ width: '11%' }}>Teor.</th>
                    <th style={{ width: '15%' }}>Reali</th>
                    <th style={{ width: '8%' }}>✓</th>
                  </tr>
                </thead>
                <tbody>
                  {renderColumnRows(col2Items)}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* 1-Column Full Width Table Layout (Optimized Compact Padding) */
          <table className="inv-table">
            <thead>
              <tr>
                <th style={{ width: '38%' }} className="text-left">Vino / Produttore</th>
                <th style={{ width: '12%' }}>Annata</th>
                <th style={{ width: '12%' }}>Formato</th>
                <th style={{ width: '12%' }}>Teorico PC</th>
                <th style={{ width: '18%' }}>Contate Reali</th>
                <th style={{ width: '8%' }}>Check</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(locationMap.entries()).map(([locName, items]) => (
                <React.Fragment key={locName}>
                  <tr>
                    <td colSpan="6" className="location-header">
                      📍 {locName} ({items.length} vini/annate)
                    </td>
                  </tr>
                  {items.map(item => {
                    const wine = item.wine;
                    const bType = formatBottleType(wine?.bottleType);

                    return (
                      <tr key={item.id}>
                        <td className="text-left text-bold" style={{ padding: '3px 6px' }}>
                          {wine ? wine.name : 'Vino non identificato'}
                          {wine && wine.producer ? <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 'normal', display: 'block' }}>{wine.producer}</span> : null}
                        </td>
                        <td style={{ fontWeight: 'bold', fontSize: '11px' }}>{wine ? (wine.vintage || '-') : '-'}</td>
                        <td>{bType}</td>
                        <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
                          {item.expectedQty} bt.
                        </td>
                        <td style={{ backgroundColor: '#ffffff' }}>
                          <div className="write-box">
                            {item.countedQty !== null ? item.countedQty : ''}
                          </div>
                        </td>
                        <td>
                          <div className="check-box" style={{ backgroundColor: item.isChecked ? '#10b981' : 'transparent' }}></div>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}

        {/* Footer */}
        <div style={{ marginTop: '16px', paddingTop: '8px', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
          <div>Firma Operatore Conteggio: ___________________________</div>
          <div>Pagina Inventario Fisico Cantina</div>
        </div>
      </div>
    </>
  );
}
