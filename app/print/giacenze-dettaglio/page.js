'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Wine } from 'lucide-react';

export default function PrintGiacenzeDettaglio() {
  const [wines, setWines] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortParam, setSortParam] = useState('name');
  const [showOnlyDisp, setShowOnlyDisp] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);
  const [hideEmptyLocations, setHideEmptyLocations] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedNamesStr = sessionStorage.getItem('printWineNames');
      const query = new URLSearchParams(window.location.search);
      const sort = query.get('sort') || 'name';
      setSortParam(sort);

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
          
          // Sort A-Z based on requested parameter
          filtered.sort((a, b) => {
            let valA = (a[sort] || '').toString().toLowerCase();
            let valB = (b[sort] || '').toString().toLowerCase();
            if (valA < valB) return -1;
            if (valA > valB) return 1;
            return 0;
          });

          setWines(filtered);
          const locNames = allLocs.map(l => l.name);
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

  const today = new Date().toLocaleDateString('it-IT');

  const sortLabelMap = {
    'name': 'Nome Vino',
    'country': 'Nazione',
    'producer': 'Cantina Produttrice',
    'category': 'Categoria'
  };
  const sortLabel = sortLabelMap[sortParam] || 'Nome Vino';

  const activeLocations = locations.filter(l => selectedLocations.includes(l));
  const locationsToRender = activeLocations.filter(loc => {
    if (!hideEmptyLocations) return true;
    return wines.some(w => {
      if (!w.movements) return false;
      return w.movements.some(m => m.location?.name === loc && (m.quantity || 0) > 0);
    });
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @page {
          size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'};
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
          .no-print { display: none !important; }
          header.header { display: none !important; }
          main { padding: 0 !important; }
          body { background-color: white; padding: 0; margin: 0; display: block; }
          @page { size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'} !important; margin: ${isLandscape ? '10mm' : '5mm'} !important; }
          .print-page {
            box-shadow: none !important;
            margin: 0 auto !important;
            width: ${isLandscape ? '277mm' : '190mm'} !important;
            max-width: ${isLandscape ? '277mm' : '190mm'} !important;
            min-height: auto !important;
            padding: 0 !important;
          }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
        .print-page {
          background: white;
          width: ${isLandscape ? '277mm' : '190mm'};
          max-width: 96vw;
          min-height: ${isLandscape ? '190mm' : '260mm'};
          padding: 10mm;
          margin-top: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          box-sizing: border-box;
          overflow-x: auto;
        }
        .detail-table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          margin-top: 1rem;
          font-size: 10px;
        }
        .detail-table th, .detail-table td {
          border: 1px solid #aaa;
          padding: 3px 2px;
          text-align: center;
          word-break: break-word;
        }
        .detail-table th {
          background-color: white;
          font-weight: bold;
        }
        .text-left { text-align: left !important; }
        .text-bold { font-weight: bold; }
        @media print {
          .detail-table { font-size: 9.5px; }
        }
      `}} />

      <div className="no-print" style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(82, 86, 89, 0.95)',
        backdropFilter: 'blur(5px)',
        width: '100%',
        padding: '16px 30px',
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
            <h2 style={{ color: 'white', margin: 0, fontSize: '1.4rem' }}>TORNA INDIETRO</h2>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Tasto Orientamento Foglio */}
            <button
              onClick={() => setIsLandscape(!isLandscape)}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: 'bold',
                background: isLandscape ? '#8b5cf6' : '#334155',
                color: 'white',
                border: isLandscape ? '2px solid #a78bfa' : '1px solid #64748b',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              title="Cambia orientamento foglio A4"
            >
              {isLandscape ? '↔️ A4 Orizzontale' : '↕️ A4 Verticale'}
            </button>

            {/* Tasto Vista Compatta (Solo Disp) */}
            <button
              onClick={() => setShowOnlyDisp(!showOnlyDisp)}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: 'bold',
                background: showOnlyDisp ? '#f59e0b' : '#334155',
                color: 'white',
                border: showOnlyDisp ? '2px solid #fcd34d' : '1px solid #64748b',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              title="Attiva/disattiva vista compatta (nasconde colonna Usato)"
            >
              {showOnlyDisp ? '⚡ Compatta (Solo Disp.)' : '📊 Completa (Disp+Usato)'}
            </button>

            {/* Tasto Nascondi Cantine senza Giacenza */}
            <button
              onClick={() => setHideEmptyLocations(!hideEmptyLocations)}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: 'bold',
                background: hideEmptyLocations ? '#06b6d4' : '#334155',
                color: 'white',
                border: hideEmptyLocations ? '2px solid #67e8f9' : '1px solid #64748b',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              title="Nascondi colonne delle cantine che non hanno movimentazioni"
            >
              {hideEmptyLocations ? '🧹 Solo Cantine Attive' : '👁️ Mostra Tutte'}
            </button>

            <button onClick={() => {
              const originalTitle = document.title;
              const now = new Date();
              const dateStr = now.toLocaleDateString('it-IT').replace(/\//g, '-');
              document.title = `Giacenze_${sortParam.toUpperCase()}_${dateStr}`;
              setTimeout(() => {
                window.print();
                document.title = originalTitle;
              }, 100);
            }} style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 'bold', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              🖨️ Stampa / Salva PDF
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 'bold', color: 'white', fontSize: '13px' }}>Seleziona Cantine:</span>
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
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
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

      <>
        {(() => {
          const colLayout = [
            { key: 'name', label: 'Nome Vino', width: '20%' },
            { key: 'vintage', label: 'Annata', width: 'auto' },
            { key: 'country', label: 'Nazione', width: 'auto' },
            { key: 'producer', label: 'Cantina', width: 'auto' },
            { key: 'category', label: 'Categoria', width: 'auto' }
          ];

          if (sortParam !== 'name') {
            const sortedColIndex = colLayout.findIndex(c => c.key === sortParam);
            if (sortedColIndex > -1) {
              const sortedCol = colLayout.splice(sortedColIndex, 1)[0];
              colLayout.unshift(sortedCol);
            }
          }

          const pages = [];
          let currentIdx = 0;
          const rowsPerPageFirst = isLandscape ? 16 : 24;
          const rowsPerPageNext = isLandscape ? 20 : 28;

          while (currentIdx < wines.length) {
            const isFirstPage = pages.length === 0;
            const limit = isFirstPage ? rowsPerPageFirst : rowsPerPageNext;
            pages.push(wines.slice(currentIdx, currentIdx + limit));
            currentIdx += limit;
          }

          if (pages.length === 0) pages.push([]);

          return pages.map((pageWines, pageIndex) => (
            <div key={pageIndex} className="print-page" style={{ display: 'flex', flexDirection: 'column' }}>
              {pageIndex === 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '15px' }}>
                  <h1 style={{ margin: 0, fontSize: '20px', textTransform: 'uppercase', textAlign: 'left' }}>
                    Elenco Giacenze (Ordinato per {sortLabel})
                  </h1>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Aggiornato al: {today}</div>
                </div>
              )}
              
              <table className="detail-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    {colLayout.map((col, i) => (
                      <th key={col.key} className={i === 0 ? "text-left" : ""} style={col.width !== 'auto' ? { width: col.width } : {}}>
                        {col.label}
                      </th>
                    ))}
                    <th>Inventariato</th>
                    <th>Disponibile</th>
                    <th>Usato</th>
                    {locationsToRender.map(loc => {
                      const shortName = loc.replace(/cantina /i, '').trim();
                      return (
                        <React.Fragment key={loc}>
                          <th>Disp.<br/>{shortName}</th>
                          {!showOnlyDisp && <th>Usato<br/>{shortName}</th>}
                        </React.Fragment>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {pageWines.map((w, idx) => {
                    let globalIngresso = 0;
                    let globalUscita = 0;
                    
                    const locStats = {};
                    locationsToRender.forEach(loc => {
                      locStats[loc] = { ingresso: 0, uscita: 0 };
                    });

                    if (w.movements && w.movements.length > 0) {
                      w.movements.forEach(m => {
                        const qty = m.quantity || 0;
                        const isIngresso = m.movementType === 'Ingresso';
                        const isUscita = m.movementType === 'Uscita';
                        
                        if (m.location && m.location.name && locationsToRender.includes(m.location.name)) {
                          const lName = m.location.name;
                          if (isIngresso) {
                            globalIngresso += qty;
                            locStats[lName].ingresso += qty;
                          }
                          if (isUscita) {
                            globalUscita += qty;
                            locStats[lName].uscita += qty;
                          }
                        }
                      });
                    }

                    const dispGlobale = globalIngresso - globalUscita;

                    return (
                      <tr key={w.id || idx}>
                        {colLayout.map((col, i) => {
                          let val = w[col.key];
                          if (col.key === 'country' && (!val || val.trim() === '')) {
                            val = 'Non spec.';
                          }
                          return (
                            <td key={col.key} className={i === 0 ? "text-left text-bold" : ""}>
                              {val}
                            </td>
                          );
                        })}
                        <td className="text-bold">{globalIngresso || ''}</td>
                        <td className="text-bold">{dispGlobale === 0 && globalUscita === 0 && globalIngresso === 0 ? '' : dispGlobale}</td>
                        <td className="text-bold">{globalUscita || ''}</td>
                        {locationsToRender.map(loc => {
                          const stats = locStats[loc];
                          const disp = stats.ingresso - stats.uscita;
                          return (
                            <React.Fragment key={loc + w.id}>
                              <td>{disp === 0 && stats.uscita === 0 && stats.ingresso === 0 ? '' : disp}</td>
                              {!showOnlyDisp && <td>{stats.uscita === 0 ? '' : stats.uscita}</td>}
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ marginTop: 'auto', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold' }}>
                <div style={{ width: '33%', textAlign: 'left' }}></div>
                <div style={{ width: '33%', textAlign: 'center' }}>
                  Pagina {pageIndex + 1} di {pages.length}
                </div>
                <div style={{ width: '33%', textAlign: 'right' }}>
                  Data: {today}
                </div>
              </div>
            </div>
          ));
        })()}
      </>
    </>
  );
}
