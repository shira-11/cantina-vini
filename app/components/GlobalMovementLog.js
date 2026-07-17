'use client';
import { useState, useEffect } from 'react';
import { X, Loader2, ArrowRightCircle, ArrowLeftCircle, User, Edit3 } from 'lucide-react';

export default function GlobalMovementLog({ isOpen, onClose }) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterModifiche, setFilterModifiche] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMovements();
    }
  }, [isOpen]);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/movements/global?limit=50');
      const data = await res.json();
      if (data.movements) {
        setMovements(data.movements);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '100%', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 className="modal-title" style={{ margin: 0 }}>Registro Movimenti Globale</h2>
            <button 
              onClick={() => setFilterModifiche(!filterModifiche)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid',
                borderColor: filterModifiche ? '#bfdbfe' : '#e2e8f0',
                backgroundColor: filterModifiche ? '#eff6ff' : '#f8fafc',
                color: filterModifiche ? '#2563eb' : '#64748b',
                cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s',
                fontSize: '0.875rem'
              }}
            >
              <Edit3 size={16} />
              {filterModifiche ? 'Mostra Tutti' : 'Ultime Modifiche'}
            </button>
          </div>
          <button className="btn btn-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div style={{ padding: '1rem', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}><Loader2 className="animate-spin" size={32} color="#94a3b8" /></div>
          ) : movements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Nessun movimento registrato.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {movements.filter(m => filterModifiche ? (m.movementType === 'Modifica' || m.movementType === 'Modifica Scheda') : true).map(m => {
                const isIngresso = m.movementType === 'Ingresso';
                const isModifica = m.movementType === 'Modifica' || m.movementType === 'Modifica Scheda';
                
                let icon = isIngresso ? <ArrowRightCircle size={18} /> : <ArrowLeftCircle size={18} />;
                let color = isIngresso ? '#16a34a' : '#dc2626';
                let label = isIngresso ? 'Carico' : 'Scarico';
                let quantityStr = isIngresso ? `+${m.quantity}` : `-${m.quantity}`;

                if (isModifica) {
                  icon = <Edit3 size={18} />;
                  color = '#3b82f6';
                  label = 'Modifica';
                  quantityStr = '';
                }

                return (
                  <div key={m.id} style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '8px', 
                    padding: '1rem', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center'
                  }}>
                    {/* Immagine Vino */}
                    <div style={{ width: '60px', height: '60px', flexShrink: 0, backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {m.wine.photo ? (
                        <img src={m.wine.photo} alt={m.wine.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ fontSize: '24px', opacity: 0.3 }}>🍷</div>
                      )}
                    </div>
                    
                    {/* Dettagli */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                        {new Date(m.date).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '0.25rem' }}>
                        {m.wine.name} {m.wine.vintage && <span style={{ fontWeight: 'normal', color: '#64748b' }}>{m.wine.vintage}</span>}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#475569' }}>
                        {m.wine.producer && <span>Prod: {m.wine.producer} | </span>}
                        {isModifica ? null : `Cantina: ${m.location?.name || ''}`}
                      </div>
                      {(m.user || m.notes) && (
                        <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem', display: 'flex', gap: '1rem' }}>
                          {m.user && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><User size={14}/> {m.user}</span>}
                          {m.notes && <span>📝 {m.notes}</span>}
                        </div>
                      )}
                    </div>

                    {/* Quantità e Tipo */}
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'flex-end',
                      gap: '0.5rem',
                      minWidth: '80px'
                    }}>
                      <div style={{ 
                        color: color,
                        fontWeight: '700',
                        fontSize: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {icon}
                        {quantityStr}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>
                        {label}
                      </div>
                    </div>
                  </div>

                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
