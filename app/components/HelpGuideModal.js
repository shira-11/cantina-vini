'use client';

import React from 'react';
import { 
  X, Search, Mic, Camera, Image as ImageIcon, Plus, 
  Printer, Archive, RefreshCw, Settings, Users, LogOut, FileSpreadsheet, List, ArrowDownUp,
  ArrowRightLeft, PlusCircle, MinusCircle, MapPin, History, CheckSquare, QrCode, Shield, Clock, Eye, Lock, Edit2, Trash, Check, Building2, User, HelpCircle, FileText
} from 'lucide-react';

export default function HelpGuideModal({ onClose }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div 
        className="modal-content help-guide-modal-container" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: '850px', 
          width: '92%', 
          maxHeight: '90vh', 
          overflowY: 'auto',
          borderRadius: '16px',
          padding: 0,
          background: '#ffffff',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }}
      >
        {/* CSS Globale per Stampa PDF pulita */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .help-guide-modal-container, .help-guide-modal-container * {
              visibility: visible;
            }
            .help-guide-modal-container {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              max-height: none !important;
              overflow: visible !important;
              box-shadow: none !important;
              border: none !important;
              background: white !important;
              padding: 0 !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* Modal Top Header */}
        <div style={{ 
          position: 'sticky', 
          top: 0, 
          background: 'rgba(255,255,255,0.96)', 
          backdropFilter: 'blur(8px)', 
          zIndex: 10, 
          padding: '1.25rem 1.75rem', 
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: '700' }}>
              <HelpCircle size={26} color="#0284c7" /> Manuale & Guida all'Uso Gestionale Cantina
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
              Panoramica dettagliata di tutti i pulsanti, strumenti e funzioni Amministratore
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="no-print">
            <button 
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#0284c7',
                color: 'white',
                border: 'none',
                padding: '0.5rem 0.95rem',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)'
              }}
              title="Stampa o Salva questa guida in PDF"
            >
              <Printer size={17} /> Esporta Guida PDF
            </button>
            
            <button 
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: 'none',
                width: '2.2rem',
                height: '2.2rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Modal Main Body */}
        <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '2rem', color: '#1e293b' }}>
          
          {/* SEZIONE 1: TASTI E BARRA SUPERIORE (HEADER) */}
          <section>
            <h3 style={{ color: '#0369a1', fontSize: '1.15rem', marginBottom: '1.1rem', borderBottom: '2px solid #bae6fd', paddingBottom: '0.4rem', fontWeight: '700' }}>
              🔘 Tasti della Barra Superiore (Header)
            </h3>
            
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ padding: '0.4rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex' }}>
                  <FileText size={22} color="#475569" />
                </div>
                <div>
                  <strong style={{ color: '#334155' }}>Stampa Scheda Vino (Copertine):</strong>
                  <span style={{ fontSize: '0.9rem', color: '#475569', display: 'block', marginTop: '0.15rem' }}>
                    Genera in una nuova scheda le copertine dettagliate A4 dei vini selezionati o filtrati, complete di scheda tecnica ed immagine della bottiglia.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ padding: '0.4rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex' }}>
                  <List size={22} color="#475569" />
                </div>
                <div>
                  <strong style={{ color: '#334155' }}>Elenco Giacenze Vini per Nazione:</strong>
                  <span style={{ fontSize: '0.9rem', color: '#475569', display: 'block', marginTop: '0.15rem' }}>
                    Stampa la carta dei vini pulita ed elegante raggruppata ordinatamente per Nazione e Categoria.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 1rem', background: '#fff1f2', borderRadius: '10px', border: '1px solid #fecdd3' }}>
                <div style={{ padding: '0.4rem', background: 'white', border: '1px solid #fda4af', borderRadius: '8px', display: 'flex' }}>
                  <FileText size={22} color="#f43f5e" />
                </div>
                <div>
                  <strong style={{ color: '#be123c' }}>Stampa Giacenze Dettagliato (PDF Rosso):</strong>
                  <span style={{ fontSize: '0.9rem', color: '#9f1239', display: 'block', marginTop: '0.15rem' }}>
                    Genera il report PDF completo delle giacenze con menu di ordinamento a comparsa per: Nome Vino, Nazione, Cantina Produttrice o Categoria.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 1rem', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                <div style={{ padding: '0.4rem', background: 'white', border: '1px solid #86efac', borderRadius: '8px', display: 'flex' }}>
                  <FileSpreadsheet size={22} color="#16a34a" />
                </div>
                <div>
                  <strong style={{ color: '#15803d' }}>Esporta Giacenze in Excel (Verde):</strong>
                  <span style={{ fontSize: '0.9rem', color: '#166534', display: 'block', marginTop: '0.15rem' }}>
                    Scarica un file Excel completo con tutte le informazioni dei vini e colonne dinamiche con le giacenze ed i consumi divisi per ogni singola Cantina Fisica.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 1rem', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                <div style={{ padding: '0.4rem', background: 'white', border: '1px solid #93c5fd', borderRadius: '8px', display: 'flex' }}>
                  <History size={22} color="#3b82f6" />
                </div>
                <div>
                  <strong style={{ color: '#1d4ed8' }}>Storico e Cronologia Movimenti (Blu):</strong>
                  <span style={{ fontSize: '0.9rem', color: '#1e40af', display: 'block', marginTop: '0.15rem' }}>
                    Apre il registro temporale globale dove vengono registrati in ordine cronologico tutti gli ingressi, uscite e trasferimenti del locale.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 1rem', background: '#ecfdf5', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                <div style={{ padding: '0.4rem', background: 'white', border: '1px solid #6ee7b7', borderRadius: '8px', display: 'flex' }}>
                  <CheckSquare size={22} color="#10b981" />
                </div>
                <div>
                  <strong style={{ color: '#047857' }}>Inventario Fisico (Conteggio e Rettifica):</strong>
                  <span style={{ fontSize: '0.9rem', color: '#065f46', display: 'block', marginTop: '0.15rem' }}>
                    Modulo avanzato per effettuare la conta periodica delle bottiglie scaffale per scaffale e rettificare la giacenza teorica con quella reale.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 1rem', background: '#f5f3ff', borderRadius: '10px', border: '1px solid #ddd6fe' }}>
                <div style={{ padding: '0.4rem', background: 'white', border: '1px solid #c4b5fd', borderRadius: '8px', display: 'flex' }}>
                  <QrCode size={22} color="#6366f1" />
                </div>
                <div>
                  <strong style={{ color: '#4338ca' }}>Stampa Etichette QR Code:</strong>
                  <span style={{ fontSize: '0.9rem', color: '#3730a3', display: 'block', marginTop: '0.15rem' }}>
                    Genera ed invia alla stampante i fogli di etichette adesive A4 con il QR Code univoco per i vini selezionati con la spunta.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 1rem', background: '#e0e7ff', borderRadius: '10px', border: '1px solid #a5b4fc' }}>
                <div style={{ padding: '0.4rem', background: 'white', border: '1px solid #818cf8', borderRadius: '8px', display: 'flex' }}>
                  <QrCode size={22} color="#4f46e5" />
                </div>
                <div>
                  <strong style={{ color: '#3730a3' }}>Scanner QR Code (Fotocamera Smartphone & Barcode):</strong>
                  <span style={{ fontSize: '0.9rem', color: '#312e81', display: 'block', marginTop: '0.15rem' }}>
                    Inquadra direttamente con la fotocamera del telefono o tablet il QR Code applicato sulla bottiglia per aprirne all'istante la scheda o effettuare un carico/scarico rapido.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 1rem', background: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                <div style={{ padding: '0.4rem 0.8rem', background: '#0284c7', color: 'white', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Plus size={16} /> Nuovo Vino
                </div>
                <div>
                  <strong style={{ color: '#0369a1' }}>+ Nuovo Vino:</strong>
                  <span style={{ fontSize: '0.9rem', color: '#0c4a6e', display: 'block', marginTop: '0.15rem' }}>
                    Apre il modulo per creare un nuovo vino nel database, caricare foto fronte/retro e specificare la giacenza iniziale.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ padding: '0.35rem 0.75rem', background: '#3b82f6', color: 'white', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <User size={14} /> Accedi (Login)
                </div>
                <div>
                  <strong style={{ color: '#1e293b' }}>Accedi (Login) / Esci (LogOut):</strong>
                  <span style={{ fontSize: '0.9rem', color: '#475569', display: 'block', marginTop: '0.15rem' }}>
                    Permette all'utente amministratore (`Adriano`) di autenticarsi per sbloccare le funzioni di modifica, gestione utenti e configurazione.
                  </span>
                </div>
              </div>

            </div>
          </section>

          {/* SEZIONE 2: RICERCA E STRUMENTI */}
          <section>
            <h3 style={{ color: '#0369a1', fontSize: '1.15rem', marginBottom: '1.1rem', borderBottom: '2px solid #bae6fd', paddingBottom: '0.4rem', fontWeight: '700' }}>
              🔍 Strumenti di Ricerca Avanzata
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
              
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: '#0369a1', fontWeight: 'bold' }}>
                  <Search size={18} /> Ricerca Testuale & Autocomplete
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569' }}>
                  Digita qualsiasi parola (Nome vino, Cantina, Produttore, Nazione, Annata o Uvaggio). Durante la digitazione appare un menu dinamico di suggerimenti (stile Google).
                </p>
              </div>

              <div style={{ padding: '1rem', background: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: '#dc2626', fontWeight: 'bold' }}>
                  <Mic size={18} /> Ricerca Vocale (Microfono)
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#991b1b' }}>
                  Clicca sull'icona del microfono e pronuncia a voce il nome della bottiglia o del produttore. L'app corregge la fonetica e filtra automaticamente.
                </p>
              </div>

              <div style={{ padding: '1rem', background: '#f5f3ff', borderRadius: '10px', border: '1px solid #ddd6fe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: '#4338ca', fontWeight: 'bold' }}>
                  <Camera size={18} /> Scansione IA da Fotocamera
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#3730a3' }}>
                  Scatta la foto all'etichetta fisica di una bottiglia. L'Intelligenza Artificiale (OCR) legge il testo e compila la scheda tecnica in pochi secondi.
                </p>
              </div>

              <div style={{ padding: '1rem', background: '#faf5ff', borderRadius: '10px', border: '1px solid #e9d5ff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: '#7e22ce', fontWeight: 'bold' }}>
                  <ImageIcon size={18} /> Riconoscimento da Galleria
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b21a8' }}>
                  Permette di selezionare un'immagine già salvata nella memoria o nel rullino foto del tuo smartphone o computer.
                </p>
              </div>

            </div>
          </section>

          {/* SEZIONE 3: POPUP MATITA NELLA SCHEDA VINO */}
          <section>
            <h3 style={{ color: '#0369a1', fontSize: '1.15rem', marginBottom: '1.1rem', borderBottom: '2px solid #bae6fd', paddingBottom: '0.4rem', fontWeight: '700' }}>
              ✏️ Tasto Matita e Popup di Gestione Elenchi
            </h3>
            
            <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#15803d', fontWeight: 'bold', fontSize: '1rem' }}>
                <span style={{ fontSize: '1.2rem' }}>✏️</span> Pulsanti di Gestione Voci nei Campi
              </div>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#166534', lineHeight: '1.5' }}>
                A destra di ciascun campo (*Nazione, Regione, Cantina Produttrice, Produttore, Classificazione, Categoria, Tipologia, Cantina Fisica, Tipo Bottiglia*), cliccando sul tasto matita si apre un popup dedicato con:
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.875rem', color: '#14532d', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>🔍 <strong>Barra di Ricerca Integrata:</strong> Filtra velocemente l'elenco dei nomi man mano che digiti.</li>
                <li><strong>Tasto "Seleziona":</strong> Assegna immediatamente la voce scelta alla bottiglia corrente.</li>
                <li>✏️ <strong>Rinomina Globale:</strong> Corregge il nome dell'elemento su tutti i vini presenti in archivio.</li>
                <li>🗑️ <strong>Elimina Globale:</strong> Rimuove la voce dal database (richiede PIN se abilitato).</li>
                <li><strong>+ Aggiungi Nuovo:</strong> Inserisce un nuovo elemento nella lista ufficiale dei suggerimenti.</li>
              </ul>
            </div>
          </section>

          {/* SEZIONE 4: GESTIONE GIACENZE E MOVIMENTI */}
          <section>
            <h3 style={{ color: '#0369a1', fontSize: '1.15rem', marginBottom: '1.1rem', borderBottom: '2px solid #bae6fd', paddingBottom: '0.4rem', fontWeight: '700' }}>
              📦 Movimenti di Magazzino (Carico, Scarico e Spostamento)
            </h3>
            
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 1rem', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                <div style={{ padding: '0.4rem', background: 'white', border: '1px solid #86efac', borderRadius: '8px', display: 'flex' }}>
                  <PlusCircle size={22} color="#16a34a" />
                </div>
                <div>
                  <strong style={{ color: '#15803d' }}>Carico (Ingresso Bottiglie):</strong>
                  <span style={{ fontSize: '0.9rem', color: '#166534', display: 'block', marginTop: '0.15rem' }}>
                    Aumenta la giacenza specificando in quale Cantina Fisica collocare le nuove bottiglie (es. Cantina Milano, Deposito).
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 1rem', background: '#fff1f2', borderRadius: '10px', border: '1px solid #fecdd3' }}>
                <div style={{ padding: '0.4rem', background: 'white', border: '1px solid #fda4af', borderRadius: '8px', display: 'flex' }}>
                  <MinusCircle size={22} color="#ef4444" />
                </div>
                <div>
                  <strong style={{ color: '#be123c' }}>Scarico (Uscita per Consumo / Vendita):</strong>
                  <span style={{ fontSize: '0.9rem', color: '#9f1239', display: 'block', marginTop: '0.15rem' }}>
                    Registra l'uscita delle bottiglie consumate in sala, vendute o scartate, sottraendole dalla cantina di origine.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 1rem', background: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                <div style={{ padding: '0.4rem', background: 'white', border: '1px solid #7dd3fc', borderRadius: '8px', display: 'flex' }}>
                  <ArrowRightLeft size={22} color="#0284c7" />
                </div>
                <div>
                  <strong style={{ color: '#0369a1' }}>Spostamento tra Cantine:</strong>
                  <span style={{ fontSize: '0.9rem', color: '#0c4a6e', display: 'block', marginTop: '0.15rem' }}>
                    Trasferisce le bottiglie da una sede fisica all'altra mantenendo inalterato il totale complessivo del vino.
                  </span>
                </div>
              </div>

            </div>
          </section>

          {/* SEZIONE 5: AREA AMMINISTRATORE */}
          <section>
            <h3 style={{ color: '#4338ca', fontSize: '1.15rem', marginBottom: '1.1rem', borderBottom: '2px solid #c7d2fe', paddingBottom: '0.4rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={22} color="#6366f1" /> Area Riservata Amministratore (Admin)
            </h3>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              
              <div style={{ padding: '1rem', background: '#f5f3ff', borderRadius: '12px', border: '1px solid #ddd6fe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <Settings size={20} color="#4f46e5" />
                  <strong style={{ color: '#3730a3', fontSize: '1rem' }}>Pannello Impostazioni Gestionale (/admin/settings)</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e0e7ff', fontSize: '0.875rem' }}>
                    <strong style={{ color: '#4338ca' }}>🏰 Gestione Cantine Fisiche:</strong><br />
                    Crea, rinomina o svuota le sedi di stoccaggio delle bottiglie.
                  </div>
                  <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e0e7ff', fontSize: '0.875rem' }}>
                    <strong style={{ color: '#4338ca' }}>🔑 PIN di Sicurezza (es. 1234):</strong><br />
                    Richiesto obbligatoriamente prima di eliminare cantine o azzerare dati.
                  </div>
                  <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e0e7ff', fontSize: '0.875rem' }}>
                    <strong style={{ color: '#4338ca' }}>👁️ Visibilità Visitatori:</strong><br />
                    Decidi quali pulsanti header e quali filtri mostrare agli utenti non loggati.
                  </div>
                  <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e0e7ff', fontSize: '0.875rem' }}>
                    <strong style={{ color: '#4338ca' }}>🖼️ Estetica e Temporizzazione:</strong><br />
                    Carica lo sfondo personalizzato della pagina login e imposta la durata foto.
                  </div>
                </div>
              </div>

              <div style={{ padding: '1rem', background: '#e0e7ff', borderRadius: '12px', border: '1px solid #c7d2fe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  <Users size={20} color="#4338ca" />
                  <strong style={{ color: '#312e81', fontSize: '1rem' }}>Gestione Utenti e Password (/admin/users)</strong>
                </div>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#3730a3' }}>
                  Aggiungi o rimuovi gli account dei collaboratori ed imposta la password (con pulsante mostra/nascondi occhio 👁️). Assegna i ruoli *Admin* (accesso completo) o *Visitatore* (sola lettura facoltativa).
                </p>
              </div>

              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  <Clock size={20} color="#6366f1" />
                  <strong style={{ color: '#1e293b', fontSize: '1rem' }}>Registro Accessi e Sessioni (/admin/sessions)</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569' }}>
                  Monitora gli orari di login, gli indirizzi IP ed i dispositivi connessi per garantire la sicurezza del sistema.
                </p>
              </div>

            </div>
          </section>

          {/* SEZIONE 6: ARCHIVIO E RIPRISTINO */}
          <section>
            <h3 style={{ color: '#991b1b', fontSize: '1.15rem', marginBottom: '1.1rem', borderBottom: '2px solid #fecaca', paddingBottom: '0.4rem', fontWeight: '700' }}>
              🗑️ Archiviazione e Ripristino Vini
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
              
              <div style={{ padding: '0.85rem', background: '#fff1f2', borderRadius: '10px', border: '1px solid #fecdd3', fontSize: '0.875rem' }}>
                <strong style={{ color: '#be123c', display: 'block', marginBottom: '0.25rem' }}>📦 Archivia Vini Selezionati:</strong>
                Sposta le etichette esaurite nell'archivio storico conservandone lo storico movimenti senza appesantire il catalogo attivo.
              </div>

              <div style={{ padding: '0.85rem', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0', fontSize: '0.875rem' }}>
                <strong style={{ color: '#15803d', display: 'block', marginBottom: '0.25rem' }}>♻️ Ripristina in Cantina:</strong>
                Recupera un vino dall'archivio riportandolo immediatamente nell'elenco di vendita attiva.
              </div>

              <div style={{ padding: '0.85rem', background: '#fef2f2', borderRadius: '10px', border: '1px solid #fca5a5', fontSize: '0.875rem' }}>
                <strong style={{ color: '#b91c1c', display: 'block', marginBottom: '0.25rem' }}>🗑️ Elimina Definitivamente:</strong>
                Cancella per sempre l'etichetta dal database principale (operazione protetta).
              </div>

            </div>
          </section>

        </div>
        
        {/* Modal Footer */}
        <div style={{ 
          borderTop: '1px solid #e2e8f0', 
          padding: '1.25rem 1.75rem', 
          display: 'flex', 
          justify: 'space-between', 
          alignItems: 'center', 
          background: '#f8fafc', 
          position: 'sticky', 
          bottom: 0,
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px'
        }}>
          <button 
            className="no-print"
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'white',
              color: '#0284c7',
              border: '1px solid #0284c7',
              padding: '0.65rem 1.1rem',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <Printer size={18} /> Stampa / Esporta Guida PDF
          </button>

          <button 
            className="no-print"
            onClick={onClose}
            style={{
              background: '#0284c7',
              color: 'white',
              border: 'none',
              padding: '0.65rem 1.5rem',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)'
            }}
          >
            Ho Capito
          </button>
        </div>

      </div>
    </div>
  );
}
