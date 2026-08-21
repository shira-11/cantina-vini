'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Camera, AlertCircle, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function QRScannerModal({ onClose, onScanSuccess }) {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState('');
  const [scanning, setScanning] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Store callbacks in refs so they never cause useEffect re-triggers
  const callbacksRef = useRef({ onClose, onScanSuccess });
  useEffect(() => {
    callbacksRef.current = { onClose, onScanSuccess };
  });

  const handleDecodedCode = (decodedText) => {
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

    const { onClose: handleClose, onScanSuccess: handleScanSuccess } = callbacksRef.current;

    if (wineId) {
      if (handleScanSuccess) {
        handleScanSuccess(wineId);
      } else {
        router.push(`/wine/${wineId}`);
      }
      if (handleClose) handleClose();
    } else {
      setErrorMsg(`Codice scansionato (${decodedText}) non riconosciuto come vino.`);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let scannerInstance = null;

    const startScanner = async () => {
      try {
        const { Html5Qrcode, Html5QrcodeScannerState } = await import('html5-qrcode');
        if (!isMounted) return;

        const scanner = new Html5Qrcode("qr-reader-container");
        scannerInstance = scanner;
        scannerRef.current = scanner;

        const config = { fps: 10, qrbox: { width: 240, height: 240 } };

        // Prova ad avviare la fotocamera posteriore (environment)
        const cameras = await Html5Qrcode.getCameras().catch(() => []);
        let cameraConstraint = { facingMode: "environment" };
        if (cameras && cameras.length > 0) {
          const backCam = cameras.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('posteriore'));
          if (backCam) {
            cameraConstraint = backCam.id;
          }
        }

        await scanner.start(
          cameraConstraint,
          config,
          async (decodedText) => {
            if (!isMounted) return;

            try {
              if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
                await scanner.stop();
              }
            } catch (e) {
              console.warn("Scanner stop error:", e);
            }

            handleDecodedCode(decodedText);
          },
          () => {}
        );

        if (!isMounted) {
          try {
            if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
              await scanner.stop();
            }
          } catch (e) {}
        } else {
          setScanning(true);
        }
      } catch (err) {
        if (!isMounted) return;
        console.warn("Camera stream error (HTTP fallback):", err);
        setErrorMsg("Fotocamera in tempo reale non disponibile (o permessi non concessi). Usa il pulsante sottostante per scattare una foto direttamente con la fotocamera del tuo telefono.");
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerInstance) {
        try {
          if (typeof scannerInstance.getState === 'function') {
            const state = scannerInstance.getState();
            if (state === 2 || state === 3) {
              scannerInstance.stop().catch(() => {});
            }
          } else {
            scannerInstance.stop().catch(() => {});
          }
        } catch (e) {}
      }
    };
  }, [router]);

  // Gestione scatto foto / selezione file con la fotocamera nativa dello smartphone
  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setFileLoading(true);
    setErrorMsg('');

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      
      const tempScannerId = "qr-file-temp-container";
      let tempDiv = document.getElementById(tempScannerId);
      if (!tempDiv) {
        tempDiv = document.createElement("div");
        tempDiv.id = tempScannerId;
        tempDiv.style.display = "none";
        document.body.appendChild(tempDiv);
      }

      const html5QrCode = new Html5Qrcode(tempScannerId);
      const decodedText = await html5QrCode.scanFile(file, true);
      
      handleDecodedCode(decodedText);
    } catch (err) {
      console.error("Errore decodifica foto:", err);
      setErrorMsg("Nessun codice QR o a barre rilevato nella foto. Scatta una foto nitida e ben centrata sul codice.");
    } finally {
      setFileLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
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
            width: '36px',
            height: '36px',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <div style={{ background: '#e0e7ff', padding: '0.45rem', borderRadius: '10px', display: 'flex' }}>
            <Camera size={22} color="#4f46e5" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '700' }}>Scansiona QR / Codice a Barre</h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Inquadra il codice o scatta una foto con il telefono</span>
          </div>
        </div>

        {/* Area Scanner / Messaggio di stato */}
        <div style={{ margin: '1rem 0', position: 'relative' }}>
          <div
            id="qr-reader-container"
            style={{
              width: '100%',
              borderRadius: '14px',
              overflow: 'hidden',
              background: '#0f172a',
              minHeight: '240px',
              display: errorMsg ? 'none' : 'block'
            }}
          />

          {errorMsg && (
            <div style={{
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              color: '#9f1239',
              padding: '1rem',
              borderRadius: '12px',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem'
            }}>
              <AlertCircle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMsg}</div>
            </div>
          )}
        </div>

        {/* Input file nascosto per scattare foto nativa o scegliere da galleria */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* Azioni per Smartphone (Scatta Foto con Fotocamera Nativa) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1.25rem' }}>
          <button
            disabled={fileLoading}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '700',
              cursor: fileLoading ? 'wait' : 'pointer',
              fontSize: '0.925rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)'
            }}
          >
            {fileLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Analisi foto in corso...
              </>
            ) : (
              <>
                <Camera size={18} /> Scatta Foto con la Fotocamera
              </>
            )}
          </button>

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

