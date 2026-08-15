'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, RotateCw, RotateCcw, ZoomIn, ZoomOut, Check, X, RefreshCw, Crop } from 'lucide-react';

export default function PhotoCropModal({ isOpen, photoUrl, type, wineName, vintage, onClose, onSave }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      setSaving(false);
    }
  }, [isOpen, photoUrl]);

  if (!isOpen || !photoUrl) return null;

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleRotateLeft = () => {
    setRotation(prev => (prev - 90 + 360) % 360);
  };

  const handleRotateRight = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleZoomChange = (newZoom) => {
    const clamped = Math.max(0.5, Math.min(3.5, newZoom));
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

      // Target canvas dimensions (standard high res bottle ratio)
      const targetWidth = 600;
      const targetHeight = 800;

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Save context
      ctx.save();

      // Move to center of canvas
      ctx.translate(targetWidth / 2, targetHeight / 2);

      // Apply rotation
      ctx.rotate((rotation * Math.PI) / 180);

      // Apply zoom & pan (scaled from preview container ratio)
      // Preview viewport size is ~300x400
      const scaleFactor = targetWidth / 300;
      ctx.translate(pan.x * scaleFactor, pan.y * scaleFactor);
      ctx.scale(zoom, zoom);

      // Draw image centered
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      ctx.restore();

      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Errore durante il ritaglio dell\'immagine');
          setSaving(false);
          return;
        }

        const file = new File([blob], `cropped_${Date.now()}.jpg`, { type: 'image/jpeg' });
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
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(6px)',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      {/* Modal Container */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>

        {/* Top Header */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'white',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '0.4rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              fontWeight: 500,
              color: '#334155'
            }}
            title="Torna indietro"
          >
            <ArrowLeft size={18} /> Indietro
          </button>
          <div style={{ fontWeight: 600, fontSize: '1.05rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Crop size={20} color="#8b5cf6" /> Ritaglia & Zoom Foto
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.2rem' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Crop Viewport Box */}
        <div style={{
          padding: '1.5rem 1rem',
          background: '#090d16',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          userSelect: 'none'
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
              width: '300px',
              height: '400px',
              border: '2px dashed #8b5cf6',
              borderRadius: '12px',
              position: 'relative',
              overflow: 'hidden',
              cursor: isDragging ? 'grabbing' : 'grab',
              backgroundColor: '#1e293b',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Grid Helper Lines */}
            <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, borderTop: '1px solid rgba(255,255,255,0.2)', pointerEvents: 'none', zIndex: 2 }} />
            <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, borderTop: '1px solid rgba(255,255,255,0.2)', pointerEvents: 'none', zIndex: 2 }} />
            <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, borderLeft: '1px solid rgba(255,255,255,0.2)', pointerEvents: 'none', zIndex: 2 }} />
            <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, borderLeft: '1px solid rgba(255,255,255,0.2)', pointerEvents: 'none', zIndex: 2 }} />

            {/* Transformable Image */}
            <img
              src={photoUrl}
              alt="Anteprima ritaglio"
              draggable={false}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                maxWidth: 'none',
                maxHeight: 'none',
                transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                pointerEvents: 'none'
              }}
            />
          </div>
        </div>

        {/* Toolbar & Controls */}
        <div style={{ padding: '1.25rem', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Zoom Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => handleZoomChange(zoom - 0.2)}
              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.3rem', cursor: 'pointer' }}
              title="Riduci zoom"
            >
              <ZoomOut size={18} color="#475569" />
            </button>

            <input
              type="range"
              min="0.5"
              max="3.5"
              step="0.05"
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: '#8b5cf6', cursor: 'pointer' }}
            />

            <button
              type="button"
              onClick={() => handleZoomChange(zoom + 0.2)}
              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.3rem', cursor: 'pointer' }}
              title="Ingrandisci zoom"
            >
              <ZoomIn size={18} color="#475569" />
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: '45px', textAlign: 'right', color: '#64748b' }}>
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Buttons Row: Rotate + Reset */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleRotateLeft}
              style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
              title="Ruota 90° a sinistra"
            >
              <RotateCcw size={16} /> -90°
            </button>
            <button
              type="button"
              onClick={handleRotateRight}
              style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
              title="Ruota 90° a destra"
            >
              <RotateCw size={16} /> +90°
            </button>
            <button
              type="button"
              onClick={handleReset}
              style={{ background: '#fef2f2', border: '1px solid #fecdd3', color: '#e11d48', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
              title="Ripristina formato e posizione originale"
            >
              <RefreshCw size={16} /> Reset Immagine
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
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
                gap: '0.4rem'
              }}
            >
              <ArrowLeft size={18} /> Annulla
            </button>
            <button
              type="button"
              onClick={handleSaveCrop}
              disabled={saving}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: 'none',
                borderRadius: '10px',
                background: '#8b5cf6',
                color: 'white',
                fontWeight: 600,
                cursor: saving ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)',
                opacity: saving ? 0.8 : 1
              }}
            >
              {saving ? 'Salvataggio...' : <><Check size={18} /> Applica & Salva</>}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
