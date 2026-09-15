'use client';

export default function CantinaLogoBadge({ showArchive = false, size = 'normal', onClick }) {
  const isSmall = size === 'small';

  return (
    <div
      onClick={onClick}
      title="Torna alla Home e resetta filtri"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: isSmall ? '0.5rem' : '0.75rem',
        cursor: 'pointer',
        userSelect: 'none',
        padding: isSmall ? '0.2rem 0' : '0.35rem 0.5rem',
        borderRadius: '12px',
        transition: 'all 0.2s ease',
        background: 'transparent'
      }}
    >
      {/* Emblem Badge (Opzione 2: Italia + Toscana Bordeaux + Oro) */}
      <div
        style={{
          width: isSmall ? '38px' : '48px',
          height: isSmall ? '38px' : '48px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #1e293b 0%, #0f172a 100%)',
          border: '2px solid #d97706',
          boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          flexShrink: 0,
          overflow: 'hidden'
        }}
      >
        <svg
          viewBox="0 0 100 100"
          style={{ width: '85%', height: '85%' }}
        >
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
            <linearGradient id="tuscanyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#881337" />
            </linearGradient>
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Anello decorativo interno a punti */}
          <circle cx="50" cy="50" r="44" fill="none" stroke="url(#goldGrad)" strokeWidth="1" strokeDasharray="2 2.5" opacity="0.6" />

          {/* Sagoma Mappa Italia (Vettoriale stilizzata) */}
          <g transform="translate(18, 12) scale(0.65)" opacity="0.95">
            {/* Penisola Italiana (Nord, Centro, Sud, Isole) */}
            <path
              d="M 35 15 L 48 10 L 62 14 L 68 22 L 58 28 L 52 25 L 45 28 Z
                 M 68 22 L 78 26 L 82 34 L 75 42 L 68 36 Z
                 M 52 25 L 56 32 L 64 36 L 68 45 L 62 55 L 56 60 L 58 68 L 65 72 L 72 70 L 76 75 L 72 82 L 62 80 L 52 72 L 48 62 L 46 50 L 45 38 Z
                 M 32 65 L 42 63 L 45 74 L 38 82 L 28 78 Z
                 M 28 42 L 32 40 L 33 50 L 29 52 Z"
              fill="url(#goldGrad)"
              stroke="#fbbf24"
              strokeWidth="0.8"
            />
            {/* Regione Toscana Evidenziata in Bordeaux */}
            <path
              d="M 46 34 Q 52 30 55 36 Q 58 42 53 45 Q 47 46 45 40 Z"
              fill="url(#tuscanyGrad)"
              stroke="#ffe4e6"
              strokeWidth="1.2"
              filter="url(#goldGlow)"
            />
          </g>

          {/* Icona Calice di Vino Oro Sovrapposto in Basso a Destra */}
          <g transform="translate(56, 45) scale(0.38)">
            <path
              d="M 20 5 C 10 5, 5 20, 15 35 C 20 42, 23 45, 23 55 L 23 75 L 10 75 L 10 82 L 40 82 L 40 75 L 27 75 L 27 55 C 27 45, 30 42, 35 35 C 45 20, 40 5, 30 5 Z"
              fill="url(#goldGrad)"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            {/* Liquido vino rosso all'interno del calice */}
            <path
              d="M 12 22 Q 25 28 38 22 C 38 32, 28 38, 25 38 C 22 38, 12 32, 12 22 Z"
              fill="url(#tuscanyGrad)"
            />
          </g>
        </svg>
      </div>

      {/* Titolo e Sottotitolo */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyWidth: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <h2
            style={{
              margin: 0,
              fontSize: isSmall ? '1.15rem' : '1.35rem',
              fontWeight: '800',
              letterSpacing: '1.2px',
              background: 'linear-gradient(135deg, #fff 0%, #fbbf24 60%, #d97706 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 10px rgba(217, 119, 6, 0.2)'
            }}
          >
            {showArchive ? 'ARCHIVIO VINI' : 'CANTINA'}
          </h2>
        </div>
        <span
          style={{
            fontSize: isSmall ? '0.62rem' : '0.68rem',
            fontWeight: '700',
            letterSpacing: '1.5px',
            color: '#94a3b8',
            textTransform: 'uppercase',
            marginTop: '-1px'
          }}
        >
          🇮🇹 Toscana • Italia
        </span>
      </div>
    </div>
  );
}
