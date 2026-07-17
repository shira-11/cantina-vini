'use client';

import React from 'react';
import { 
  X, Search, Mic, Camera, Image as ImageIcon, Plus, 
  Printer, Archive, RefreshCw, Settings, Users, LogOut, FileSpreadsheet, List, ArrowDownUp,
  ArrowRightLeft, PlusCircle, MinusCircle, MapPin
} from 'lucide-react';

export default function HelpGuideModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header" style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10, padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h2>Guida all'Uso dell'Applicazione</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>
        
        <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Sezione 1: Ricerca */}
          <section>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              🔍 Ricerca Vini
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.5rem', background: '#f1f5f9', borderRadius: '8px' }}><Search size={20} color="#475569" /></div>
                <div>
                  <strong>Ricerca Testuale:</strong> Digita il nome del vino, della cantina o del produttore per filtrare immediatamente i risultati.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.5rem', background: '#f1f5f9', borderRadius: '8px' }}><Mic size={20} color="#ef4444" /></div>
                <div>
                  <strong>Ricerca Vocale:</strong> Clicca sul microfono e pronuncia il nome del vino. (La funzione lampeggia di rosso mentre ascolta).
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.5rem', background: '#f1f5f9', borderRadius: '8px' }}><Camera size={20} color="var(--primary-color)" /></div>
                <div>
                  <strong>Ricerca da Fotocamera:</strong> Scatta una foto all'etichetta di un vino fisico: l'app la leggerà e troverà il vino corrispondente in automatico.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.5rem', background: '#f1f5f9', borderRadius: '8px' }}><ImageIcon size={20} color="var(--primary-color)" /></div>
                <div>
                  <strong>Ricerca da Galleria:</strong> Simile alla fotocamera, ma scegli una foto dell'etichetta già salvata nel rullino del dispositivo.
                </div>
              </div>
            </div>
          </section>

          {/* Sezione 2: Strumenti Principali */}
          <section>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              🛠️ Strumenti Principali (Barra in Alto)
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.5rem', background: 'var(--primary-color)', borderRadius: '8px', color: 'white' }}><Plus size={20} /></div>
                <div>
                  <strong>Nuovo Vino:</strong> Apre la schermata per inserire un nuovo vino nel database, compilando i suoi dettagli e i movimenti di carico.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.5rem', background: '#f1f5f9', borderRadius: '8px' }}><Printer size={20} color="#475569" /></div>
                <div>
                  <strong>Menu Stampe:</strong>
                  <ul style={{ margin: '0.5rem 0 0 1.2rem', color: '#475569', fontSize: '0.9rem' }}>
                    <li><strong>Scheda Vini:</strong> Genera un PDF dettagliato dei vini selezionati (con foto).</li>
                    <li><strong>Elenco Nazioni:</strong> Genera una carta dei vini raggruppata per categoria e nazione.</li>
                    <li><FileSpreadsheet size={14} style={{ display: 'inline', marginRight: '4px' }} /><strong>Export Excel:</strong> Crea un file Excel con tutti i dettagli dei vini selezionati.</li>
                  </ul>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.5rem', background: '#fee2e2', borderRadius: '8px' }}><Archive size={20} color="#ef4444" /></div>
                <div>
                  <strong>Archivia Selezionati:</strong> Sposta i vini selezionati (tramite la spunta a sinistra nella riga) nell'archivio storico, togliendoli dalla visualizzazione principale.
                </div>
              </div>
            </div>
          </section>

          {/* Sezione 3: Navigazione e Menu Laterale */}
          <section>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              📋 Menu Laterale & Filtri
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.5rem', background: '#f1f5f9', borderRadius: '8px' }}><List size={20} color="#475569" /></div>
                <div>
                  <strong>Filtri a Tendina:</strong> Usa il menu laterale per restringere l'elenco. Puoi filtrare per Nazione, Categoria (Bianco, Rosso...), Classificazione, Cantina Fisica o Tipo di Bottiglia.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.5rem', background: '#f1f5f9', borderRadius: '8px' }}><RefreshCw size={20} color="#475569" /></div>
                <div>
                  <strong>Azzera Filtri:</strong> Un pulsante a fondo menu per pulire velocemente tutte le selezioni e mostrare di nuovo tutto il database.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.5rem', background: '#f1f5f9', borderRadius: '8px' }}><ArrowDownUp size={20} color="#475569" /></div>
                <div>
                  <strong>Ordinamento Tabella:</strong> Cliccando sull'intestazione di una colonna (es. "Nome", "Giacenza") la lista verrà riordinata in ordine alfabetico o numerico (decrescente/crescente).
                </div>
              </div>
            </div>
          </section>

          {/* Sezione 4: Gestione (Solo Admin) */}
          <section>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              ⚙️ Gestione (Menu Inferiore)
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.5rem', background: '#f1f5f9', borderRadius: '8px' }}><Settings size={20} color="#475569" /></div>
                <div>
                  <strong>Impostazioni (Admin):</strong> Permette di gestire il database, sfondi, e visualizzare le informazioni di sistema.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.5rem', background: '#f1f5f9', borderRadius: '8px' }}><Users size={20} color="#475569" /></div>
                <div>
                  <strong>Gestione Utenti (Admin):</strong> Aggiungi o rimuovi collaboratori e imposta i loro ruoli (Admin o Visitatore).
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.5rem', background: '#f87171', borderRadius: '8px', color: 'white' }}><LogOut size={20} /></div>
                <div>
                  <strong>Esci (LogOut):</strong> Chiude in sicurezza la sessione di lavoro.
                </div>
              </div>
            </div>
          </section>

          {/* Sezione 5: Gestione Giacenze e Movimenti */}
          <section>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              📦 Gestione Giacenze e Movimenti
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.5rem', background: '#dcfce7', borderRadius: '8px' }}><PlusCircle size={20} color="#16a34a" /></div>
                <div>
                  <strong>Carico (Entrata):</strong> Aggiungi nuove bottiglie alla giacenza. Quando registri un carico, devi specificare in quale "Cantina Fisica" vengono posizionate le bottiglie.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.5rem', background: '#fee2e2', borderRadius: '8px' }}><MinusCircle size={20} color="#ef4444" /></div>
                <div>
                  <strong>Scarico (Uscita):</strong> Registra le bottiglie consumate o vendute. Specifica da quale cantina le stai prelevando.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.5rem', background: '#e0f2fe', borderRadius: '8px' }}><ArrowRightLeft size={20} color="#0ea5e9" /></div>
                <div>
                  <strong>Spostamento:</strong> Trasferisci bottiglie da una "Cantina Fisica" a un'altra senza alterare la giacenza totale. Questa funzione crea un movimento di uscita dalla cantina di origine e uno di entrata in quella di destinazione.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.5rem', background: '#f1f5f9', borderRadius: '8px' }}><MapPin size={20} color="#475569" /></div>
                <div>
                  <strong>Posizioni (Cantina Fisica):</strong> Il sistema traccia esattamente dove si trova ogni bottiglia (es. Cantina Arezzo, Cantina Milano). Cliccando sulla giacenza di un vino puoi vedere il dettaglio di quante bottiglie ci sono per ogni singola posizione.
                </div>
              </div>
            </div>
          </section>

        </div>
        
        <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc', position: 'sticky', bottom: 0 }}>
          <button className="btn btn-primary" onClick={onClose}>Ho Capito</button>
        </div>
      </div>
    </div>
  );
}
