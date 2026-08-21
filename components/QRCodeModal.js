'use client';

import React, { useState, useEffect } from 'react';
import { X, Printer, Download, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { getCountryFlag } from '../app/utils/wineHelpers';

export default function QRCodeModal({ wine, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (!wine) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const wineUrl = `${origin}/?search=${wine.id}`;

    QRCode.toDataURL(wineUrl, {
      width: 300,
      margin: 1,
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

    const flagStr = getCountryFlag(wine.country);

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
              height: 35mm;
              border: 1px dashed #94a3b8;
              border-radius: 5px;
              padding: 2.5mm 3.5mm;
              box-sizing: border-box;
              display: flex;
              align-items: center;
              gap: 3.5mm;
              background: #ffffff;
            }
            .qr-img {
              width: 25mm;
              height: 25mm;
              flex-shrink: 0;
            }
            .details {
              flex: 1;
              overflow: hidden;
            }
            .title {
              font-size: 9.5pt;
              font-weight: bold;
              color: #0f172a;
              line-height: 1.15;
              margin-bottom: 2px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .producer {
              font-size: 7.5pt;
              color: #475569;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin-bottom: 2px;
            }
            .meta {
              font-size: 7.5pt;
              color: #334155;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 4px;
              margin-bottom: 2px;
            }
            .badge {
              display: inline-block;
              background: #e0e7ff;
              color: #4338ca;
              font-size: 6.5pt;
              font-weight: bold;
              padding: 1px 5px;
              border-radius: 3px;
            }
            @media print {
              body { background: white; margin: 0; padding: 0; }
              .label-card { border: 1px dashed #94a3b8 !important; }
              @page { size: auto; margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <img src="${qrDataUrl}" class="qr-img" />
            <div class="details">
              <div class="title">${wine.name}</div>
              <div class="producer">${wine.producerCellar || wine.producer || ''}</div>
              <div class="meta"><span>${flagStr}</span> <span>Annata: ${wine.vintage || 'S.A.'}</span></div>
              <div class="badge">ID: #${wine.id}</div>
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
        maxWidth: '440px',
        width: '100%',
        padding: '1.5rem',
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <QrCode size={24} color="#6366f1" />
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: '700' }}>Codice QR Vino</h3>
        </div>

        {/* Card Anteprima Etichetta Identica alla Stampa A4 */}
        <div style={{
          border: '1px dashed #94a3b8',
          borderRadius: '6px',
          padding: '2.5mm 3.5mm',
          display: 'flex',
          alignItems: 'center',
          gap: '3.5mm',
          background: '#ffffff',
          boxSizing: 'border-box',
          height: '34mm',
          maxHeight: '35mm',
          overflow: 'hidden',
          maxWidth: '320px',
          margin: '0 auto 1.5rem auto',
          textAlign: 'left'
        }}>
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Code Vino ID #${wine.id}`}
              style={{
                width: '25mm',
                height: '25mm',
                flexShrink: 0
              }}
            />
          ) : (
            <div
              style={{
                width: '25mm',
                height: '25mm',
                background: '#f1f5f9',
                borderRadius: '4px',
                flexShrink: 0
              }}
            />
          )}

          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: '9pt', fontWeight: 'bold', color: '#0f172a', lineHeight: 1.15, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {wine.name}
            </div>
            <div style={{ fontSize: '7.5pt', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
              {wine.producerCellar || wine.producer || ''}
            </div>
            <div style={{ fontSize: '7.5pt', color: '#334155', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
              <span>{getCountryFlag(wine.country)}</span>
              <span>Annata: {wine.vintage || 'S.A.'}</span>
            </div>
            <div style={{ display: 'inline-block', background: '#e0e7ff', color: '#4338ca', fontSize: '6.5pt', fontWeight: 'bold', padding: '1px 5px', borderRadius: '3px' }}>
              ID: #{wine.id}
            </div>
          </div>
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

