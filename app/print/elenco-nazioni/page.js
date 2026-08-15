'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Wine } from 'lucide-react';

export default function PrintElencoNazioni() {
  const [wines, setWines] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedNamesStr = sessionStorage.getItem('printWineNames');

      Promise.all([
        fetch('/api/wines').then(res => res.json()),
        fetch('/api/locations').then(res => res.json())
      ])
        .then(([allWines, allLocs]) => {
          let filtered = allWines;
          if (storedNamesStr) {
            try {
              const storedNames = JSON.parse(storedNamesStr);
              if (Array.isArray(storedNames) && storedNames.length > 0) {
                filtered = allWines.filter(w => storedNames.includes(w.name));
              }
            } catch (e) {
              console.error("Error parsing printWineNames:", e);
            }
          }
          setWines(filtered);
          
          const locNames = allLocs.map(l => l.name).sort();
          setLocations(locNames);
          setSelectedLocations(locNames);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Caricamento...</div>;

  // Process data for matrix
  const getCatGrp = (cat) => {
    if (!cat) return 'Altri';
    const c = cat.toLowerCase();
    if (c.includes('bianc')) return 'Bianco';
    if (c.includes('ross')) return 'Rosso';
    if (c.includes('bollicin') || c.includes('champagne')) return 'Bollicine';
    return 'Altri';
  };

  const getCountryGrp = (c) => {
    if (!c || c.trim() === '') return 'Non specificata';
    return c.trim().charAt(0).toUpperCase() + c.trim().slice(1).toLowerCase();
  };

  const calculateStockForLocations = (wine) => {
    if (!wine.movements) return 0;
    if (selectedLocations.length === locations.length) return wine.totalStock || 0;
    
    const locMovements = wine.movements.filter(m => selectedLocations.includes(m.location?.name));
    let stock = 0;
    for (const m of locMovements) {
      if (m.movementType === 'Ingresso') stock += m.quantity;
      if (m.movementType === 'Uscita') stock -= m.quantity;
    }
    return stock;
  };

  const matrix = {}; 
  const uniqueCountries = new Set();

  for (const w of wines) {
    const cat = getCatGrp(w.category);
    const country = getCountryGrp(w.country);
    
    const stock = calculateStockForLocations(w);
    if (stock <= 0) continue; // Only add if there is stock in selected locations
    
    uniqueCountries.add(country);

    if (!matrix[cat]) matrix[cat] = {};
    if (!matrix[cat][country]) matrix[cat][country] = 0;
    
    matrix[cat][country] += stock;
  }

  const rows = ['Bianco', 'Rosso', 'Bollicine', 'Altri'];
  
  // Create cols array dynamically
  const cols = Array.from(uniqueCountries).sort((a, b) => {
    if (a === 'Non specificata') return 1; // Put "Non specificata" at the end
    if (b === 'Non specificata') return -1;
    if (a.toLowerCase() === 'italia') return -1; // Put "Italia" first
    if (b.toLowerCase() === 'italia') return 1;
    return a.localeCompare(b);
  });

  const activeRows = rows.filter(r => matrix[r] && Object.values(matrix[r]).some(v => v > 0));
  if (activeRows.length === 0) activeRows.push('Nessun dato');

  const totBianco = cols.reduce((sum, c) => sum + (matrix['Bianco']?.[c] || 0), 0);
  const totRosso = cols.reduce((sum, c) => sum + (matrix['Rosso']?.[c] || 0), 0);
  const totBollicine = cols.reduce((sum, c) => sum + (matrix['Bollicine']?.[c] || 0), 0);
  const totAltri = cols.reduce((sum, c) => sum + (matrix['Altri']?.[c] || 0), 0);
  const grandTotal = totBianco + totRosso + totBollicine + totAltri;

  const formatNum = (num) => {
    if (!num) return '-';
    return new Intl.NumberFormat('it-IT').format(num);
  };

  const today = new Date().toLocaleDateString('it-IT');

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @page {
          size: portrait;
          margin: 0mm;
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
          box-sizing: border-box;
          width: 100%;
          overflow-x: hidden;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          .no-print { display: none !important; }
          header.header { display: none !important; }
          main { padding: 0 !important; }
          body { background-color: white; padding: 0; margin: 0; display: block; overflow: visible; }
          @page { size: A4 portrait !important; margin: 10mm !important; }
          .print-page {
            box-shadow: none !important;
            margin: 0 auto !important;
            width: 190mm !important;
            max-width: 190mm !important;
            min-height: 260mm !important;
            padding: 10mm !important;
            border-radius: 0 !important;
          }
          .table-wrapper {
            overflow: visible !important;
          }
        }
        header.header { display: none !important; }
        main { padding: 0 !important; }
        .print-page {
          background: white;
          width: 210mm;
          max-width: 96vw;
          min-height: 260mm;
          padding: 15mm;
          margin-top: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          box-sizing: border-box;
          border-radius: 8px;
        }
        .table-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .matrix-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1.5rem;
        }
        .matrix-table th, .matrix-table td {
          border: 1px solid #cbd5e1;
          padding: 10px 14px;
          text-align: center;
          font-size: 15px;
        }
        .matrix-table th {
          background-color: #1e293b;
          color: white;
          font-weight: 600;
        }
        .matrix-table th:first-child {
          text-align: left;
        }
        .matrix-table td:first-child {
          text-align: left;
          font-weight: 600;
          color: #0f172a;
        }
        .matrix-table tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .matrix-table .total-row td {
          background-color: #e2e8f0;
          font-weight: bold;
          font-size: 16px;
          border-top: 2px solid #0f172a;
          color: #0f172a;
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
        padding: '15px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            onClick={() => window.close()}
          >
            <ArrowLeft size={32} color="white" />
            <Wine size={26} color="#3b82f6" />
            <h2 style={{ color: 'white', margin: 0, fontSize: '1.4rem' }}>CANTINA</h2>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => window.print()} style={{ padding: '8px 16px', fontSize: '15px', fontWeight: 'bold', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🖨️ Stampa
            </button>
            <button onClick={() => {
              alert("Per garantire un PDF perfetto al 100% e mai vuoto: \n\nNella finestra che si sta per aprire, assicurati che la voce 'Destinazione' o 'Stampante' sia impostata su 'Salva come PDF'.");
              const originalTitle = document.title;
              const now = new Date();
              const dateStr = now.toLocaleDateString('it-IT').replace(/\//g, '-');
              const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }).replace(':', '-');
              document.title = `Elenco_Vini_${dateStr}_${timeStr}`;
              setTimeout(() => {
                window.print();
                document.title = originalTitle;
              }, 100);
            }} style={{ padding: '8px 16px', fontSize: '15px', fontWeight: 'bold', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📄 Scarica PDF
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 'bold', color: 'white', fontSize: '0.9rem' }}>Seleziona Cantine:</span>
          {locations.map(loc => {
            const isSelected = selectedLocations.includes(loc);
            return (
              <button
                key={loc}
                onClick={() => {
                  if (isSelected) {
                    setSelectedLocations(prev => prev.filter(l => l !== loc));
                  } else {
                    setSelectedLocations(prev => {
                      const newArr = [...prev, loc];
                      return locations.filter(l => newArr.includes(l));
                    });
                  }
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: '20px',
                  border: isSelected ? '2px solid #10b981' : '1px solid #ccc',
                  background: isSelected ? '#ecfdf5' : 'white',
                  color: isSelected ? '#065f46' : '#666',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  transition: 'all 0.2s'
                }}
              >
                {loc.replace(/cantina\s*/i, '').trim()}
              </button>
            );
          })}
        </div>
      </div>

      <div className="print-page">
        <div style={{ textAlign: 'right', fontSize: '15px', marginBottom: '0.5rem', borderBottom: '1px solid #000', paddingBottom: '0.5rem' }}>
          Al {today}
        </div>
        <h1 style={{ textAlign: 'center', fontSize: '22px', textTransform: 'uppercase', marginBottom: '2rem' }}>
          Elenco Giacenze Vini Per Paese
        </h1>

        <div className="table-wrapper">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>Paese / Regione</th>
                <th>Bianco</th>
                <th>Rosso</th>
                <th>Bollicine</th>
                <th>Altri</th>
                <th style={{ backgroundColor: '#0f172a' }}>Totale</th>
              </tr>
            </thead>
            <tbody>
              {cols.map(country => {
                const b = matrix['Bianco']?.[country] || 0;
                const r = matrix['Rosso']?.[country] || 0;
                const bol = matrix['Bollicine']?.[country] || 0;
                const alt = matrix['Altri']?.[country] || 0;
                const countryTotal = b + r + bol + alt;

                if (countryTotal <= 0) return null;

                return (
                  <tr key={country}>
                    <td>{country}</td>
                    <td>{formatNum(b)}</td>
                    <td>{formatNum(r)}</td>
                    <td>{formatNum(bol)}</td>
                    <td>{formatNum(alt)}</td>
                    <td style={{ fontWeight: 'bold', backgroundColor: '#f1f5f9' }}>{formatNum(countryTotal)}</td>
                  </tr>
                );
              })}
              <tr className="total-row">
                <td>TOTALE GENERALE</td>
                <td>{formatNum(totBianco)}</td>
                <td>{formatNum(totRosso)}</td>
                <td>{formatNum(totBollicine)}</td>
                <td>{formatNum(totAltri)}</td>
                <td style={{ color: '#059669' }}>{formatNum(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
