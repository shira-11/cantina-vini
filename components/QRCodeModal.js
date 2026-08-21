'use client';

import React, { useState, useEffect } from 'react';
import { X, Printer, Download, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

export default function QRCodeModal({ wine, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (!wine) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const wineUrl = `${origin}/wine/${wine.id}`;

    QRCode.toDataURL(wineUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error generating QR code:', err));
  }, [wine]);

  if (!wine) return null;

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_Vino_${wine.id}_${(wine.name || 'wine').replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrintSingle = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etichetta QR - ${wine.name}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: #f8fafc;
            }
            .label-card {
              width: 70mm;
              height: 45mm;
              border: 2px dashed #94a3b8;
              padding: 4mm;
              box-sizing: border-box;
              display: flex;
              gap: 3mm;
              align-items: center;
              background: white;
              border-radius: 6px;
            }
            .qr-img {
              width: 32mm;
              height: 32mm;
            }
            .details {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            .title {
              font-size: 11pt;
              font-weight: bold;
              color: #0f172a;
              margin-bottom: 2px;
              line-height: 1.2;
            }
            .producer {
              font-size: 8.5pt;
              color: #475569;
              margin-bottom: 2px;
            }
            .meta {
              font-size: 8pt;
              color: #64748b;
              font-weight: 500;
            }
            .tag {
              display: inline-block;
              background: #f1f5f9;
              padding: 1px 4px;
              border-radius: 3px;
              font-size: 7.5pt;
              color: #334155;
              margin-top: 3px;
              font-weight: 600;
            }
            @media print {
              body { background: white; }
              .label-card { border: 1px solid #ccc; }
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <img src="${qrDataUrl}" class="qr-img" />
            <div class="details">
              <div class="title">${wine.name}</div>
              <div class="producer">${wine.producerCellar || wine.producer || ''}</div>
              <div class="meta">Annata: <strong>${wine.vintage || 'S.A.'}</strong></div>
              <div class="tag">ID: #${wine.id}</div>
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        maxWidth: '420px',
        width: '100%',
        padding: '1.75rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        position: 'relative',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748b'
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <QrCode size={24} color="#6366f1" />
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: '700' }}>Codice QR Vino</h3>
        </div>

        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#1e293b', fontWeight: '600' }}>{wine.name}</h4>
        <p style={{ margin: '0 0 1.25rem 0', color: '#64748b', fontSize: '0.875rem' }}>
          {wine.producerCellar || wine.producer || ''} {wine.vintage ? `• ${wine.vintage}` : ''}
        </p>

        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'inline-block',
          marginBottom: '1.5rem'
        }}>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code Vino" style={{ width: '200px', height: '200px', display: 'block' }} />
          ) : (
            <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              Generazione QR in corso...
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={handlePrintSingle}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              background: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '0.65rem 1rem',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            <Printer size={16} /> Stampa Etichetta
          </button>

          <button
            onClick={handleDownload}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              background: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '0.65rem 1rem',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            <Download size={16} /> Scarica PNG
          </button>
        </div>
      </div>
    </div>
  );
}
