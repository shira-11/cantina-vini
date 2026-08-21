'use client';
import React from 'react';

export default function WineBottleLoader({ message = 'Preparazione stampa in corso...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
      width: '100%',
      padding: '2rem',
      backgroundColor: '#fafafa',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fillWine {
          0% {
            height: 0%;
          }
          100% {
            height: 82%;
          }
        }

        @keyframes waveMove {
          0% {
            transform: translateX(0) scaleY(1);
          }
          50% {
            transform: translateX(-25%) scaleY(1.2);
          }
          100% {
            transform: translateX(-50%) scaleY(1);
          }
        }

        @keyframes floatBubble {
          0% {
            transform: translateY(0) scale(0.6);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-80px) scale(1.2);
            opacity: 0;
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            filter: drop-shadow(0 4px 12px rgba(153, 27, 27, 0.15));
          }
          50% {
            filter: drop-shadow(0 8px 24px rgba(153, 27, 27, 0.35));
          }
        }

        .bottle-loader-container {
          position: relative;
          width: 140px;
          height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulseGlow 2.5s ease-in-out infinite;
        }

        .bottle-glass-mask {
          position: absolute;
          width: 120px;
          height: 300px;
          clip-path: url(#bottleClip);
          background: rgba(241, 245, 249, 0.9);
          border-radius: 4px;
        }

        .wine-liquid-fill {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(180deg, #be123c 0%, #881337 40%, #4c0519 100%);
          animation: fillWine 2.2s cubic-bezier(0.4, 0, 0.2, 1) forwards infinite alternate;
          box-shadow: inset 0 2px 8px rgba(255, 255, 255, 0.3);
        }

        .liquid-wave {
          position: absolute;
          top: -12px;
          left: 0;
          width: 200%;
          height: 18px;
          background: radial-gradient(ellipse at center, rgba(251, 113, 133, 0.8) 0%, rgba(190, 18, 60, 0) 70%);
          animation: waveMove 1.8s linear infinite;
        }

        .wine-bubble {
          position: absolute;
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 50%;
          animation: floatBubble 2s ease-in infinite;
        }
        `
      }} />

      {/* SVG ClipPath defining the wine bottle shape */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id="bottleClip" clipPathUnits="objectBoundingBox">
            {/* Normalized 0..1 paths for bottle shape */}
            <path d="
              M 0.38, 0.0
              L 0.62, 0.0
              L 0.62, 0.18
              C 0.62 0.24, 0.78 0.32, 0.84 0.38
              L 0.84, 0.94
              C 0.84 0.98, 0.78 1.0, 0.72 1.0
              L 0.28, 1.0
              C 0.22 1.0, 0.16 0.98, 0.16 0.94
              L 0.16, 0.38
              C 0.22 0.32, 0.38 0.24, 0.38 0.18
              Z
            " />
          </clipPath>
        </defs>
      </svg>

      <div className="bottle-loader-container">
        {/* Outer glass outline SVG */}
        <svg width="140" height="320" viewBox="0 0 140 320" style={{ position: 'absolute', zIndex: 10, pointerEvents: 'none' }}>
          {/* Outer bottle outline */}
          <path
            d="
              M 53.2 10
              L 86.8 10
              L 86.8 67.6
              C 86.8 86.8, 109.2 112.4, 117.6 131.6
              L 117.6 300.8
              C 117.6 313.6, 109.2 320, 100.8 320
              L 39.2 320
              C 30.8 320, 22.4 313.6, 22.4 300.8
              L 22.4 131.6
              C 30.8 112.4, 53.2 86.8, 53.2 67.6
              Z
            "
            fill="none"
            stroke="#475569"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Bottle Cork */}
          <rect x="54" y="2" width="32" height="9" rx="2" fill="#d97706" stroke="#92400e" strokeWidth="1.5" />
          {/* Glass reflection streak */}
          <path d="M 32 140 L 32 290" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="3" strokeLinecap="round" />
          {/* Label outline on bottle */}
          <rect x="36" y="160" width="68" height="85" rx="4" fill="rgba(255,255,255,0.85)" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="48" y1="180" x2="92" y2="180" stroke="#881337" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="54" y1="195" x2="86" y2="195" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="44" y1="225" x2="96" y2="225" stroke="#cbd5e1" strokeWidth="1" />
        </svg>

        {/* Masked liquid filling up */}
        <div className="bottle-glass-mask">
          <div className="wine-liquid-fill">
            <div className="liquid-wave" />
            <div className="wine-bubble" style={{ left: '25%', animationDelay: '0.2s' }} />
            <div className="wine-bubble" style={{ left: '50%', animationDelay: '0.7s' }} />
            <div className="wine-bubble" style={{ left: '75%', animationDelay: '1.2s' }} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: '600' }}>
          🍷 {message}
        </h3>
        <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
          Calcolo giacenze e impaginazione in corso...
        </p>
      </div>
    </div>
  );
}
