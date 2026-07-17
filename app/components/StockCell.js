import React, { useState } from 'react';
import { getStockBreakdown } from '../utils/wineHelpers';

export const StockCell = ({ winesArray, displayStock, filters, setHoveredPhoto }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (filters.location || displayStock <= 0) {
    return <span className={displayStock > 0 ? 'stock-positive' : 'stock-zero'}>{displayStock} bt.</span>;
  }

  const breakdown = getStockBreakdown(winesArray);
  if (breakdown.length === 0) {
    return <span className={displayStock > 0 ? 'stock-positive' : 'stock-zero'}>{displayStock} bt.</span>;
  }

  return (
    <div
      onMouseEnter={(e) => { e.stopPropagation(); setShowTooltip(true); if (setHoveredPhoto) setHoveredPhoto(null); }}
      onMouseLeave={(e) => { e.stopPropagation(); setShowTooltip(false); }}
      onClick={(e) => { e.stopPropagation(); setShowTooltip(!showTooltip); }}
      style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
    >
      <span className="stock-positive">
        {displayStock} bt.
      </span>
      {showTooltip && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          right: '50%',
          transform: 'translateX(50%)',
          marginBottom: '8px',
          backgroundColor: '#1e293b',
          color: '#f8fafc',
          padding: '8px 12px',
          borderRadius: '8px',
          zIndex: 50,
          whiteSpace: 'nowrap',
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          fontSize: '0.85rem',
          textAlign: 'left'
        }}>
          {breakdown.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', padding: '3px 0', borderBottom: i < breakdown.length - 1 ? '1px solid #334155' : 'none' }}>
              <span style={{ color: '#94a3b8' }}>{item.loc}</span>
              <span style={{ fontWeight: '600' }}>{item.qty} bt.</span>
            </div>
          ))}
          <div style={{ position: 'absolute', top: '100%', right: '50%', transform: 'translateX(50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #1e293b' }}></div>
        </div>
      )}
    </div>
  );
};
