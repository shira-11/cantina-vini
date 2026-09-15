'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wine, Printer, LayoutGrid, List, Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

import WineBottleLoader from '@/components/WineBottleLoader';

export default function PrintInventarioPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfDownloading, setPdfDownloading] = useState(false);
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

  const formatBottleType = (rawType) => {
    if (!rawType) return '-';
    const lower = rawType.toLowerCase();
    if (lower.includes('0.75') || lower.includes('0,75') || lower.includes('normale')) return '0.75L';
    if (lower.includes('1.5') || lower.includes('magnum')) return '1.5L';
    if (lower.includes('3.0') || lower.includes('3l') || lower.includes('jeroboam')) return '3.0L';
    if (lower.includes('0.375') || lower.includes('mezza')) return '0.375L';
    return rawType;
  };

  const handleDownloadExcel = () => {
    if (!session || !session.items) return;

    const dataRows = [];
    locationMap.forEach((items, locName) => {
      items.forEach(item => {
        const wine = item.wine || {};
        const bType = formatBottleType(wine.bottleType);

        dataRows.push({
          'Cantina / Posizione': locName,
          'Nome Vino': wine.name || 'Vino sconosciuto',
          'Produttore': wine.producer || '',
          'Annata': wine.vintage || '-',
          'Formato': bType || '-',
          'Giacenza Teorica PC': item.expectedQty || 0,
          'Conteggio Reale Campo': item.countedQty !== null ? item.countedQty : '',
          'Stato': item.isChecked ? 'Verificato' : 'Da Contare',
          'Note': item.notes || ''
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    worksheet['!cols'] = [
      { wch: 22 },
      { wch: 35 },
      { wch: 25 },
      { wch: 10 },
      { wch: 10 },
      { wch: 18 },
      { wch: 22 },
      { wch: 12 },
      { wch: 20 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario Fisico');

    const cleanTitle = (session.title || 'Inventario').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${cleanTitle}_${today.replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const handleDownloadPDF = async () => {
    if (typeof window === 'undefined') return;
    try {
      setPdfDownloading(true);
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('printable-inventory-area');
      if (!element) {
        setPdfDownloading(false);
        window.print();
        return;
      }

      const cleanTitle = (session.title || 'Inventario').replace(/[^a-zA-Z0-9_-]/g, '_');
      const opt = {
        margin:       [5, 5, 5, 5],
        filename:     `${cleanTitle}_${today.replace(/\//g, '-')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
      setPdfDownloading(false);
    } catch (err) {
      console.error(err);
      setPdfDownloading(false);
      window.print();
    }
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
          html, body {
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
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            display: block !important;
            overflow: visible !important;
          }
          .grid-columns-container {
            column-count: 2 !important;
            column-gap: 10px !important;
            column-fill: auto !important;
            display: block !important;
          }
          table { page-break-inside: auto; width: 100% !important; }
          tr { break-inside: avoid !important; page-break-inside: avoid !important; page-break-after: auto; }
          thead { display: table-header-group !important; }
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
        .grid-columns-container {
          column-count: 2;
          column-gap: 12px;
          display: block;
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
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          onClick={() => router.push('/inventory')}
          title="Torna all'Inventario"
        >
          <ArrowLeft size={24} color="white" />
          <Wine size={24} color="#3b82f6" />
          <div>
            <h2 style={{ color: 'white', margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>FOGLIO INVENTARIO (STAMPA & DOWNLOAD)</h2>
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

        {/* Action Buttons: Browser Print, PDF Download, Excel Download */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleDownloadExcel}
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 'bold',
              background: '#047857',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(4, 120, 87, 0.3)'
            }}
            title="Scarica il foglio inventario in formato Excel editable"
          >
            <FileSpreadsheet size={16} /> Scarica Excel (.xlsx)
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={pdfDownloading}
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 'bold',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)'
            }}
            title="Scarica direttamente il file PDF sul dispositivo"
          >
            {pdfDownloading ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
            {pdfDownloading ? 'Generazione PDF...' : 'Scarica PDF File'}
          </button>

          <button
            onClick={() => window.print()}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 'bold',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
            }}
            title="Apri finestra di stampa browser"
          >
            <Printer size={16} /> Stampa Browser
          </button>
        </div>
      </div>

      <div className="print-page" id="printable-inventory-area">
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

        <div className={viewMode === 'grid' ? 'grid-columns-container' : ''}>
          <table className="inv-table">
            <thead>
              <tr>
                <th style={{ width: viewMode === 'grid' ? '46%' : '38%' }} className="text-left">Vino / Produttore</th>
                <th style={{ width: '12%' }}>{viewMode === 'grid' ? 'Ann./Form.' : 'Annata'}</th>
                {viewMode !== 'grid' && <th style={{ width: '12%' }}>Formato</th>}
                <th style={{ width: viewMode === 'grid' ? '12%' : '12%' }}>Teorico PC</th>
                <th style={{ width: viewMode === 'grid' ? '18%' : '18%' }}>Contate Reali</th>
                <th style={{ width: viewMode === 'grid' ? '12%' : '8%' }}>Check</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(locationMap.entries()).map(([locName, items]) => (
                <React.Fragment key={locName}>
                  <tr>
                    <td colSpan={viewMode === 'grid' ? 5 : 6} className="location-header">
                      📍 {locName} ({items.length} vini/annate)
                    </td>
                  </tr>
                  {items.map(item => {
                    const wine = item.wine;
                    const bType = formatBottleType(wine?.bottleType);

                    return (
                      <tr key={item.id}>
                        <td className="text-left text-bold" style={{ padding: '3px 5px' }}>
                          <div>{wine ? wine.name : 'Vino non identificato'}</div>
                          {wine && wine.producer ? <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 'normal', display: 'block' }}>{wine.producer}</span> : null}
                        </td>
                        {viewMode === 'grid' ? (
                          <td style={{ fontSize: '9px', whiteSpace: 'nowrap', padding: '2px 4px' }}>
                            <strong>{wine?.vintage || '-'}</strong>
                            <div style={{ fontSize: '8px', color: '#64748b' }}>{bType}</div>
                          </td>
                        ) : (
                          <>
                            <td style={{ fontWeight: 'bold', fontSize: '11px' }}>{wine ? (wine.vintage || '-') : '-'}</td>
                            <td>{bType}</td>
                          </>
                        )}
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
        </div>

        {/* Footer */}
        <div style={{ marginTop: '16px', paddingTop: '8px', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
          <div>Firma Operatore Conteggio: ___________________________</div>
          <div>Pagina Inventario Fisico Cantina</div>
        </div>
      </div>
    </>
  );
}
