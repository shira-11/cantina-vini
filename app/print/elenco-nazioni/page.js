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
      if (storedNamesStr) {
        const storedNames = JSON.parse(storedNamesStr);

        Promise.all([
          fetch('/api/wines').then(res => res.json()),
          fetch('/api/locations').then(res => res.json())
        ])
          .then(([allWines, allLocs]) => {
            const filtered = allWines.filter(w => storedNames.includes(w.name));
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
      } else {
        setLoading(false);
      }
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

  const colTotals = {};
  cols.forEach(c => colTotals[c] = 0);
  let grandTotal = 0;

  activeRows.forEach(r => {
    if (!matrix[r]) return;
    cols.forEach(c => {
      const val = matrix[r][c] || 0;
      colTotals[c] += val;
      grandTotal += val;
    });
  });

  const formatNum = (num) => {
    if (!num) return '';
    return new Intl.NumberFormat('it-IT').format(num);
  };

  const today = new Date().toLocaleDateString('it-IT');

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @page {
          size: landscape;
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
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          .no-print { display: none !important; }
          header.header { display: none !important; }
          main { padding: 0 !important; }
          body { background-color: white; padding: 0; margin: 0; display: block; }
          @page { size: A4 landscape !important; margin: 10mm !important; }
          .print-page {
            box-shadow: none !important;
            margin: 0 auto !important;
            width: 277mm !important;
            max-width: 277mm !important;
            min-height: 190mm !important;
            padding: 10mm !important;
          }
        }
        header.header { display: none !important; }
        main { padding: 0 !important; }
        .print-page {
          background: white;
          width: 277mm; /* A4 Landscape preview width */
          min-height: 190mm; /* A4 Landscape preview min-height */
          padding: 20mm;
          margin-top: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          box-sizing: border-box;
        }
        .matrix-table {
          width: 80%;
          margin: 0 auto;
          border-collapse: collapse;
          margin-top: 2rem;
        }
        .matrix-table th, .matrix-table td {
          border: 1px solid #555;
          padding: 12px;
          text-align: center;
          font-size: 16px;
        }
        .matrix-table th {
          background-color: #cbd5e1;
          font-weight: bold;
        }
        .matrix-table .row-header {
          text-align: center;
          background-color: white;
        }
        .matrix-table .total-cell {
          font-weight: bold;
        }
      `}} />

      <div className="no-print" style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(82, 86, 89, 0.95)',
        backdropFilter: 'blur(5px)',
        width: '100%',
        padding: '20px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            onClick={() => window.close()}
          >
            <ArrowLeft size={36} color="white" />
            <Wine size={28} color="#3b82f6" />
            <h2 style={{ color: 'white', margin: 0 }}>CANTINA</h2>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <button onClick={() => window.print()} style={{ padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            }} style={{ padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📄 Scarica PDF
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 'bold', color: 'white' }}>Seleziona Cantine:</span>
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
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: isSelected ? '2px solid #10b981' : '1px solid #ccc',
                  background: isSelected ? '#ecfdf5' : 'white',
                  color: isSelected ? '#065f46' : '#666',
                  cursor: 'pointer',
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
        <div style={{ textAlign: 'right', fontSize: '16px', marginBottom: '1rem', borderBottom: '1px solid #000', paddingBottom: '0.5rem' }}>
          Al {today}
        </div>
        <h1 style={{ textAlign: 'center', fontSize: '24px', textTransform: 'uppercase', marginBottom: '3rem' }}>
          Elenco Giacenze Vini Per Paese
        </h1>

        <table className="matrix-table">
          <thead>
            <tr>
              <th style={{ backgroundColor: 'white', border: 'none', borderRight: '1px solid #555', borderBottom: '1px solid #555' }}></th>
              {cols.map(c => <th key={c}>{c}</th>)}
              <th>Totale</th>
            </tr>
          </thead>
          <tbody>
            {activeRows.map(r => {
              let rowTotal = 0;
              return (
                <tr key={r}>
                  <td className="row-header">{r}</td>
                  {cols.map(c => {
                    const val = (matrix[r] && matrix[r][c]) ? matrix[r][c] : 0;
                    rowTotal += val;
                    return <td key={c}>{formatNum(val)}</td>;
                  })}
                  <td className="total-cell">{formatNum(rowTotal)}</td>
                </tr>
              );
            })}
            <tr>
              <td className="row-header" style={{ fontWeight: 'bold' }}>Totale</td>
              {cols.map(c => (
                <td key={c} className="total-cell">{formatNum(colTotals[c])}</td>
              ))}
              <td className="total-cell">{formatNum(grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
