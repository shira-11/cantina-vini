'use client';

import React, { useEffect, useState } from 'react';
import { Wine, ArrowLeft } from 'lucide-react';

export default function PrintScheda() {
  const [sections, setSections] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [groupBy, setGroupBy] = useState(null);
  const [showOnlyDisp, setShowOnlyDisp] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [hideEmptyLocations, setHideEmptyLocations] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedNamesStr = sessionStorage.getItem('printWineNames');
      let storedNames = null;
      if (storedNamesStr) {
        try {
          const parsed = JSON.parse(storedNamesStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            storedNames = parsed;
          }
        } catch(e) {}
      }

      // Scarichiamo i vini e TUTTE le cantine dal database
      Promise.all([
        fetch('/api/wines').then(res => res.json()),
        fetch('/api/locations').then(res => res.json())
      ])
        .then(([allWines, allLocs]) => {
          // Raggruppiamo i vini proprio come nella home page
          const groupedMap = new Map();
          for (const w of allWines) {
            if (storedNames && !storedNames.includes(w.name)) continue; // Teniamo solo quelli selezionati se presenti

            if (!groupedMap.has(w.name)) {
              groupedMap.set(w.name, {
                name: w.name,
                country: w.country,
                category: w.category,
                wines: []
              });
            }
            groupedMap.get(w.name).wines.push(w);
          }

            // Ordiniamo mantenendo l'ordine alfabetico
            const parsed = Array.from(groupedMap.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            
            const currentGroupBy = sessionStorage.getItem('printGroupBy');
            if (currentGroupBy === 'filtri_attivi') {
              setGroupBy(currentGroupBy);
              const groupsByCountry = new Map();
              for (const g of parsed) {
                const c = g.country || 'Altra Nazione';
                if (!groupsByCountry.has(c)) groupsByCountry.set(c, []);
                groupsByCountry.get(c).push(g);
              }
              
              const sortedCountries = Array.from(groupsByCountry.keys()).sort();
              const newSections = [];
              
              for (const c of sortedCountries) {
                const cGroups = groupsByCountry.get(c);
                const uniqueRegions = [...new Set(cGroups.flatMap(g => g.wines.map(w => w.region)).filter(Boolean))].sort();
                const uniqueCategories = [...new Set(cGroups.map(g => g.category).filter(Boolean))].sort();
                
                const coverLines = [c.toUpperCase()];
                if (uniqueRegions.length > 0) coverLines.push(uniqueRegions.join(', ').toUpperCase());
                if (uniqueCategories.length > 0) coverLines.push(uniqueCategories.join(', ').toUpperCase());
                
                newSections.push({ coverLines, groups: cGroups });
              }
              
              setSections(newSections);
            } else if (currentGroupBy) {
              setGroupBy(currentGroupBy);
              const sectionsMap = new Map();
              for (const group of parsed) {
                let sectionKeys = [];
                const w = group.wines[0];
                
                if (currentGroupBy === 'nazione') {
                  const country = w.country || 'Nazione Sconosciuta';
                  const cat = w.category ? w.category.split(' ')[0] : 'Altro';
                  sectionKeys.push({ title: country.toUpperCase(), subtitle: cat.toUpperCase() });
                } else if (currentGroupBy === 'regione') {
                  const region = w.region || 'Regione Sconosciuta';
                  sectionKeys.push({ title: region.toUpperCase(), subtitle: null });
                } else if (currentGroupBy === 'categoria') {
                  const cat = w.category || 'Categoria Sconosciuta';
                  sectionKeys.push({ title: cat.toUpperCase(), subtitle: null });
                } else if (currentGroupBy === 'cantina') {
                  let locs = new Set();
                  for (const m of w.movements || []) {
                    if (m.location?.name) locs.add(m.location.name);
                  }
                  if (locs.size === 0) locs.add('Nessuna Cantina');
                  for (const l of Array.from(locs)) {
                    sectionKeys.push({ title: l.toUpperCase(), subtitle: '' });
                  }
                }
                
                for (const key of sectionKeys) {
                  const keyStr = key.title + '|' + key.subtitle;
                  if (!sectionsMap.has(keyStr)) {
                    sectionsMap.set(keyStr, { title: key.title, subtitle: key.subtitle, groups: [] });
                  }
                  sectionsMap.get(keyStr).groups.push(group);
                }
              }
              const sortedSections = Array.from(sectionsMap.values()).sort((a, b) => a.title.localeCompare(b.title));
              setSections(sortedSections);
            } else {
              setSections([{ title: null, subtitle: null, groups: parsed }]);
            }

            // Usiamo TUTTE le location, indipendentemente dalla giacenza, come richiesto
            const locNames = allLocs.map(l => l.name).sort();
            setLocations(locNames);
            setSelectedLocations(locNames);
          })
          .catch(err => {
            console.error("Errore nel caricamento dati stampa:", err);
            alert("Errore nel caricamento dei dati per la stampa.");
          });
    }
  }, []);

  const getDynamicFileName = () => {
    let baseName = 'Schede_Vini';
    try {
      let allWineNames = [];
      for (const sec of sections) {
        if (sec.groups) {
          allWineNames.push(...sec.groups.map(g => g.name));
        }
      }
      const uniqueWineNames = [...new Set(allWineNames)];

      if (uniqueWineNames.length === 1) {
        baseName = uniqueWineNames[0].replace(/[^a-zA-Z0-9\s\-]/g, '').trim().replace(/\s+/g, '_');
      } else {
        if (groupBy === 'nazione' || groupBy === 'filtri_attivi') {
          const countries = [...new Set(sections.map(s => {
            if (s.title) return s.title;
            if (s.coverLines && s.coverLines.length > 0) return s.coverLines[0];
            return '';
          }))].filter(Boolean);
          
          if (countries.length === 1) {
            baseName = countries[0].replace(/[^a-zA-Z0-9\s\-]/g, '').trim().replace(/\s+/g, '_');
            
            if (groupBy === 'filtri_attivi' && sections[0] && sections[0].coverLines && sections[0].coverLines.length > 1) {
              const reg = sections[0].coverLines[1].split(',')[0].replace(/[^a-zA-Z0-9\s\-]/g, '').trim().replace(/\s+/g, '_');
              if (reg) baseName += '_' + reg;
            }
          }
        } else if (groupBy === 'regione') {
          const regions = [...new Set(sections.map(s => s.title || ''))].filter(Boolean);
          if (regions.length === 1) {
            baseName = regions[0].replace(/[^a-zA-Z0-9\s\-]/g, '').trim().replace(/\s+/g, '_');
          }
        } else if (groupBy === 'categoria') {
          const cats = [...new Set(sections.map(s => s.title || ''))].filter(Boolean);
          if (cats.length === 1) {
            baseName = cats[0].replace(/[^a-zA-Z0-9\s\-]/g, '').trim().replace(/\s+/g, '_');
          }
        } else if (groupBy === 'cantina') {
          const cantine = [...new Set(sections.map(s => s.title || ''))].filter(Boolean);
          if (cantine.length === 1) {
            baseName = 'Cantina_' + cantine[0].replace(/[^a-zA-Z0-9\s\-]/g, '').trim().replace(/\s+/g, '_');
          }
        }
      }
    } catch(e) {
      console.error(e);
    }
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('it-IT').replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }).replace(':', '-');
    return `${baseName}_${dateStr}_${timeStr}`;
  };

  const formatCurrency = (val) => {
    if (val == null || isNaN(val)) return '';
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);
  };

  const getWineGrapes = (wine) => {
    if (!wine.grapeVarieties || wine.grapeVarieties.length === 0) return wine.category || '';
    return wine.grapeVarieties.map(gv => gv.percentage ? `${gv.name} ${gv.percentage}%` : gv.name).join(', ');
  };

  const getCountryFlag = (country) => {
    if (!country) return '';
    const c = country.toLowerCase().trim();
    if (c.includes('italia')) return '🇮🇹';
    if (c.includes('francia')) return '🇫🇷';
    if (c.includes('spagna')) return '🇪🇸';
    if (c.includes('germania')) return '🇩🇪';
    if (c.includes('stati uniti') || c.includes('usa')) return '🇺🇸';
    if (c.includes('sud africa')) return '🇿🇦';
    if (c.includes('nuova zelanda')) return '🇳🇿';
    if (c.includes('australia')) return '🇦🇺';
    if (c.includes('argentina')) return '🇦🇷';
    if (c.includes('cile')) return '🇨🇱';
    if (c.includes('portogallo')) return '🇵🇹';
    if (c.includes('austria')) return '🇦🇹';
    if (c.includes('svizzera')) return '🇨🇭';
    if (c.includes('grecia')) return '🇬🇷';
    if (c.includes('libano')) return '🇱🇧';
    if (c.includes('georgia')) return '🇬🇪';
    if (c.includes('slovenia')) return '🇸🇮';
    if (c.includes('croazia')) return '🇭🇷';
    if (c.includes('ungheria')) return '🇭🇺';
    if (c.includes('inghilterra') || c.includes('regno unito')) return '🇬🇧';
    if (c.includes('romania')) return '🇷🇴';
    return '🌍';
  };

  const getBadgeClass = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('ross')) return 'badge red';
    if (cat.includes('bianc')) return 'badge white';
    if (cat.includes('bollicin') || cat.includes('champagne')) return 'badge sparkling';
    return 'badge';
  };

  const calculateLocationStats = (wine, locName) => {
    if (!wine.movements) return { disp: 0, usato: 0 };
    const locMovements = wine.movements.filter(m => m.location?.name === locName);
    let ingressi = 0;
    let totUscite = 0;
    let veriConsumati = 0;
    for (const m of locMovements) {
      if (m.movementType === 'Ingresso') ingressi += m.quantity;
      if (m.movementType === 'Uscita') {
        totUscite += m.quantity;
        const isTransferOut = locations.some(locString => {
          const locNameClean = (locString || '').toLowerCase().replace('cantina', '').trim();
          const reasonClean = (m.reason || '').toLowerCase().replace('cantina', '').trim();
          return locNameClean === reasonClean && locNameClean.length > 0;
        });
        if (!isTransferOut) {
          veriConsumati += m.quantity;
        }
      }
    }
    return {
      disp: ingressi - totUscite,
      usato: veriConsumati
    };
  };

  if (sections.length === 0 || sections.every(s => s.groups.length === 0)) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Nessun dato da stampare. Torna alla home e riprova.</div>;
  }

  const today = new Date().toLocaleDateString('it-IT');

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @page {
          size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'};
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
          .no-print {
            display: none !important;
          }
        }
        /* Nasconde l'header globale di layout.js solo in questa pagina */
        header.header {
          display: none !important;
        }
        main {
          padding: 0 !important;
        }
        #pdf-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }
        .print-page {
          page-break-after: always;
          position: relative;
          width: ${isLandscape ? '277mm' : '190mm'};
          max-width: 96vw;
          min-height: ${isLandscape ? '180mm' : '260mm'};
          background: white;
          padding: 10mm;
          padding-bottom: 15mm;
          margin: 0 auto 20px auto;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }
        .print-page:last-child {
          page-break-after: auto;
        }
        .cover-page {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          min-height: ${isLandscape ? '160mm' : '230mm'} !important;
          padding: 20mm 10mm !important;
          box-sizing: border-box !important;
          break-after: page !important;
          page-break-after: always !important;
        }
        .cover-title {
          font-size: 64px;
          font-weight: bold;
          margin: 0;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .cover-subtitle {
          font-size: 32px;
          font-weight: normal;
          margin-top: 15px;
          text-align: center;
          text-transform: uppercase;
          color: #333;
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
          @page {
            size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'} !important;
            margin: 5mm !important;
          }
          .print-page {
            position: relative !important;
            box-shadow: none !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            padding: 5mm !important;
            padding-bottom: 10mm !important;
            page-break-before: always !important;
            break-before: page !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            display: block !important;
            overflow: visible !important;
          }
          .print-page:first-of-type, .print-page:first-child {
            page-break-before: auto !important;
            break-before: auto !important;
          }
          .print-page:last-child {
            break-after: auto !important;
            page-break-after: auto !important;
          }
          thead {
            display: table-header-group;
          }
          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
        .print-page:last-child {
          page-break-after: auto;
        }
        .header-section {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 12px;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .photo-container {
          width: 240px;
          height: 310px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #f1f5f9;
          background: #f8fafc;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .photo-container img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
          object-fit: contain;
        }
        .info-container {
          flex: 1;
        }
        .wine-title {
          font-size: 24px;
          font-weight: bold;
          margin: 0 0 10px 0;
        }
        .wine-subtitle {
          font-size: 16px;
          color: #333;
          margin: 0 0 8px 0;
        }
        .wine-grapes {
          font-size: 14px;
          color: #555;
        }
        .inventory-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
          font-size: 12px;
          page-break-inside: auto;
        }
        .inventory-table tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        .inventory-table thead {
          display: table-header-group;
        }
        .inventory-table tfoot {
          display: table-footer-group;
        }
        .inventory-table th, .inventory-table td {
          border: 1px solid #ddd;
          padding: 6px 4px;
          text-align: center;
          vertical-align: middle;
        }
        .inventory-table th {
          background-color: #f9fafb;
          font-weight: bold;
        }
        .print-page-footer {
          position: absolute;
          bottom: 8mm;
          left: 15mm;
          right: 15mm;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #666;
        }
      `}} />

      <div className="no-print" style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(82, 86, 89, 0.95)',
        backdropFilter: 'blur(5px)',
        width: '100%',
        padding: '16px 0',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
              onClick={() => window.history.back()}
            >
              <ArrowLeft size={32} color="white" />
              <Wine size={26} color="var(--primary-color)" />
              <h2 style={{ color: 'white', margin: 0, fontSize: '1.4rem' }}>CANTINA</h2>
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
                title="Nascondi colonne delle cantine che non hanno giacenza per questo vino"
              >
                {hideEmptyLocations ? '🧹 Solo Cantine Attive' : '👁️ Mostra Tutte'}
              </button>

              <button onClick={() => {
                const originalTitle = document.title;
                const fileName = getDynamicFileName();
                document.title = fileName;
                
                window.print();
                
                setTimeout(() => {
                  document.title = originalTitle;
                }, 2000);
              }} style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 'bold', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                🖨️ Stampa
              </button>

              <button onClick={async () => {
                try {
                  const btn = document.getElementById('btn-download-pdf');
                  const originalHtml = btn.innerHTML;
                  btn.innerHTML = '⏳ Generazione...';
                  btn.disabled = true;

                  const fileName = getDynamicFileName() + '.pdf';

                  const { jsPDF } = await import('jspdf');
                  const html2canvas = (await import('html2canvas')).default;
                  const pages = document.querySelectorAll('.print-page');

                  if (pages.length === 0) {
                    btn.innerHTML = originalHtml;
                    btn.disabled = false;
                    return;
                  }

                  const originalBg = document.body.style.backgroundColor;
                  document.body.style.backgroundColor = 'white';

                  const pdf = new jsPDF(isLandscape ? 'l' : 'p', 'mm', 'a4');
                  const pdfWidth = pdf.internal.pageSize.getWidth();
                  
                  for (let i = 0; i < pages.length; i++) {
                    btn.innerHTML = `⏳ Pagina ${i+1}/${pages.length}...`;
                    const canvas = await html2canvas(pages[i], { scale: 1.5, useCORS: true, logging: false });
                    const imgData = canvas.toDataURL('image/jpeg', 0.95);
                    
                    const imgProps = pdf.getImageProperties(imgData);
                    const height = (imgProps.height * pdfWidth) / imgProps.width;
                    
                    if (i > 0) pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, height);
                  }

                  const blob = pdf.output('blob');
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.style.display = 'none';
                  a.href = url;
                  a.download = fileName;
                  document.body.appendChild(a);
                  a.click();
                  setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }, 1000);

                  document.body.style.backgroundColor = originalBg;
                  btn.innerHTML = originalHtml;
                  btn.disabled = false;
                } catch (err) {
                  console.error(err);
                  alert("Errore durante la generazione automatica. Usa il bottone Stampa.");
                  const btn = document.getElementById('btn-download-pdf');
                  if(btn) { btn.innerHTML = '📄 Scarica PDF'; btn.disabled = false; }
                }
              }} id="btn-download-pdf" style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 'bold', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                📄 Scarica PDF
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
      </div>

      <div id="pdf-content">
        {sections.map((section, sectionIndex) => (
          <React.Fragment key={`section-${sectionIndex}`}>
            {(section.title || (section.coverLines && section.coverLines.length > 0)) && (
              <div className="print-page cover-page">
                {section.coverLines ? (
                  section.coverLines.map((line, idx) => (
                    <div key={idx} className={idx === 0 ? "cover-title" : "cover-subtitle"} style={idx > 1 ? { marginTop: '20px' } : {}}>
                      {line}
                    </div>
                  ))
                ) : (
                  <>
                    <div className="cover-title">{section.title}</div>
                    {section.subtitle && <div className="cover-subtitle">{section.subtitle}</div>}
                  </>
                )}
              </div>
            )}
            
            {/* Tabella Riassuntiva per Nazione -> Divisa per Regione */}
            {(section.title || (section.coverLines && section.coverLines.length > 0)) && (() => {
              const getCatGrp = (cat) => {
                if (!cat) return 'Altri';
                const c = cat.toLowerCase();
                if (c.includes('bianc')) return 'Bianco';
                if (c.includes('ross')) return 'Rosso';
                if (c.includes('bollicin') || c.includes('champagne')) return 'Bollicine';
                return 'Altri';
              };

              const matrix = {}; 
              const regionSet = new Set();

              for (const group of section.groups) {
                for (const w of group.wines) {
                  const cat = getCatGrp(w.category);
                  const reg = w.region || 'Altre';
                  regionSet.add(reg);
                  
                  if (!matrix[cat]) matrix[cat] = {};
                  if (!matrix[cat][reg]) matrix[cat][reg] = 0;
                  
                  matrix[cat][reg] += (w.totalStock || 0);
                }
              }

              const rows = ['Bianco', 'Rosso', 'Bollicine', 'Altri'];
              const cols = Array.from(regionSet).sort();
              if (cols.length === 0) return null;

              const activeRows = rows.filter(r => matrix[r] && Object.values(matrix[r]).some(v => v > 0));
              if (activeRows.length === 0) return null;

              const totBianco = cols.reduce((sum, c) => sum + (matrix['Bianco']?.[c] || 0), 0);
              const totRosso = cols.reduce((sum, c) => sum + (matrix['Rosso']?.[c] || 0), 0);
              const totBollicine = cols.reduce((sum, c) => sum + (matrix['Bollicine']?.[c] || 0), 0);
              const totAltri = cols.reduce((sum, c) => sum + (matrix['Altri']?.[c] || 0), 0);
              const grandTotal = totBianco + totRosso + totBollicine + totAltri;

              const formatNum = (num) => num ? new Intl.NumberFormat('it-IT').format(num) : '-';

              return (
                <div className="print-page" style={{ padding: '15mm', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '24px', textTransform: 'uppercase', marginBottom: '2rem', textAlign: 'center' }}>
                    Giacenze {(section.coverLines && section.coverLines.length > 0) ? section.coverLines[0] : section.title} {section.subtitle ? `- ${section.subtitle}` : ''}
                  </h2>
                  <div style={{ width: '100%', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#1e293b', color: 'white' }}>
                          <th style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'left' }}>Regione / Area</th>
                          <th style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'center' }}>Bianco</th>
                          <th style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'center' }}>Rosso</th>
                          <th style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'center' }}>Bollicine</th>
                          <th style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'center' }}>Altri</th>
                          <th style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'center', backgroundColor: '#0f172a' }}>Totale</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cols.map((reg, rIdx) => {
                          const b = matrix['Bianco']?.[reg] || 0;
                          const r = matrix['Rosso']?.[reg] || 0;
                          const bol = matrix['Bollicine']?.[reg] || 0;
                          const alt = matrix['Altri']?.[reg] || 0;
                          const regTotal = b + r + bol + alt;

                          if (regTotal <= 0) return null;

                          return (
                            <tr key={reg} style={{ backgroundColor: rIdx % 2 === 1 ? '#f8fafc' : 'white' }}>
                              <td style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'left', fontWeight: 'bold', color: '#0f172a' }}>{reg}</td>
                              <td style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'center' }}>{formatNum(b)}</td>
                              <td style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'center' }}>{formatNum(r)}</td>
                              <td style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'center' }}>{formatNum(bol)}</td>
                              <td style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'center' }}>{formatNum(alt)}</td>
                              <td style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f1f5f9' }}>{formatNum(regTotal)}</td>
                            </tr>
                          );
                        })}
                        <tr style={{ backgroundColor: '#e2e8f0', fontWeight: 'bold', borderTop: '2px solid #0f172a' }}>
                          <td style={{ border: '1px solid #cbd5e1', padding: '12px 14px', textAlign: 'left', color: '#0f172a' }}>TOTALE GENERALE</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '12px 14px', textAlign: 'center' }}>{formatNum(totBianco)}</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '12px 14px', textAlign: 'center' }}>{formatNum(totRosso)}</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '12px 14px', textAlign: 'center' }}>{formatNum(totBollicine)}</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '12px 14px', textAlign: 'center' }}>{formatNum(totAltri)}</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '12px 14px', textAlign: 'center', color: '#059669' }}>{formatNum(grandTotal)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {(() => {
              const chunkArray = (arr, size) => {
                const res = [];
                for (let i = 0; i < arr.length; i += size) {
                  res.push(arr.slice(i, i + size));
                }
                return res;
              };

              const pages = [];
              const ROWS_FIRST = 10;
              const ROWS_NEXT = 25;

              const sortedGroups = [...section.groups].sort((a, b) => {
                const catA = (a.category || 'ALTRE CATEGORIE').toUpperCase();
                const catB = (b.category || 'ALTRE CATEGORIE').toUpperCase();
                if (catA < catB) return -1;
                if (catA > catB) return 1;
                return (a.name || '').localeCompare(b.name || '');
              });

              let currentCategory = null;

              sortedGroups.forEach((group) => {
                const groupCategory = (group.category || 'ALTRE CATEGORIE').toUpperCase();
                if (groupCategory !== currentCategory) {
                  currentCategory = groupCategory;
                  pages.push({ isCategoryDivider: true, categoryName: currentCategory });
                }

                const mainWine = group.wines.find(w => w.photo) || group.wines[0];
                const photo = mainWine.photo || null;
                const sortedWines = [...group.wines].sort((a, b) => parseInt(a.vintage || 0) - parseInt(b.vintage || 0));

                if (sortedWines.length <= ROWS_FIRST) {
                  pages.push({ group, mainWine, photo, chunk: sortedWines, isFirst: true, cat: currentCategory });
                } else {
                  pages.push({ group, mainWine, photo, chunk: sortedWines.slice(0, ROWS_FIRST), isFirst: true, cat: currentCategory });
                  const rest = sortedWines.slice(ROWS_FIRST);
                  const nextChunks = chunkArray(rest, ROWS_NEXT);
                  nextChunks.forEach(chk => {
                    pages.push({ group, mainWine, photo: null, chunk: chk, isFirst: false, cat: currentCategory });
                  });
                }
              });

              const catTotals = {};
              pages.forEach(p => {
                if (!p.isCategoryDivider && p.cat) {
                  catTotals[p.cat] = (catTotals[p.cat] || 0) + 1;
                }
              });

              const catCurrent = {};
              pages.forEach(p => {
                if (!p.isCategoryDivider && p.cat) {
                  catCurrent[p.cat] = (catCurrent[p.cat] || 0) + 1;
                  p.pageNum = catCurrent[p.cat];
                  p.pageTotal = catTotals[p.cat];
                }
              });

              return pages.map((page, index) => {
                if (page.isCategoryDivider) {
                  return (
                    <div className="print-page cover-page" key={`cat-div-${index}`}>
                      <div className="cover-title">{page.categoryName}</div>
                    </div>
                  );
                }

                const { group, mainWine, photo, chunk, isFirst, pageNum, pageTotal } = page;
                return (
                  <div className="print-page" key={`${group.name}-${index}`}>
                    <div className="header-section" style={{ marginBottom: isFirst ? '0' : '15px' }}>
                      {isFirst ? (
                        <>
                          <div className="photo-container">
                            {photo ? (
                              <img src={photo} alt={group.name} />
                            ) : (
                              <div style={{ color: '#ccc' }}>Nessuna foto</div>
                            )}
                          </div>
                          <div className="info-container">
                            <h1 className="wine-title">{getCountryFlag(mainWine.country)} {group.name}</h1>
                            <p className="wine-subtitle">
                              {mainWine.country ? mainWine.country + ' - ' : ''}
                              {mainWine.producer ? mainWine.producer + ' - ' : ''}
                              {mainWine.classification ? (mainWine.classification.trim().startsWith('(') ? `${mainWine.classification} ` : `(${mainWine.classification}) `) : ''}
                              {mainWine.producerCellar && mainWine.producerCellar !== mainWine.producer ? mainWine.producerCellar : ''}
                            </p>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                              {mainWine.category && (
                                <span className={getBadgeClass(mainWine.category)} style={{ marginBottom: 0 }}>
                                  {mainWine.category}
                                </span>
                              )}
                              <span className="wine-grapes" style={{ marginBottom: 0 }}>
                                {getWineGrapes(mainWine) !== mainWine.category ? getWineGrapes(mainWine) : ''}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ width: '100%', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
                          <h1 className="wine-title" style={{ fontSize: '18px', margin: 0 }}>
                            {getCountryFlag(mainWine.country)} {group.name} <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal' }}>(Continua...)</span>
                          </h1>
                        </div>
                      )}
                    </div>
                    {(() => {
                      const locationsToRender = selectedLocations.filter(loc => {
                        if (!hideEmptyLocations) return true;
                        return group.wines.some(w => {
                          const stats = calculateLocationStats(w, loc);
                          return stats.disp > 0 || stats.usato > 0;
                        });
                      });

                      return (
                        <div className="info-container" style={{ width: '100%' }}>
                          <table className="inventory-table">
                            <thead>
                              <tr>
                                <th colSpan="5" style={{ textAlign: 'left', borderRight: '2px solid #ccc' }}>Vino / Annate</th>
                                {locationsToRender.map(loc => (
                                  <th colSpan={showOnlyDisp ? 1 : 2} key={loc} style={{ borderRight: '2px solid #ccc' }}>
                                    {loc.replace(/cantina\s*/i, '').trim()}
                                  </th>
                                ))}
                              </tr>
                              <tr>
                                <th>Annata</th>
                                <th>Nazione</th>
                                <th>Formato</th>
                                <th>Prezzo</th>
                                <th style={{ borderRight: '2px solid #ccc' }}>Disp.Tot</th>
                                {locationsToRender.map(loc => (
                                  <React.Fragment key={loc + '-sub'}>
                                    <th style={showOnlyDisp ? { borderRight: '2px solid #ccc' } : {}}>Disp.</th>
                                    {!showOnlyDisp && <th style={{ borderRight: '2px solid #ccc' }}>Usato</th>}
                                  </React.Fragment>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {chunk.map((wine) => {
                                let displayFormat = wine.bottleType || '';
                                const btLower = displayFormat.toLowerCase();
                                if (btLower.includes('0.75') || btLower.includes('0,75') || btLower.includes('normale')) {
                                  displayFormat = '';
                                } else {
                                  const match = displayFormat.match(/(\d+(?:[.,]\d+)?\s*[Ll])/);
                                  if (match) {
                                    displayFormat = match[1].toUpperCase();
                                  }
                                }
                                return (
                                <tr key={wine.id}>
                                  <td>{wine.vintage}</td>
                                  <td>{getCountryFlag(wine.country)} {wine.country || '-'}</td>
                                  <td style={{ fontWeight: 'bold' }}>{displayFormat}</td>
                                  <td>{formatCurrency((() => {
                                    if (!wine.movements || wine.movements.length === 0) return null;
                                    const ingressi = wine.movements.filter(m => m.movementType === 'Ingresso' && m.price != null && m.price > 0 && m.quantity > 0);
                                    if (ingressi.length > 0) {
                                      let totalCost = 0;
                                      let totalQty = 0;
                                      for (const m of ingressi) {
                                        totalCost += m.price * m.quantity;
                                        totalQty += m.quantity;
                                      }
                                      return totalCost / totalQty;
                                    }
                                    const movementsWithPrice = [...wine.movements].filter(m => m.price != null).sort((a, b) => new Date(b.date) - new Date(a.date));
                                    return movementsWithPrice.length > 0 ? movementsWithPrice[0].price : null;
                                  })())}</td>
                                  <td style={{ borderRight: '2px solid #ccc', fontWeight: 'bold' }}>{wine.totalStock || 0}</td>
                                  {locationsToRender.map(loc => {
                                    const stats = calculateLocationStats(wine, loc);
                                    return (
                                      <React.Fragment key={loc + '-data'}>
                                        <td style={showOnlyDisp ? { borderRight: '2px solid #ccc' } : {}}>{stats.disp > 0 ? stats.disp : ''}</td>
                                        {!showOnlyDisp && <td style={{ borderRight: '2px solid #ccc' }}>{stats.usato > 0 ? stats.usato : ''}</td>}
                                      </React.Fragment>
                                    );
                                  })}
                                </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                    <div className="print-page-footer">
                      <span style={{ flex: 1, textAlign: 'left' }}></span>
                      <span style={{ flex: 1, textAlign: 'center' }}>Pagina {pageNum} di {pageTotal}</span>
                      <span style={{ flex: 1, textAlign: 'right' }}>Data stampa: {today}</span>
                    </div>
                  </div>
                );
              });
            })()}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}
