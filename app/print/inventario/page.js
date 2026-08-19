'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wine, Printer } from 'lucide-react';

export default function PrintInventarioPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div style={{ padding: '2rem' }}>Caricamento foglio inventario...</div>;
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

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        body {
          background-color: #525659;
          color: black;
          margin: 0;
          font-family: Arial, sans-serif;
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
          @page { size: A4 portrait !important; margin: 8mm !important; }
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
          max-width: 96vw;
          min-height: 270mm;
          padding: 15mm;
          margin: 20px auto;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          box-sizing: border-box;
          border-radius: 8px;
        }
        .inv-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
          font-size: 11px;
        }
        .inv-table th, .inv-table td {
          border: 1px solid #94a3b8;
          padding: 6px 8px;
          text-align: center;
          vertical-align: middle;
        }
        .inv-table th {
          background-color: #f1f5f9;
          font-weight: bold;
          color: #0f172a;
        }
        .text-left { text-align: left !important; }
        .text-bold { font-weight: bold; }
        .location-header {
          background-color: #e2e8f0;
          font-size: 13px;
          font-weight: bold;
          text-align: left;
          padding: 8px;
          color: #1e293b;
        }
        .check-box {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 1.5px solid #475569;
          border-radius: 3px;
        }
      `}} />

      <div className="no-print" style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(82, 86, 89, 0.95)',
        backdropFilter: 'blur(5px)',
        width: '100%',
        boxSizing: 'border-box',
        padding: '16px 30px',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          onClick={() => router.push('/')}
          title="Torna alla Home Cantina"
        >
          <ArrowLeft size={32} color="white" />
          <Wine size={26} color="#3b82f6" />
          <h2 style={{ color: 'white', margin: 0, fontSize: '1.4rem' }}>CANTINA</h2>
        </div>

        <button onClick={() => window.print()} style={{ padding: '8px 18px', fontSize: '15px', fontWeight: 'bold', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <Printer size={18} /> Stampa Foglio Cartaceo
        </button>
      </div>

      <div className="print-page">
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '15px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', textTransform: 'uppercase', color: '#0f172a' }}>
              {session.title}
            </h1>
            <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
              Foglio di Conteggio Fisico sul Campo (Anno {session.year})
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12px', color: '#334155' }}>
            <div><strong>Data Inizio:</strong> {today}</div>
            <div><strong>Totale Vini/Annate:</strong> {session.items.length}</div>
          </div>
        </div>

        <table className="inv-table">
          <thead>
            <tr>
              <th style={{ width: '35%' }} className="text-left">Vino</th>
              <th style={{ width: '12%' }}>Annata</th>
              <th style={{ width: '12%' }}>Formato</th>
              <th style={{ width: '13%' }}>Teorico PC</th>
              <th style={{ width: '18%' }}>Contate Reali</th>
              <th style={{ width: '10%' }}>Check</th>
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
                  let displayFormat = wine ? (wine.bottleType || '') : '';
                  const btLower = displayFormat.toLowerCase();
                  if (btLower.includes('0.75') || btLower.includes('0,75') || btLower.includes('normale')) {
                    displayFormat = '0.75L';
                  }

                  return (
                    <tr key={item.id}>
                      <td className="text-left text-bold">
                        {wine ? wine.name : 'Vino non identificato'}
                        {wine && wine.producer ? <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal', display: 'block' }}>{wine.producer}</span> : null}
                      </td>
                      <td style={{ fontWeight: 'bold', fontSize: '12px' }}>{wine ? (wine.vintage || '-') : '-'}</td>
                      <td>{displayFormat || '-'}</td>
                      <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
                        {item.expectedQty} bt.
                      </td>
                      <td style={{ backgroundColor: '#ffffff' }}>
                        {/* Spazio bianco per scrivere il numero a penna */}
                        <div style={{ minHeight: '20px', fontWeight: 'bold' }}>
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

        <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
          <div>Firma Operatore Conteggio: ___________________________</div>
          <div>Pagina di Inventario Fisico</div>
        </div>
      </div>
    </>
  );
}
