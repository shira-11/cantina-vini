'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, RotateCw, RotateCcw, ZoomIn, ZoomOut, Check, X, RefreshCw, Crop, Maximize2 } from 'lucide-react';

export default function PhotoCropModal({ isOpen, photoUrl, type, wineName, vintage, onClose, onSave }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640 || window.innerHeight < 780);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const BOX_WIDTH = isMobile ? 250 : 320;
  const BOX_HEIGHT = isMobile ? 330 : 440;

  useEffect(() => {
    if (isOpen && photoUrl) {
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      setSaving(false);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = photoUrl;
    }
  }, [isOpen, photoUrl]);

  if (!isOpen || !photoUrl) return null;

  // Calculate fit scale so 100% of photo is visible initially
  const isRotated90 = rotation % 180 !== 0;
  const effWidth = isRotated90 ? imgDimensions.height : imgDimensions.width;
  const effHeight = isRotated90 ? imgDimensions.width : imgDimensions.height;

  const baseScale = effWidth && effHeight
    ? Math.min(BOX_WIDTH / effWidth, BOX_HEIGHT / effHeight)
    : 1;

  const displayWidth = imgDimensions.width * baseScale;
  const displayHeight = imgDimensions.height * baseScale;

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleFitFull = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleRotateLeft = () => {
    setRotation(prev => (prev - 90 + 360) % 360);
    setPan({ x: 0, y: 0 });
  };

  const handleRotateRight = () => {
    setRotation(prev => (prev + 90) % 360);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomChange = (newZoom) => {
    const clamped = Math.max(1, Math.min(4, newZoom));
    setZoom(clamped);
  };

  // Dragging handlers for Touch & Mouse
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - pan.x, y: clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setPan({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSaveCrop = async () => {
    setSaving(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = photoUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Target canvas dimensions
      const targetWidth = 640;
      const targetHeight = 920;

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      // Fill clean background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      ctx.save();
      ctx.translate(targetWidth / 2, targetHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      const scaleFactor = targetWidth / BOX_WIDTH;
      ctx.translate(pan.x * scaleFactor, pan.y * scaleFactor);

      const drawW = displayWidth * zoom * scaleFactor;
      const drawH = displayHeight * zoom * scaleFactor;

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Errore durante il salvataggio dell\'immagine');
          setSaving(false);
          return;
        }

        const file = new File([blob], `cropped_${Date.now()}.jpg`, { type: 'image/jpeg' });

        if (type === 'ai') {
          onSave(file, 'ai');
          onClose();
          setSaving(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('wineName', wineName || 'Vino');
        formData.append('vintage', vintage || '');
        formData.append('type', type || 'front');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (res.ok) {
          onSave(data.url, type);
          onClose();
        } else {
          alert('Errore caricamento foto: ' + (data.error || 'Generico'));
        }
        setSaving(false);
      }, 'image/jpeg', 0.92);

    } catch (err) {
      console.error(err);
      alert('Impossibile elaborare l\'immagine. Verificare la connessione.');
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      backdropFilter: 'blur(8px)',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '0.25rem' : '0.75rem'
    }}>
      {/* Modal Container */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '96vh',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>

        {/* Top Header */}
        <div style={{
          padding: isMobile ? '0.65rem 1rem' : '0.85rem 1.25rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          background: '#f8fafc',
          flexShrink: 0
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'white',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '0.35rem 0.65rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              cursor: 'pointer',
              fontWeight: 600,
              color: '#334155',
              fontSize: '0.85rem'
            }}
            title="Torna indietro"
          >
            <ArrowLeft size={16} /> Indietro
          </button>
          <div style={{ fontWeight: 700, fontSize: isMobile ? '0.95rem' : '1.05rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Crop size={18} color="#8b5cf6" /> {type === 'ai' ? '🔍 Anteprima Etichetta (IA)' : 'Editor & Taglio Foto'}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.2rem' }}
            title="Chiudi"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable Body (Crop Viewport Box + Controls) */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column' }}>

          {/* Crop Viewport Box */}
          <div style={{
            padding: isMobile ? '0.5rem' : '1rem',
            background: '#090d16',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justify: 'center',
            userSelect: 'none',
            position: 'relative'
          }}>
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
              style={{
                width: `${BOX_WIDTH}px`,
                height: `${BOX_HEIGHT}px`,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '12px',
                border: '2px dashed rgba(168, 85, 247, 0.8)',
                boxShadow: '0 0 0 9999px rgba(9, 13, 22, 0.75)',
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: 'none'
              }}
            >
              {/* Grid overlay lines */}
              <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr', pointerEvents: 'none', zIndex: 10 }}>
                <div style={{ borderRight: '1px dashed rgba(255,255,255,0.2)', borderBottom: '1px dashed rgba(255,255,255,0.2)' }} />
                <div style={{ borderRight: '1px dashed rgba(255,255,255,0.2)', borderBottom: '1px dashed rgba(255,255,255,0.2)' }} />
                <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.2)' }} />
                <div style={{ borderRight: '1px dashed rgba(255,255,255,0.2)', borderBottom: '1px dashed rgba(255,255,255,0.2)' }} />
                <div style={{ borderRight: '1px dashed rgba(255,255,255,0.2)', borderBottom: '1px dashed rgba(255,255,255,0.2)' }} />
                <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.2)' }} />
                <div style={{ borderRight: '1px dashed rgba(255,255,255,0.2)' }} />
                <div style={{ borderRight: '1px dashed rgba(255,255,255,0.2)' }} />
                <div />
              </div>

              {/* The Image being edited */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: `${displayWidth}px`,
                  height: `${displayHeight}px`,
                  transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl}
                  alt="Crop preview"
                  draggable={false}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    pointerEvents: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '0.4rem', color: '#94a3b8', fontSize: '0.75rem', textAlign: 'center' }}>
              🖐️ Trascina | Ingrandisci e ruota con i tasti sotto
            </div>
          </div>

          {/* Controls Panel */}
          <div style={{
            padding: isMobile ? '0.65rem 0.85rem' : '1rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            background: '#ffffff'
          }}>
            {/* Zoom Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => handleZoomChange(zoom - 0.2)}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.35rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Riduci zoom"
              >
                <ZoomOut size={18} color="#475569" />
              </button>
              <input
                type="range"
                min="1"
                max="4"
                step="0.05"
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#8b5cf6', cursor: 'pointer' }}
              />
              <button
                type="button"
                onClick={() => handleZoomChange(zoom + 0.2)}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.35rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Ingrandisci zoom"
              >
                <ZoomIn size={18} color="#475569" />
              </button>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '45px', textAlign: 'right', color: '#64748b' }}>
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Quick Preset Buttons */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleFitFull}
                style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1', borderRadius: '8px', padding: '0.4rem 0.65rem', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
                title="Mostra tutta la foto della bottiglia"
              >
                <Maximize2 size={15} /> Foto Intera
              </button>
              <button
                type="button"
                onClick={handleRotateLeft}
                style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.4rem 0.65rem', fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
                title="Ruota 90° a sinistra"
              >
                <RotateCcw size={15} /> -90°
              </button>
              <button
                type="button"
                onClick={handleRotateRight}
                style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.4rem 0.65rem', fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
                title="Ruota 90° a destra"
              >
                <RotateCw size={15} /> +90°
              </button>
              <button
                type="button"
                onClick={handleReset}
                style={{ background: '#fef2f2', border: '1px solid #fecdd3', color: '#e11d48', borderRadius: '8px', padding: '0.4rem 0.65rem', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
                title="Ripristina formato e posizione iniziale"
              >
                <RefreshCw size={15} /> Reset
              </button>
            </div>

          </div>

        </div>

        {/* Fixed Sticky Bottom Action Bar */}
        <div style={{
          padding: isMobile ? '0.65rem 0.85rem' : '0.85rem 1.25rem',
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
          flexShrink: 0,
          position: 'sticky',
          bottom: 0,
          zIndex: 20
        }}>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                background: 'white',
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                fontSize: '0.95rem'
              }}
            >
              <ArrowLeft size={18} /> Annulla
            </button>
            <button
              type="button"
              onClick={handleSaveCrop}
              disabled={saving}
              style={{
                flex: 1.4,
                padding: '0.75rem',
                border: 'none',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                color: 'white',
                fontWeight: 700,
                cursor: saving ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                fontSize: '1rem',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.35)',
                opacity: saving ? 0.8 : 1
              }}
            >
              {saving ? 'Salvataggio...' : (type === 'ai' ? <><Check size={18} /> ✨ Analizza con IA</> : <><Check size={18} /> Applica & Salva</>)}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
