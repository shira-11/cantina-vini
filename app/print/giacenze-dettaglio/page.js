'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Wine } from 'lucide-react';

export default function PrintGiacenzeDettaglio() {
  const [wines, setWines] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortParam, setSortParam] = useState('name');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedNamesStr = sessionStorage.getItem('printWineNames');
      const query = new URLSearchParams(window.location.search);
      const sort = query.get('sort') || 'name';
      setSortParam(sort);

      if (storedNamesStr) {
        const storedNames = JSON.parse(storedNamesStr);

        Promise.all([
          fetch('/api/wines').then(res => res.json()),
          fetch('/api/locations').then(res => res.json())
        ])
          .then(([allWines, allLocs]) => {
            let filtered = allWines.filter(w => storedNames.includes(w.name));
            
            // Sort A-Z based on requested parameter
            filtered.sort((a, b) => {
              let valA = (a[sort] || '').toString().toLowerCase();
              let valB = (b[sort] || '').toString().toLowerCase();
              if (valA < valB) return -1;
              if (valA > valB) return 1;
              return 0;
            });

            setWines(filtered);
            setLocations(allLocs.map(l => l.name));
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

  const today = new Date().toLocaleDateString('it-IT');

  const sortLabelMap = {
    'name': 'Nome Vino',
    'country': 'Nazione',
    'producer': 'Cantina Produttrice',
    'category': 'Categoria'
  };
  const sortLabel = sortLabelMap[sortParam] || 'Nome Vino';

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @page {
          size: A4 landscape;
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
          @page { size: A4 landscape !important; margin: 15mm !important; }
          .print-page {
            box-shadow: none !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
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
          width: 277mm;
          min-height: 190mm;
          padding: 10mm;
          margin-top: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          box-sizing: border-box;
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
            <h2 style={{ color: 'white', margin: 0 }}>TORNA INDIETRO</h2>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <button onClick={() => {
              const originalTitle = document.title;
              const now = new Date();
              const dateStr = now.toLocaleDateString('it-IT').replace(/\//g, '-');
              document.title = `Giacenze_${sortParam.toUpperCase()}_${dateStr}`;
              setTimeout(() => {
                window.print();
                document.title = originalTitle;
              }, 100);
            }} style={{ padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🖨️ Stampa / Salva PDF
            </button>
          </div>
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

          const totalCols = 8 + (locations.length * 2);

          const rowsPerPageFirst = 16;
          const rowsPerPageNext = 20;

          const pages = [];
          let currentIdx = 0;
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
                    {locations.map(loc => {
                      const shortName = loc.replace(/cantina /i, '').trim();
                      return (
                        <React.Fragment key={loc}>
                          <th>Disp.<br/>{shortName}</th>
                          <th>Usato<br/>{shortName}</th>
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
                    locations.forEach(loc => {
                      locStats[loc] = { ingresso: 0, uscita: 0 };
                    });

                    if (w.movements && w.movements.length > 0) {
                      w.movements.forEach(m => {
                        const qty = m.quantity || 0;
                        const isIngresso = m.movementType === 'Ingresso';
                        const isUscita = m.movementType === 'Uscita';
                        
                        if (isIngresso) globalIngresso += qty;
                        if (isUscita) globalUscita += qty;

                        if (m.location && m.location.name) {
                          const lName = m.location.name;
                          if (locStats[lName]) {
                            if (isIngresso) locStats[lName].ingresso += qty;
                            if (isUscita) locStats[lName].uscita += qty;
                          }
                        }
                      });
                    }

                    const dispGlobale = globalIngresso - globalUscita;

                    return (
                      <tr key={w.id || idx}>
                        {colLayout.map((col, i) => (
                          <td key={col.key} className={i === 0 ? "text-left text-bold" : ""}>
                            {w[col.key]}
                          </td>
                        ))}
                        <td className="text-bold">{globalIngresso || ''}</td>
                        <td className="text-bold">{dispGlobale === 0 && globalUscita === 0 && globalIngresso === 0 ? '' : dispGlobale}</td>
                        <td className="text-bold">{globalUscita || ''}</td>
                        {locations.map(loc => {
                          const stats = locStats[loc];
                          const disp = stats.ingresso - stats.uscita;
                          return (
                            <React.Fragment key={loc + w.id}>
                              <td>{disp === 0 && stats.uscita === 0 && stats.ingresso === 0 ? '' : disp}</td>
                              <td>{stats.uscita === 0 ? '' : stats.uscita}</td>
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
