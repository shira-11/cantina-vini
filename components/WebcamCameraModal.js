'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, Camera, RotateCw, AlertCircle } from 'lucide-react';

export default function WebcamCameraModal({ onClose, onCapture }) {
  const [stream, setStream] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [facingMode, setFacingMode] = useState('environment');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let currentStream = null;

    async function startCamera() {
      setErrorMsg('');
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setErrorMsg('Fotocamera non supportata dal tuo browser.');
          return;
        }

        try {
          currentStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } }
          });
        } catch (firstErr) {
          currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        setStream(currentStream);
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setErrorMsg('Impossibile accedere alla fotocamera. Assicurati di aver concesso i permessi nel browser.');
      }
    }

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        alert('Errore nello scatto della foto.');
        return;
      }

      const file = new File([blob], `label_scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      onCapture(file);
      onClose();
    }, 'image/jpeg', 0.92);
  };

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: '#0f172a',
        color: '#f8fafc',
        borderRadius: '16px',
        width: '95vw',
        maxWidth: '900px',
        maxHeight: '92vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #1e293b',
          background: '#0f172a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Camera size={24} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#f8fafc' }}>
              Fotocamera Dispositivo (Mac / Webcam)
            </h3>
          </div>
          <button
            onClick={() => {
              if (stream) stream.getTracks().forEach(track => track.stop());
              onClose();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '50%'
            }}
          >
            <X size={26} />
          </button>
        </div>

        {/* Video Viewfinder Area */}
        <div style={{ position: 'relative', width: '100%', backgroundColor: '#000', flex: 1, minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {errorMsg ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#f87171' }}>
              <AlertCircle size={44} style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontSize: '1.1rem' }}>{errorMsg}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', maxHeight: '72vh', objectFit: 'contain' }}
              />
              {/* Vertical / Portrait Bottle Guide Overlay */}
              <div style={{
                position: 'absolute',
                border: '3px dashed #38bdf8',
                borderRadius: '20px',
                width: '52%',
                maxWidth: '460px',
                height: '88%',
                pointerEvents: 'none',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: '14px'
              }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.85)', color: '#38bdf8', padding: '0.4rem 1.1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold', backdropFilter: 'blur(4px)', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
                  🍾 Inquadra la Bottiglia / Etichetta in Verticale
                </div>
              </div>
            </>
          )}
        </div>

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Footer Actions */}
        <div style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          borderTop: '1px solid #1e293b',
          background: '#0f172a'
        }}>
          <button
            type="button"
            onClick={toggleCamera}
            style={{
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              padding: '0.75rem 1.2rem',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.95rem',
              fontWeight: '600'
            }}
            title="Cambia fotocamera"
          >
            <RotateCw size={18} /> Cambia Camera
          </button>

          <button
            type="button"
            onClick={handleTakeSnapshot}
            disabled={!!errorMsg}
            style={{
              flex: 1,
              maxWidth: '300px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              padding: '0.85rem 1.5rem',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              cursor: !!errorMsg ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.45)'
            }}
          >
            <Camera size={22} /> 📸 Scatta e Analizza
          </button>

          <button
            type="button"
            onClick={() => {
              if (stream) stream.getTracks().forEach(track => track.stop());
              onClose();
            }}
            style={{
              background: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #334155',
              padding: '0.75rem 1.2rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600'
            }}
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}
