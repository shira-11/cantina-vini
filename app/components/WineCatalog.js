'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, Printer, MapPin, Calendar, Info } from 'lucide-react';

export default function WineCatalog() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('Tutti');
  const [filterOrigin, setFilterOrigin] = useState('Tutte');

  const fetchWines = async () => {
    try {
      const res = await fetch('/api/wines');
      const data = await res.json();
      setWines(data);
    } catch (error) {
      console.error('Errore nel caricamento dei vini', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWines();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questo vino?')) return;
    try {
      await fetch(`/api/wines/${id}`, { method: 'DELETE' });
      setWines(wines.filter(w => w.id !== id));
    } catch (error) {
      console.error("Errore durante l'eliminazione del vino", error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredWines = wines.filter(wine => {
    if (filterType !== 'Tutti' && wine.type !== filterType) return false;
    if (filterOrigin !== 'Tutte' && wine.origin !== filterOrigin) return false;
    return true;
  });

  const getTypeClass = (type) => {
    const t = type.toLowerCase();
    if (t.includes('red') || t.includes('rosso')) return 'type-red';
    if (t.includes('white') || t.includes('bianco')) return 'type-white';
    if (t.includes('champagne') || t.includes('sparkling') || t.includes('bollicine')) return 'type-champagne';
    return 'type-other';
  };

  const uniqueOrigins = [...new Set(wines.map(w => w.origin))];
  const uniqueTypes = [...new Set(wines.map(w => w.type))];

  return (
    <div className="container page-section">
      <div className="print-header">
        <h1>VINI - Collezione Vini</h1>
        <p>Filtro: Tipo {filterType} / Origine {filterOrigin}</p>
      </div>

      <h1 className="page-title">La tua Collezione</h1>
      <p className="page-subtitle">Gestisci ed esplora la tua selezione di vini</p>

      <div className="filters-bar">
        <div className="filter-group">
          <select 
            className="filter-select"
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="Tutti">Tutti i Tipi</option>
            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select 
            className="filter-select"
            value={filterOrigin} 
            onChange={(e) => setFilterOrigin(e.target.value)}
          >
            <option value="Tutte">Tutte le Origini</option>
            {uniqueOrigins.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        
        <button className="btn btn-secondary" onClick={handlePrint}>
          <Printer size={18} /> Stampa Catalogo
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Caricamento della tua collezione...</p>
      ) : filteredWines.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <p>Nessun vino trovato con questi criteri.</p>
        </div>
      ) : (
        <div className="wine-grid">
          {filteredWines.map(wine => (
            <div key={wine.id} className="wine-card">
              <div className="wine-photo-container">
                {wine.photo ? (
                  <img src={`/uploads/${wine.photo}`} alt={wine.name} className="wine-photo" />
                ) : (
                  <div className="wine-photo-placeholder">
                    <Info size={40} />
                    <span>Nessuna Foto</span>
                  </div>
                )}
              </div>
              <div className="wine-details">
                <div>
                  <span className={`wine-type-badge ${getTypeClass(wine.type)}`}>
                    {wine.type}
                  </span>
                </div>
                <h3 className="wine-name">{wine.name}</h3>
                <div className="wine-meta">
                  <span className="wine-meta-item">
                    <MapPin size={14} /> {wine.origin}
                  </span>
                  <span className="wine-meta-item">
                    <Calendar size={14} /> {wine.vintage}
                  </span>
                </div>
                <p className="wine-description">{wine.description}</p>
                <div className="wine-actions">
                  <button className="btn btn-danger" style={{width: '100%'}} onClick={() => handleDelete(wine.id)}>
                    <Trash2 size={16} /> Elimina
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
