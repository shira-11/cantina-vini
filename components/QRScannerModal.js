'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Camera, AlertCircle, RefreshCw } from 'lucide-react';

export default function QRScannerModal({ onClose, onScanSuccess }) {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    let html5QrcodeScanner = null;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        html5QrcodeScanner = new Html5Qrcode("qr-reader-container");
        scannerRef.current = html5QrcodeScanner;

        const config = { fps: 10, qrbox: { width: 240, height: 240 } };

        await html5QrcodeScanner.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            // Success handler
            if (html5QrcodeScanner) {
              html5QrcodeScanner.stop().catch(() => {});
            }

            // Audio feedback beep if supported
            try {
              const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(800, audioCtx.currentTime);
              osc.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.15);
            } catch (e) {}

            // Parse wine ID from URL or text (e.g. https://.../wine/1234 or ID 1234)
            let wineId = null;
            const match = decodedText.match(/\/wine\/(\d+)/i) || decodedText.match(/(\d+)/);
            if (match) {
              wineId = match[1];
            }

            if (wineId) {
              if (onScanSuccess) {
                onScanSuccess(wineId);
              } else {
                router.push(`/wine/${wineId}`);
              }
              onClose();
            } else {
              setErrorMsg(`Codice QR scansionato (${decodedText}) non riconosciuto come vino.`);
            }
          },
          () => {
            // Code scanning error / waiting for code
          }
        );
        setScanning(true);
      } catch (err) {
        console.error("Camera access error:", err);
        setErrorMsg("Impossibile accedere alla fotocamera. Verifica i permessi del browser o prova su uno smartphone/iPad.");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [router, onClose, onScanSuccess]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        maxWidth: '440px',
        width: '100%',
        padding: '1.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative',
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
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748b',
            zIndex: 10
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
          <div style={{ background: '#e0e7ff', padding: '0.45rem', borderRadius: '10px', display: 'flex' }}>
            <Camera size={22} color="#4f46e5" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: '700' }}>Scansiona QR Code Vino</h3>
            <span style={{ fontSize: '0.825rem', color: '#64748b' }}>Inquadra il codice sulla bottiglia o sull&apos;etichetta</span>
          </div>
        </div>

        {errorMsg ? (
          <div style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            color: '#e11d48',
            padding: '1rem',
            borderRadius: '12px',
            margin: '1.25rem 0',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <AlertCircle size={22} style={{ flexShrink: 0 }} />
            <div>{errorMsg}</div>
          </div>
        ) : (
          <div style={{ margin: '1.25rem 0', position: 'relative' }}>
            <div
              id="qr-reader-container"
              style={{
                width: '100%',
                borderRadius: '14px',
                overflow: 'hidden',
                background: '#0f172a',
                minHeight: '260px'
              }}
            ></div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '0.65rem 1rem',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              color: '#334155',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}
