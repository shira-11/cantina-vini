'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash, Image as ImageIcon, Edit2, List, FileText, ArrowRightLeft, Camera, Wine, Printer, RotateCw } from 'lucide-react';
import { use } from 'react';

const getCountryFlag = (country) => {
  if (!country) return '';
  const c = country.toLowerCase().trim();
  if (c.includes('italia')) return '🇮🇹';
  if (c.includes('francia')) return '🇫🇷';
  if (c.includes('spagna')) return '🇪🇸';
  if (c.includes('germania')) return '🇩🇪';
  if (c.includes('stati uniti') || c.includes('usa')) return '🇺🇸';
  if (c.includes('sud africa')) return '🇿🇦';
  if (c.includes('nuova zelanda')) return '🇳🇿';
  if (c.includes('australia')) return '🇦🇺';
  if (c.includes('argentina')) return '🇦🇷';
  if (c.includes('cile')) return '🇨🇱';
  if (c.includes('portogallo')) return '🇵🇹';
  if (c.includes('austria')) return '🇦🇹';
  if (c.includes('svizzera')) return '🇨🇭';
  if (c.includes('grecia')) return '🇬🇷';
  if (c.includes('libano')) return '🇱🇧';
  if (c.includes('georgia')) return '🇬🇪';
  if (c.includes('slovenia')) return '🇸🇮';
  if (c.includes('croazia')) return '🇭🇷';
  if (c.includes('ungheria')) return '🇭🇺';
  if (c.includes('inghilterra') || c.includes('regno unito')) return '🇬🇧';
  if (c.includes('romania')) return '🇷🇴';
  return '🌍';
};

export default function WineDetail({ params }) {
  const unwrappedParams = use(params);
  const router = useRouter();

  const isDefaultBottle = (bt) => !bt || bt === "0,75 L" || bt === "0.75 L" || bt === "Normale 0.75" || bt === "0,75L";
  const [wine, setWine] = useState(null);
  const [originalWine, setOriginalWine] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocationFilter, setSelectedLocationFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState(null);
  const [fullscreenImages, setFullscreenImages] = useState([]);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [showMovementsModal, setShowMovementsModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [promptDialog, setPromptDialog] = useState(null);
  const customAlert = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 4000); };
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setFullscreenIndex((prev) => (prev < fullscreenImages.length - 1 ? prev + 1 : 0));
    } else if (isRightSwipe) {
      setFullscreenIndex((prev) => (prev > 0 ? prev - 1 : fullscreenImages.length - 1));
    }
  };
  const [activeTab, setActiveTab] = useState('tutte-le-annate'); // 'tutte-le-annate', 'riepilogo', 'movimenti'
  const [vintageSortConfig, setVintageSortConfig] = useState({ key: 'vintage', direction: 'desc' });
  const [newMovement, setNewMovement] = useState({
    date: new Date().toISOString().split('T')[0],
    movementType: '',
    locationId: '',
    quantity: '',
    bottleType: '',
    reason: '',
    vendor: '',
    price: '',
    tempPrice: '',
    notes: ''
  });
  const [editingMovementId, setEditingMovementId] = useState(null);
  const [metadata, setMetadata] = useState({
    vintages: [], countries: [], regions: [], producers: [],
    classifications: [], categories: [], types: []
  });

  const [listModal, setListModal] = useState({ isOpen: false, field: '', label: '', options: [] });
  const [showArchive, setShowArchive] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setCurrentUser(data.user);
          if (data.user.role === 'viewer') {
            if (unwrappedParams.id === 'new') {
              router.push('/');
              return;
            }
            // Check if viewer is allowed to see wine details
            fetch('/api/settings')
              .then(res => res.json())
              .then(settings => {
                if (settings.visitorAllowWineDetails === false) {
                  router.push('/');
                }
              })
              .catch(err => console.error("Errore fetch settings:", err));
          }
        }
      })
      .catch(err => console.error("Errore fetch user:", err));
  }, [unwrappedParams.id, router]);
  const [showFullForm, setShowFullForm] = useState(unwrappedParams.id === 'new');
  const [showAllMovements, setShowAllMovements] = useState(false);
  const [showExtraColumns, setShowExtraColumns] = useState(false);
  const [locationMigration, setLocationMigration] = useState({ isOpen: false, locationToDeleteName: '', locationToDeleteId: null, migrateToId: '' });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const openListModal = (field, label, options) => {
    setListModal({ isOpen: true, field, label, options });
  };


  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const isDirty = originalWine && JSON.stringify(wine) !== JSON.stringify(originalWine);
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [wine, unwrappedParams.id]);

  const fetchWineRef = useRef();
  const fetchMetadataRef = useRef();

  // SSE connection for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = (e) => {
      if (e.data === 'update') {
        if (unwrappedParams.id !== 'new') {
          if (fetchWineRef.current) fetchWineRef.current();
        }
        if (fetchMetadataRef.current) fetchMetadataRef.current();
      }
    };

    return () => {
      eventSource.close();
    };
  }, [unwrappedParams.id]);

  useEffect(() => {
    fetchMetadata();

    // Reset states when navigating between wines
    setNewMovement({
      date: new Date().toISOString().split('T')[0],
      movementType: '',
      locationId: '',
      quantity: '',
      bottleType: '',
      reason: '',
      vendor: '',
      price: '',
      tempPrice: ''
    });
    setEditingMovementId(null);
    setShowMovementsModal(false);

    if (unwrappedParams.id === 'new') {
      const defaultWine = {
        name: '', vintage: '', country: '', region: '', producerCellar: '',
        classification: '', category: '', type: '', alcoholContent: '',
        tempMin: '14', tempMax: '16', notes: '', photo: null, photoBack: null
      };
      setWine(defaultWine);
      setOriginalWine(defaultWine);
      setActiveTab('riepilogo'); // Default to riepilogo
      setLoading(false);
    } else {
      fetchWine();
      // ALWAYS default to tutte-le-annate (it's the initial state of activeTab)
    }
  }, [unwrappedParams.id]);

  const fetchWine = async () => {
    try {
      const res = await fetch(`/api/wines/${unwrappedParams.id}?t=${Date.now()}`);
      const data = await res.json();
      if (res.ok) {
        if (data.movements && data.movements.length > 0) {
          const sortedMovs = [...data.movements].sort((a, b) => new Date(a.date) - new Date(b.date));
          if (sortedMovs[0].location) {
            data._initialLocationName = sortedMovs[0].location.name;
          }
          data._initialPrice = sortedMovs[0].price || '';
          data._initialTempPrice = sortedMovs[0].tempPrice || '';
        }
        data._initialBottleType = data.bottleType || (data.movements && data.movements.length > 0 ? [...data.movements].sort((a, b) => new Date(a.date) - new Date(b.date))[0].bottleType : '') || '';
        
        setWine(data);
        setOriginalWine(data);

        const prefillStr = sessionStorage.getItem('prefillMovement');
        if (prefillStr) {
          try {
            const prefill = JSON.parse(prefillStr);
            setNewMovement(prev => ({
              ...prev,
              bottleType: prefill.bottleType || '',
              reason: prefill.reason || '',
              vendor: prefill.vendor || '',
              price: prefill.price ? prefill.price.toString() : '',
              tempPrice: prefill.tempPrice ? prefill.tempPrice.toString() : ''
            }));
          } catch (e) { }
          sessionStorage.removeItem('prefillMovement');
        } else {
          setNewMovement(prev => {
            const updates = {};
            if (data.bottleType && !prev.bottleType) {
              updates.bottleType = data.bottleType;
            }
            if (data.movements && data.movements.length > 0) {
              const sortedMovs = [...data.movements].sort((a, b) => new Date(a.date) - new Date(b.date));
              const movWithBottle = sortedMovs.find(m => m.bottleType);
              const lastMov = sortedMovs[sortedMovs.length - 1];
              if (!prev.locationId && lastMov.locationId) updates.locationId = lastMov.locationId.toString();
              if (!updates.bottleType && !prev.bottleType && movWithBottle && movWithBottle.bottleType) {
                updates.bottleType = movWithBottle.bottleType;
              }
            }
            return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
          });
        }
      } else {
        setWine(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const res = await fetch('/api/wines/metadata');
      if (res.ok) {
        const data = await res.json();
        setMetadata(data);
      }
      const locRes = await fetch('/api/locations');
      if (locRes.ok) {
        const data = await locRes.json();
        setLocations(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWineRef.current = fetchWine;
    fetchMetadataRef.current = fetchMetadata;
  });

  const handleAddLocation = async () => {
    const name = window.prompt('Inserisci il nome della nuova cantina (es. Cantina Milano):');
    if (!name) return;
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const newLoc = await res.json();
        setLocations(prev => [...prev, newLoc].sort((a, b) => a.name.localeCompare(b.name)));
        setNewMovement(prev => ({ ...prev, locationId: newLoc.id.toString(), reason: 'Carico Iniziale' }));
      } else {
        customAlert('Errore o cantina già esistente');
      }
    } catch (e) {
      console.error(e);
      customAlert('Errore di rete');
    }
  };

  const handleEditLocation = async () => {
    if (!newMovement.locationId) return;
    const loc = locations.find(l => l.id.toString() === newMovement.locationId.toString());
    if (!loc) return;

    const newName = window.prompt('Modifica il nome della cantina:', loc.name);
    if (!newName || newName === loc.name) return;

    try {
      const res = await fetch(`/api/locations/${loc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      if (res.ok) {
        const updatedLoc = await res.json();
        setLocations(prev => prev.map(l => l.id === updatedLoc.id ? updatedLoc : l).sort((a, b) => a.name.localeCompare(b.name)));
        fetchWine(); // update the movements list to reflect the new name
      } else {
        customAlert('Errore durante la modifica della cantina');
      }
    } catch (e) {
      console.error(e);
      customAlert('Errore di rete');
    }
  };

  const handleRotateImage = (imageUrl, type) => {
    if (!imageUrl) return;
    setUploading(true);
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(90 * Math.PI / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setUploading(false);
          customAlert('Errore nella rotazione immagine');
          return;
        }
        const file = new File([blob], `rotated_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('file', file);
        formData.append('wineName', wine.name || 'Sconosciuto');
        formData.append('vintage', wine.vintage || '');
        formData.append('type', type);

        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          if (res.ok) {
            if (type === 'front') {
              setWine(prev => ({ ...prev, photo: data.url }));
            } else {
              setWine(prev => ({ ...prev, photoBack: data.url }));
            }
          } else {
            customAlert('Errore caricamento: ' + data.error);
          }
        } catch (error) {
          console.error(error);
          customAlert('Errore rete');
        } finally {
          setUploading(false);
        }
      }, 'image/jpeg', 0.9);
    };
    img.onerror = () => {
      setUploading(false);
      customAlert('Impossibile caricare l\'immagine per la rotazione. Potrebbe essere un problema di permessi (CORS).');
    };
    img.src = imageUrl;
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.92);
        };
      };
    });
  };

  const handleUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    
    // Comprime l'immagine prima di inviarla (risolve il limite del server)
    const compressedFile = await compressImage(file);
    
    const formData = new FormData();
    formData.append('file', compressedFile);
    formData.append('wineName', wine.name || 'Sconosciuto');
    formData.append('vintage', wine.vintage || '');
    formData.append('type', type);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        if (type === 'front') {
          setWine(prev => ({ ...prev, photo: data.url }));
        } else {
          setWine(prev => ({ ...prev, photoBack: data.url }));
        }
      } else {
        customAlert('Errore caricamento: ' + data.error);
      }
    } catch (error) {
      console.error(error);
      customAlert('Errore caricamento foto');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMovement = async (movementId) => {
    if (window.confirm("Sei sicuro di voler eliminare questo movimento? La giacenza verrà aggiornata di conseguenza.")) {
      try {
        if (String(movementId).startsWith('temp-')) {
          setWine(prev => ({
            ...prev,
            movements: prev.movements.filter(m => m.id !== movementId)
          }));
        } else {
          const res = await fetch(`/api/movements/${movementId}`, { method: 'DELETE' });
          if (res.ok) {
            customAlert('\n❌ Movimento eliminato con successo!\n');
            fetchWine(); // Refresh per aggiornare giacenze e lista
          } else {
            const data = await res.json().catch(() => ({}));
            customAlert("Errore durante l'eliminazione: " + (data.error || "Sconosciuto"));
          }
        }
      } catch (err) {
        console.error(err);
        customAlert("Errore di rete durante l'eliminazione: " + err.message);
      }
    }
  };

  const handleDeleteVintage = async (vintageId, isCurrent) => {
    if (window.confirm("Sei sicuro di voler eliminare definitivamente questa annata e tutti i suoi movimenti? L'azione non è annullabile.")) {
      try {
        const res = await fetch(`/api/wines/${vintageId}`, { method: 'DELETE' });
        if (res.ok) {
          if (isCurrent) {
            customAlert('\n❌ Annata eliminata con successo!\n');
            router.push('/');
          } else {
            customAlert('\n❌ Annata eliminata con successo!\n');
            fetchWine(); // Refresh per aggiornare la tabella
          }
        } else {
          customAlert("Errore durante l'eliminazione dell'annata");
        }
      } catch (err) {
        console.error(err);
        customAlert("Errore di rete durante l'eliminazione");
      }
    }
  };

  const handleEditMovement = (m) => {
    setEditingMovementId(m.id);
    setNewMovement({
      date: new Date(m.date).toISOString().split('T')[0],
      movementType: m.movementType,
      locationId: m.locationId ? m.locationId.toString() : (m.location?.id ? m.location.id.toString() : ''),
      quantity: m.quantity.toString(),
      bottleType: m.bottleType || 'Normale 0.75',
      reason: m.reason || '',
      vendor: m.vendor || '',
      price: m.price ? m.price.toString() : '',
      tempPrice: m.tempPrice ? m.tempPrice.toString() : '',
      notes: m.notes || ''
    });
    const panel = document.querySelector('.panel');
    if (panel) panel.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (wineToSave, showSuccessAlert = true, customSuccessMessage = null) => {
    const dataToSave = wineToSave || wine;
    const isNew = unwrappedParams.id === 'new';
    const successMessage = customSuccessMessage ? customSuccessMessage : (isNew ? '\n🍷 Nuovo vino salvato con successo!\n' : '\n✅ Scheda aggiornata con successo!\n');

    if (!dataToSave.name || dataToSave.name.trim() === '') {
      customAlert('Impossibile salvare: devi prima inserire il Nome del vino!');
      return;
    }

    setIsSaving(true);
    setSavingProgress(0);
    const progressInterval = setInterval(() => {
      setSavingProgress(prev => {
        const next = prev + Math.floor(Math.random() * 15) + 5;
        return next > 95 ? 95 : next;
      });
    }, 100);

    try {
      let locationId = null;
      if (dataToSave._initialLocationName) {
        const loc = locations.find(l => l.name === dataToSave._initialLocationName);
        if (loc) {
          locationId = loc.id;
        } else {
          const locRes = await fetch('/api/locations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: dataToSave._initialLocationName }) });
          if (locRes.ok) {
            const newLoc = await locRes.json();
            locationId = newLoc.id;
            setLocations(prev => [...prev, newLoc]);
          } else {
            customAlert('Errore creazione cantina fisica. Verrà ignorata la giacenza iniziale.');
          }
        }
      }

      if (isNew) {
        const payload = { ...dataToSave };
        if (locationId) {
          payload.movements = [{
            isNew: true,
            date: new Date().toISOString(),
            movementType: 'Ingresso',
            quantity: payload._initialQuantity ? parseInt(payload._initialQuantity) : 0,
            locationId: locationId,
            bottleType: payload._initialBottleType || '',
            price: payload._initialPrice ? parseFloat(payload._initialPrice) : null,
            tempPrice: payload._initialTempPrice ? parseFloat(payload._initialTempPrice) : null,
            reason: 'Carico Iniziale'
          }];
        }
        const res = await fetch(`/api/wines`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const newWine = await res.json();
        if (res.ok) {
          if (showSuccessAlert) customAlert(successMessage);
          fetchMetadata();
          sessionStorage.setItem('homeNeedsRefresh', 'true');
          router.push(`/`);
        } else {
          customAlert('Errore durante la creazione: ' + (newWine.error || ''));
        }
      } else {
        const payload = { ...dataToSave };
        // If they edit the location field later, we do NOT want to keep adding Carico Iniziale 0-qty movements
        // so we don't handle location creation here on edit. The location is purely visual or edited via "Movimenti" tab.
        const res = await fetch(`/api/wines/${dataToSave.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          if (showSuccessAlert) customAlert(successMessage);
          fetchWine(); // Refresh to get real DB ids for new movements
          fetchMetadata();
        } else {
          const errData = await res.json();
          customAlert('Errore durante il salvataggio: ' + (errData.error || ''));
        }
      }
    } catch (err) {
      console.error(err);
      customAlert('Errore di rete durante il salvataggio');
    } finally {
      clearInterval(progressInterval);
      setSavingProgress(100);
      setTimeout(() => {
        setIsSaving(false);
        setSavingProgress(null);
      }, 500);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Caricamento scheda...</div>;
  if (!wine) return <div style={{ padding: '2rem' }}>Vino non trovato</div>;

  // Calculate stock summary by location and bottleType
  const stockSummary = {};
  if (wine.movements) {
    wine.movements.forEach(m => {
      const locName = m.location.name;
      const typeStr = !isDefaultBottle(m.bottleType) ? ` (${m.bottleType})` : "";
      const key = `${locName}${typeStr}`;
      if (!stockSummary[key]) stockSummary[key] = 0;
      if (m.movementType === 'Ingresso') stockSummary[key] += m.quantity;
      if (m.movementType === 'Uscita') stockSummary[key] -= m.quantity;
    });
  }

  const handleDeleteWine = async () => {
    if (window.confirm("Sei sicuro di voler eliminare definitivamente questa scheda vino? Verranno eliminati anche tutti i movimenti e le foto associate. L'azione non è annullabile.")) {
      setIsSaving(true);
      try {
        const res = await fetch(`/api/wines/${unwrappedParams.id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          customAlert('\n❌ Vino eliminato con successo!\n');
          setTimeout(() => {
            router.push('/');
          }, 1500);
        } else {
          const errData = await res.json();
          customAlert("Errore durante l'eliminazione: " + (errData.error || "Sconosciuto"));
          setIsSaving(false);
        }
      } catch (err) {
        console.error(err);
        customAlert("Errore di rete durante l'eliminazione: " + err.message);
        setIsSaving(false);
      }
    }
  };

  const handleBack = () => {
    if (unwrappedParams.id === 'new' && (wine.name || wine.producer || wine.country || wine.region || wine.vintage)) {
      const abandon = window.confirm("Attenzione: stai per uscire senza salvare il nuovo vino. I dati inseriti andranno persi.\n\n- Premi OK per uscire senza salvare\n- Premi Annulla per restare qui");
      if (!abandon) return;
    }
    if (window.history.length > 1) router.back();
    else router.push('/');
  };

  return (
    <div className="app-container" style={{ display: 'block', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
      {fullscreenImages && fullscreenImages.length > 0 && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', touchAction: 'none' }}
          onClick={() => setFullscreenImages([])}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'white', color: 'black', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
            &times;
          </div>

          {fullscreenImages.length > 1 && (
            <div
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'white', color: 'black', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer', zIndex: 10001 }}
              onClick={(e) => { e.stopPropagation(); setFullscreenIndex((prev) => (prev > 0 ? prev - 1 : fullscreenImages.length - 1)); }}
              className="desktop-only-arrow"
            >
              &#8249;
            </div>
          )}

          <img src={fullscreenImages[fullscreenIndex]} style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} alt="Zoomed in" onClick={(e) => e.stopPropagation()} />

          {fullscreenImages.length > 1 && (
            <div
              style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'white', color: 'black', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer', zIndex: 10001 }}
              onClick={(e) => { e.stopPropagation(); setFullscreenIndex((prev) => (prev < fullscreenImages.length - 1 ? prev + 1 : 0)); }}
              className="desktop-only-arrow"
            >
              &#8250;
            </div>
          )}
        </div>
      )}

      <header className="header" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              className="btn"
              onClick={handleBack}
              style={{ padding: '0.5rem', border: '1px solid var(--border-color)', background: 'white' }}
            >
              <ArrowLeft size={18} />
            </button>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', paddingRight: '1rem', borderRight: '1px solid var(--border-color)' }}
              onClick={handleBack}
            >
              <Wine size={28} color="var(--primary-color)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>CANTINA</h2>
            </div>
            <h1>Scheda Vino</h1>
          </div>

          {currentUser?.role !== 'viewer' && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              {unwrappedParams.id !== 'new' && (
                <button 
                  className="btn btn-danger" 
                  onClick={handleDeleteWine} 
                  disabled={uploading || isSaving}
                >
                  <Trash size={18} /> Elimina
                </button>
              )}
              {activeTab !== 'movimenti' && (
                <button className="btn btn-primary" onClick={() => handleSave(wine, true)} disabled={uploading || isSaving} style={{ position: 'relative', overflow: 'hidden' }}>
                  {isSaving && savingProgress !== null && (
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${savingProgress}%`, backgroundColor: 'rgba(255,255,255,0.2)', transition: 'width 0.1s linear' }} />
                  )}
                  <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <Save size={18} /> {isSaving ? `Salvataggio... ${savingProgress}%` : (uploading ? 'Attendere...' : (unwrappedParams.id === 'new' ? 'Salva' : 'Salva Modifiche'))}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>



      <main className="wine-detail-main" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div className="detail-grid">
          {/* Left Column: Data Form and Movements */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Movements Panel (Top of Left Column) */}
            {unwrappedParams.id !== 'new' && (
              <div className="panel" style={{ width: '100%', position: 'relative' }}>
                <div style={{ marginBottom: '2rem' }}>
                  <h2 style={{ marginTop: 0, marginBottom: '0.25rem' }}>Giacenze e Movimenti</h2>
                  <div
                    className="wine-name-preview-container"
                    style={{ fontSize: '1.25rem', color: 'var(--primary-color)', fontWeight: '600', display: 'inline-block', position: 'relative', cursor: 'pointer' }}
                    onClick={() => {
                      const photos = [wine.photo, wine.photoBack].filter(Boolean);
                      if (photos.length > 0) {
                        setFullscreenImages(photos);
                        setFullscreenIndex(0);
                      }
                    }}
                  >
                    {wine.name || 'Vino senza nome'} <span style={{ color: '#64748b', fontWeight: 'normal' }}>- {wine.vintage ? `Annata ${wine.vintage}` : 'Senza annata'}</span>

                    {(wine.photo || wine.photoBack) && (
                      <div className="wine-preview-popover">
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {wine.photo && <img src={wine.photo} alt="Fronte" style={{ width: '180px', height: 'auto', borderRadius: '4px', display: 'block' }} />}
                          {wine.photoBack && <img src={wine.photoBack} alt="Retro" style={{ width: '180px', height: 'auto', borderRadius: '4px', display: 'block' }} />}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* --- Formati Bottiglia (Varianti) --- */}
                {unwrappedParams.id !== 'new' && wine && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>Formato Bottiglia</div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {wine.allVintages && wine.allVintages.filter(v => v.vintage === wine.vintage).map(v => {
                        const isCurrentFormat = v.id === wine.id;
                        return (
                          <button
                            key={v.id}
                            onClick={() => !isCurrentFormat && router.push(`/wine/${v.id}`)}
                            style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '20px',
                              border: isCurrentFormat ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                              background: isCurrentFormat ? '#f0fdf4' : 'white',
                              color: isCurrentFormat ? 'var(--primary-color)' : 'var(--text-primary)',
                              fontWeight: isCurrentFormat ? 'bold' : 'normal',
                              cursor: isCurrentFormat ? 'default' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              transition: 'all 0.2s'
                            }}
                          >
                            {v.bottleType || 'Normale 0.75'}
                            {isCurrentFormat && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)' }}></span>}
                          </button>
                        );
                      })}
                      {currentUser?.role !== 'viewer' && (
                        <button
                          onClick={() => {
                            setPromptDialog({
                              message: 'Inserisci o seleziona il nuovo formato di bottiglia:',
                              defaultValue: '',
                              options: metadata.bottleTypes,
                              onConfirm: async (selectedFormat) => {
                                if (!selectedFormat) return;
                                setIsSaving(true);
                                try {
                                  const payload = { ...wine, id: undefined, bottleType: selectedFormat };
                                  delete payload.createdAt;
                                  delete payload.updatedAt;
                                  delete payload.movements;
                                  delete payload.grapeVarieties;
                                  const res = await fetch('/api/wines', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(payload)
                                  });
                                  if (res.ok) {
                                    const newWine = await res.json();
                                    window.location.href = `/wine/${newWine.id}`;
                                  } else {
                                    setIsSaving(false);
                                    customAlert('Errore durante la creazione del nuovo formato');
                                  }
                                } catch (err) {
                                  setIsSaving(false);
                                  customAlert('Errore di rete');
                                }
                              }
                            });
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            border: '1px dashed var(--primary-color)',
                            background: 'transparent',
                            color: 'var(--primary-color)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          + Aggiungi Formato
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {/* --- Fine Formati Bottiglia --- */}

                {unwrappedParams.id !== 'new' && (
                  <div className="tabs">
                    <div className={`tab ${activeTab === 'tutte-le-annate' ? 'active' : ''}`} onClick={() => setActiveTab('tutte-le-annate')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <List size={16} /> Tutte le Annate
                    </div>
                    <div className={`tab ${activeTab === 'riepilogo' ? 'active' : ''}`} onClick={() => setActiveTab('riepilogo')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={16} /> Mod. Scheda
                    </div>
                    <div className={`tab ${activeTab === 'movimenti' ? 'active' : ''}`} onClick={() => setActiveTab('movimenti')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ArrowRightLeft size={16} /> Movimentazioni
                    </div>
                    <div
                      className="print-menu-container"
                      style={{ cursor: 'pointer', padding: '0.5rem' }}
                      title="Stampa Scheda Vino"
                      onClick={() => {
                        try {
                          sessionStorage.setItem('printWineNames', JSON.stringify([wine.name]));
                          const newWin = window.open('/print/scheda', '_blank');
                          if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
                            window.location.href = '/print/scheda';
                          }
                        } catch (err) {
                          customAlert("Errore nell'apertura della stampa: " + err.message);
                        }
                      }}
                    >
                      <FileText size={24} color="#475569" />
                    </div>
                  </div>
                )}

                {activeTab === 'riepilogo' && (
                  <div className="tab-content" style={{ marginTop: '1rem' }}>
                    {isMobile ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {Object.keys(stockSummary).length === 0 ? (
                           <div style={{ textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>Nessuna giacenza</div>
                        ) : (
                           Object.entries(stockSummary).map(([loc, qty]) => {
                             return (
                               <div key={loc} style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                 <div>
                                   <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#0f172a', marginBottom: '0.25rem' }}>{loc}</div>
                                   <div className={qty > 0 ? 'stock-positive' : 'stock-zero'} style={{ fontSize: '1rem', display: 'inline-block', padding: '0.25rem 0.5rem' }}>{qty} bt.</div>
                                 </div>
                                 <button
                                   className="btn btn-primary"
                                   style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', borderRadius: '8px' }}
                                   onClick={() => {
                                      const bTypeMatch = loc.match(/\((.*?)\)/);
                                      const bottleTypeToPrefill = bTypeMatch ? bTypeMatch[1] : '';
                                      const cleanLocName = loc.replace(/\s*\(.*?\)\s*/, '').trim();
                                      const cleanLocObj = locations.find(l => l.name === cleanLocName);
                                      
                                      if (cleanLocObj) {
                                        setNewMovement({ ...newMovement, locationId: cleanLocObj.id.toString(), bottleType: bottleTypeToPrefill, movementType: '' });
                                        setActiveTab('movimenti');
                                      }
                                   }}
                                 >
                                   Movimenta
                                 </button>
                               </div>
                             );
                           })
                        )}
                      </div>
                    ) : (
                      <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table className="data-table" style={{ width: '100%', minWidth: '400px' }}>
                          <thead>
                            <tr>
                              <th style={{ width: '33.33%', textAlign: 'left', paddingLeft: '1rem' }}>Cantina Fisica</th>
                              <th style={{ width: '33.33%', textAlign: 'center' }}>Quantità</th>
                              <th style={{ width: '33.33%', textAlign: 'center' }}>Azione</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(stockSummary).map(([loc, qty]) => {
                              return (
                                <tr key={loc}>
                                  <td style={{ textAlign: 'left', paddingLeft: '1rem' }}>{loc}</td>
                                  <td className={qty > 0 ? 'stock-positive' : 'stock-zero'} style={{ textAlign: 'center' }}>{qty} bt.</td>
                                  <td style={{ textAlign: 'center' }}>
                                    <button
                                      className="btn btn-primary"
                                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                                      onClick={() => {
                                        const bTypeMatch = loc.match(/\((.*?)\)/);
                                        const bottleTypeToPrefill = bTypeMatch ? bTypeMatch[1] : '';
                                        const cleanLocName = loc.replace(/\s*\(.*?\)\s*/, '').trim();
                                        const cleanLocObj = locations.find(l => l.name === cleanLocName);
                                        
                                        if (cleanLocObj) {
                                          setNewMovement({ ...newMovement, locationId: cleanLocObj.id.toString(), bottleType: bottleTypeToPrefill, movementType: '' });
                                          setActiveTab('movimenti');
                                        }
                                      }}
                                    >
                                      Movimenta
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                            {Object.keys(stockSummary).length === 0 && (
                              <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1rem' }}>Nessuna giacenza</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'tutte-le-annate' && (
                  <div className="tab-content" style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                      <button className="btn btn-primary" onClick={async () => {
                        const newVintage = window.prompt('Inserisci la nuova annata (es. 2026):');
                        if (!newVintage) return;

                        // Controllo annata duplicata
                        if (wine.allVintages && wine.allVintages.some(v => String(v.vintage || '').trim() === newVintage.trim())) {
                          customAlert(`Attenzione: Impossibile creare l'annata. L'annata ${newVintage} è già presente in archivio per questo vino!`);
                          return;
                        }

                        setIsSaving(true);
                        const payload = { ...wine };
                        delete payload.id;
                        delete payload.movements;
                        delete payload.allVintages;
                        delete payload.archivedPhotos;
                        payload.vintage = newVintage;

                        if (wine.movements && wine.movements.length > 0) {
                          const sortedMovs = [...wine.movements].sort((a, b) => new Date(a.date) - new Date(b.date));
                          const lastMov = sortedMovs[sortedMovs.length - 1];
                          const movWithBottle = sortedMovs.find(m => m.bottleType) || lastMov;
                          sessionStorage.setItem('prefillMovement', JSON.stringify({
                            bottleType: movWithBottle.bottleType || '',
                            reason: lastMov.reason || '',
                            vendor: lastMov.vendor || '',
                            price: lastMov.price || '',
                            tempPrice: lastMov.tempPrice || ''
                          }));
                        }

                        try {
                          const res = await fetch(`/api/wines`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                          });
                          if (res.ok) {
                            const newWine = await res.json();
                            window.location.href = `/wine/${newWine.id}`;
                          } else {
                            setIsSaving(false);
                            customAlert('Errore durante la creazione della nuova annata');
                          }
                        } catch (err) {
                          setIsSaving(false);
                          customAlert('Errore di rete');
                        }
                      }}>
                        {isSaving ? 'Creazione in corso...' : '+ Aggiungi Nuova Annata'}
                      </button>
                    </div>
                    <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <table className="data-table" style={{ width: '100%', minWidth: '400px' }}>
                        <thead>
                          <tr>
                            <th 
                              style={{ width: '33.33%', textAlign: 'left', paddingLeft: '2rem', cursor: 'pointer' }}
                              onClick={() => setVintageSortConfig({ key: 'vintage', direction: vintageSortConfig.key === 'vintage' && vintageSortConfig.direction === 'desc' ? 'asc' : 'desc' })}
                            >
                              Annata {vintageSortConfig.key === 'vintage' ? (vintageSortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th 
                              style={{ width: '33.33%', textAlign: 'center', cursor: 'pointer' }}
                              onClick={() => setVintageSortConfig({ key: 'stock', direction: vintageSortConfig.key === 'stock' && vintageSortConfig.direction === 'desc' ? 'asc' : 'desc' })}
                            >
                              Giacenza Totale {vintageSortConfig.key === 'stock' ? (vintageSortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th style={{ width: '33.33%', textAlign: 'right', paddingRight: '2rem' }}>Azione</th>
                          </tr>
                        </thead>
                        <tbody>
                          {wine.allVintages && wine.allVintages.length > 0 ? (
                            [...wine.allVintages].sort((a, b) => {
                              let valA = a[vintageSortConfig.key];
                              let valB = b[vintageSortConfig.key];
                              if (vintageSortConfig.key === 'vintage') {
                                valA = parseInt(valA) || 0;
                                valB = parseInt(valB) || 0;
                              }
                              if (valA < valB) return vintageSortConfig.direction === 'asc' ? -1 : 1;
                              if (valA > valB) return vintageSortConfig.direction === 'asc' ? 1 : -1;
                              return 0;
                            }).map(v => {
                              const isCurrent = v.id === wine.id;
                              return (
                                <tr key={v.id} style={{ backgroundColor: isCurrent ? '#f0fdf4' : 'transparent' }}>
                                  <td style={{ fontWeight: isCurrent ? 'bold' : 'normal', textAlign: 'left', paddingLeft: '2rem' }}>
                                    {v.vintage} <span style={{ color: '#64748b', fontSize: '0.9em', marginLeft: '0.5rem' }}>({v.bottleType || 'Normale 0.75'})</span>
                                    {isCurrent && <span style={{ fontSize: '0.8rem', color: 'var(--success-color)', marginLeft: '0.5rem' }}>(Attuale)</span>}
                                  </td>
                                  <td className={v.stock > 0 ? 'stock-positive' : 'stock-zero'} style={{ fontWeight: isCurrent ? 'bold' : 'normal', textAlign: 'center' }}>{v.stock} bt.</td>
                                  <td style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', paddingRight: '2rem' }}>
                                    <button className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', border: '1px solid var(--border-color)', background: 'white', minWidth: '110px' }} onClick={() => router.push(`/wine/${v.id}`)} disabled={isCurrent}>
                                      {isCurrent ? 'Sei già qui' : 'Apri Scheda'}
                                    </button>
                                    {currentUser?.role !== 'viewer' && (
                                      <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDeleteVintage(v.id, isCurrent)} title="Elimina annata">
                                        <Trash size={16} />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1rem' }}>Nessuna annata registrata in catalogo.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'movimenti' && (
                  <div className="tab-content" style={{ marginTop: '1rem' }}>
                    {currentUser?.role !== 'viewer' && (
                      <div style={{ marginBottom: '1rem', background: '#f1f5f9', padding: '1rem', borderRadius: 'var(--radius-md)', maxWidth: '600px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>
                          {editingMovementId ? 'Modifica Movimento' : 'Aggiungi Movimento'}
                        </h3>

                      <div className="form-grid">
                        <label>Data</label>
                        <input type="date" style={{ maxWidth: '160px', width: '100%' }} value={newMovement.date} onChange={e => setNewMovement({ ...newMovement, date: e.target.value })} />
                      </div>
                      <div className="form-grid">
                        <label>Cantina</label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <select style={{ flex: 1, minWidth: '200px', maxWidth: '300px' }} value={newMovement.locationId} onChange={e => setNewMovement({ ...newMovement, locationId: e.target.value })}>
                            <option value="">Seleziona cantina...</option>
                            {locations.map(loc => (
                              <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                          </select>
                          <button className="btn" title="Gestisci Cantine" onClick={(e) => { e.preventDefault(); openListModal('_initialLocationName', 'Cantina', locations.map(l => l.name)); }} style={{ border: '1px solid var(--border-color)', background: 'white', padding: '0 0.5rem' }}>✏️</button>
                        </div>
                      </div>
                      <div className="form-grid">
                        <label>Tipo</label>
                        <select style={{ maxWidth: '300px' }} value={newMovement.movementType} onChange={e => setNewMovement({ ...newMovement, movementType: e.target.value })}>
                          <option value="">Seleziona tipo...</option>
                          <option value="Ingresso">Ingresso</option>
                          <option value="Uscita">Uscita</option>
                        </select>
                      </div>
                      <div className="form-grid">
                        <label>Quantità</label>
                        <input type="number" min="1" placeholder="Es. 6" style={{ maxWidth: '300px' }} value={newMovement.quantity} onChange={e => setNewMovement({ ...newMovement, quantity: e.target.value })} />
                      </div>
                      <div className="form-grid">
                        <label>Tipo bottiglia</label>
                        <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '400px' }}>
                          <input type="text" list="bottle-list" value={newMovement.bottleType} onChange={e => setNewMovement({ ...newMovement, bottleType: e.target.value })} style={{ flex: 1 }} />
                          <button type="button" className="btn" title="Gestisci Tipo bottiglia" onClick={(e) => { e.preventDefault(); openListModal('bottleType', 'Tipo bottiglia', metadata.bottleTypes); }} style={{ border: '1px solid var(--border-color)', background: 'white', padding: '0 0.5rem' }}>✏️</button>
                        </div>
                        <datalist id="bottle-list">
                          {metadata.bottleTypes?.map(b => <option key={b} value={b} />)}
                        </datalist>
                      </div>
                      <div className="form-grid">
                        <label>Causale</label>
                        <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '400px' }}>
                          <select value={newMovement.reason} onChange={e => setNewMovement({ ...newMovement, reason: e.target.value })} style={{ flex: 1 }}>
                            <option value=""></option>
                            {metadata.reasons?.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <button type="button" className="btn" title="Gestisci Causale" onClick={(e) => { e.preventDefault(); openListModal('reason', 'Causale', metadata.reasons); }} style={{ border: '1px solid var(--border-color)', background: 'white', padding: '0 0.5rem' }}>✏️</button>
                        </div>
                      </div>

                      <div className="form-grid">
                        <label>Venditore</label>
                        <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '400px' }}>
                          <input type="text" list="vendor-list" value={newMovement.vendor} onChange={e => setNewMovement({ ...newMovement, vendor: e.target.value })} style={{ flex: 1 }} />
                          <button type="button" className="btn" title="Gestisci Venditore" onClick={(e) => { e.preventDefault(); openListModal('vendor', 'Venditore', metadata.vendors); }} style={{ border: '1px solid var(--border-color)', background: 'white', padding: '0 0.5rem' }}>✏️</button>
                        </div>
                        <datalist id="vendor-list">
                          {metadata.vendors?.map(v => <option key={v} value={v} />)}
                        </datalist>
                      </div>

                      <div className="form-grid">
                        <label>Prezzo</label>
                        <input type="number" step="0.01" style={{ maxWidth: '300px' }} value={newMovement.price} onChange={e => setNewMovement({ ...newMovement, price: e.target.value })} />
                      </div>
                      <div className="form-grid">
                        <label>Prezzo provvisorio</label>
                        <input type="number" step="0.01" style={{ maxWidth: '300px' }} value={newMovement.tempPrice} onChange={e => setNewMovement({ ...newMovement, tempPrice: e.target.value })} />
                      </div>

                      <div className="form-grid">
                        <label>Note</label>
                        <textarea
                          placeholder="Note (opzionale)"
                          value={newMovement.notes}
                          rows={1}
                          onChange={e => {
                            setNewMovement({ ...newMovement, notes: e.target.value });
                            e.target.style.height = 'auto';
                            e.target.style.height = (e.target.scrollHeight) + 'px';
                          }}
                          style={{ maxWidth: '400px', overflow: 'hidden', resize: 'none' }}
                        />
                      </div>

                      <div className="form-grid" style={{ marginTop: '1.5rem' }}>
                        <label></label>
                        <div style={{ display: 'flex', gap: '0.5rem', width: 'fit-content' }}>
                          {editingMovementId && (
                            <button className="btn" style={{ border: '1px solid var(--border-color)', background: 'white' }} onClick={() => {
                              setEditingMovementId(null);
                              setNewMovement({ ...newMovement, movementType: '', locationId: '', quantity: '', bottleType: '', reason: '', price: '', tempPrice: '', vendor: '', notes: '' });
                            }}>Annulla</button>
                          )}
                          <button className="btn btn-primary" onClick={async () => {
                            if (!newMovement.movementType) {
                              customAlert('Per favore seleziona se è un Ingresso o un\'Uscita!');
                              return;
                            }
                            if (!newMovement.quantity) {
                              customAlert('Per favore inserisci la quantità!');
                              return;
                            }
                            if (!newMovement.locationId) {
                              customAlert('Per favore seleziona una cantina fisica!');
                              return;
                            }
                            const loc = locations.find(l => l.id.toString() === newMovement.locationId.toString());

                            if (newMovement.movementType === 'Uscita') {
                              const locName = loc ? loc.name : '';
                              // Determine current stock (skip check if editing existing movement from the same location because it gets complicated, but we do a simple check)
                              const typeStr = !isDefaultBottle(newMovement.bottleType) ? ` (${newMovement.bottleType})` : "";
                              const key = `${locName}${typeStr}`;
                              const availableQty = stockSummary[key] || 0;
                              const qtyOut = parseInt(newMovement.quantity) || 0;

                              // We adjust availableQty if we are editing the same movement in the same location
                              let editingQty = 0;
                              if (editingMovementId) {
                                const originalMov = wine.movements?.find(m => m.id === editingMovementId);
                                if (originalMov && originalMov.movementType === 'Uscita' && originalMov.locationId?.toString() === newMovement.locationId) {
                                  editingQty = parseInt(originalMov.quantity) || 0;
                                }
                              }

                              if (qtyOut > availableQty + editingQty) {
                                customAlert(`Errore: Bottiglie insufficienti. Hai solo ${availableQty} bottiglie in ${locName}${typeStr}.`);
                                return;
                              }

                              if (!newMovement.reason || newMovement.reason.trim() === '') {
                                customAlert('Errore: La Causale è obbligatoria per i movimenti in uscita.');
                                return;
                              }

                              if (newMovement.reason.trim().toLowerCase() === 'acquisto') {
                                customAlert('Errore: La Causale "Acquisto" non può essere usata per un\'Uscita.');
                                return;
                              }

                              if (newMovement.reason.trim().toLowerCase() === 'carico iniziale') {
                                customAlert('Errore: La Causale "Carico Iniziale" non può essere usata per un\'Uscita.');
                                return;
                              }
                            } else if (newMovement.movementType === 'Ingresso') {
                              const allowedIngressoReasons = ['acquisto', 'inventario', 'regalo', 'carico iniziale'];
                              const currentReason = (newMovement.reason || '').trim().toLowerCase();

                              if (currentReason && !allowedIngressoReasons.includes(currentReason) && !currentReason.startsWith('trasf. da')) {
                                customAlert('Errore: Per un Ingresso le uniche causali permesse sono "Acquisto", "Inventario", "Regalo" (o un Trasferimento generato in automatico).');
                                return;
                              }
                            }

                            // Blocco generale per evitare nuovi "Carico Iniziale" se non si sta modificando quello originario
                            if (!editingMovementId && newMovement.reason && newMovement.reason.trim().toLowerCase() === 'carico iniziale') {
                              customAlert('Errore: "Carico Iniziale" viene generato in automatico solo quando inserisci un nuovo vino. Scegli un\'altra causale.');
                              return;
                            }

                            if (editingMovementId) {
                              if (String(editingMovementId).startsWith('temp-')) {
                                const updatedMovements = wine.movements.map(m =>
                                  m.id === editingMovementId ? { ...m, ...newMovement, locationId: parseInt(newMovement.locationId), location: loc || m.location } : m
                                );
                                setWine({ ...wine, movements: updatedMovements });
                                setEditingMovementId(null);
                                setNewMovement({ ...newMovement, movementType: '', quantity: '', reason: '', price: '', tempPrice: '', vendor: '', notes: '' });
                              } else {
                                const res = await fetch(`/api/movements/${editingMovementId}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ ...newMovement, locationId: parseInt(newMovement.locationId) })
                                });
                                if (res.ok) {
                                  customAlert('\n📦 Movimentazione aggiornata con successo!\n');
                                  fetchWine();
                                  setEditingMovementId(null);
                                  setNewMovement({ ...newMovement, movementType: '', quantity: '', reason: '', price: '', tempPrice: '', vendor: '', notes: '' });
                                } else {
                                  const data = await res.json().catch(() => ({}));
                                  customAlert('Errore aggiornamento movimento: ' + (data.error || 'Sconosciuto'));
                                }
                              }
                            } else {
                              const movement = {
                                id: 'temp-' + Date.now(),
                                locationId: parseInt(newMovement.locationId),
                                location: loc || { name: 'Sconosciuta' },
                                movementType: newMovement.movementType,
                                quantity: parseInt(newMovement.quantity),
                                bottleType: newMovement.bottleType,
                                reason: newMovement.reason,
                                vendor: newMovement.vendor,
                                price: newMovement.price ? parseFloat(newMovement.price) : null,
                                tempPrice: newMovement.tempPrice ? parseFloat(newMovement.tempPrice) : null,
                                date: new Date(newMovement.date).toISOString(),
                                notes: newMovement.notes || '',
                                isNew: true
                              };
                              const updatedWine = { ...wine, movements: [...(wine.movements || []), movement] };
                              setWine(updatedWine);
                              setNewMovement({ ...newMovement, movementType: '', quantity: '', reason: '', price: '', tempPrice: '', vendor: '', notes: '' });

                              // Salva automaticamente nel database!
                              handleSave(updatedWine, true, '\n📦 Movimentazione salvata con successo!\n');
                            }
                          }}>
                            {editingMovementId ? 'Salva Modifica' : 'Aggiungi Movimento'}
                          </button>
                        </div>
                      </div>
                      </div>
                    )}

                    <div style={{ marginTop: '2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label style={{ fontWeight: 'bold' }}>Filtra per cantina:</label>
                      <select
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                        value={selectedLocationFilter}
                        onChange={e => setSelectedLocationFilter(e.target.value)}
                      >
                        <option value="">Tutte le cantine</option>
                        {locations.map(l => <option key={l.id} value={l.id.toString()}>{l.name}</option>)}
                      </select>
                    </div>

                    <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <table className="data-table mobile-cards" style={{ width: '100%', minWidth: '800px' }}>
                        <thead>
                          <tr>
                            <th></th>
                            <th>Data</th>
                            <th>Tipo</th>
                            <th>Cantina</th>
                            <th>Q.tà</th>
                            {!showExtraColumns && (
                              <th style={{ width: '40px', textAlign: 'center', cursor: 'pointer', color: 'var(--primary-color)' }} onClick={() => setShowExtraColumns(true)} title="Espandi dettagli">
                                ▶
                              </th>
                            )}
                            {showExtraColumns && (
                              <>
                                <th>Bottiglia</th>
                                <th>Causale</th>
                                <th>Venditore</th>
                                <th>Prezzo</th>
                                <th>Note</th>
                                <th style={{ width: '40px', textAlign: 'center', cursor: 'pointer', color: 'var(--primary-color)' }} onClick={() => setShowExtraColumns(false)} title="Riduci dettagli">
                                  ◀
                                </th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {wine.movements && [...wine.movements]
                            .sort((a, b) => {
                              // Carico Iniziale va sempre in fondo (è il più vecchio per definizione)
                              const isACarico = (a.reason || '').toLowerCase().trim() === 'carico iniziale';
                              const isBCarico = (b.reason || '').toLowerCase().trim() === 'carico iniziale';
                              if (isACarico && !isBCarico) return 1;
                              if (!isACarico && isBCarico) return -1;

                              const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
                              if (dateDiff !== 0) return dateDiff;

                              // Fallback on ID if dates are exactly the same
                              const idA = typeof a.id === 'string' ? parseInt(a.id.replace('temp-', '')) + 999999999 : a.id;
                              const idB = typeof b.id === 'string' ? parseInt(b.id.replace('temp-', '')) + 999999999 : b.id;
                              return idB - idA;
                            })
                            .filter(m => !selectedLocationFilter || m.locationId?.toString() === selectedLocationFilter)
                            .slice(0, showAllMovements ? undefined : 5)
                            .map(m => {
                              const isTransferOut = m.movementType === 'Uscita' && locations.some(l => {
                                const locNameClean = (l.name || '').toLowerCase().replace('cantina', '').trim();
                                const reasonClean = (m.reason || '').toLowerCase().replace('cantina', '').trim();
                                return locNameClean === reasonClean && locNameClean.length > 0;
                              });
                              const isTransferIn = m.movementType === 'Ingresso' && (m.reason || '').startsWith('Trasf. da');
                              const isTransfer = isTransferOut || isTransferIn;

                              return (
                                <tr key={m.id} style={{ backgroundColor: isTransfer ? '#fcfcfc' : 'transparent' }}>
                                  <td data-label="Azioni">
                                    <div style={{ display: 'flex', gap: '0.5rem', minHeight: '32px' }}>
                                      {currentUser?.role !== 'viewer' && !isTransferIn && (
                                        <>
                                          <button
                                            type="button"
                                            className="btn"
                                            style={{ padding: '0.3rem', minWidth: 'auto', border: '1px solid var(--border-color)', background: 'white' }}
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleEditMovement(m);
                                            }}
                                            title="Modifica movimento"
                                          >
                                            <Edit2 size={14} color="var(--primary-color)" />
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-danger"
                                            style={{ padding: '0.3rem', minWidth: 'auto' }}
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleDeleteMovement(m.id);
                                            }}
                                            title="Elimina movimento"
                                          >
                                            <Trash size={14} />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                  <td data-label="Data" style={{ whiteSpace: 'nowrap', color: isTransfer ? '#777' : 'inherit' }}>{new Date(m.date).toLocaleDateString()}</td>
                                  <td data-label="Tipo" style={{ color: isTransfer ? '#888' : (m.movementType === 'Ingresso' ? 'var(--success-color)' : 'var(--danger-color)'), fontWeight: isTransfer ? 'bold' : 'normal' }}>
                                    {m.movementType}
                                    {isTransfer && <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>Trasferito</div>}
                                  </td>
                                  <td data-label="Cantina" style={{ color: isTransfer ? '#777' : 'inherit' }}>{m.location?.name || 'N/D'}</td>
                                  <td data-label="Q.tà" style={{ color: isTransfer ? '#777' : 'inherit' }}>{m.quantity}</td>
                                  {!showExtraColumns && (
                                    <td style={{ textAlign: 'center', cursor: 'pointer', color: 'var(--primary-color)' }} onClick={() => setShowExtraColumns(true)}>
                                      ▶
                                    </td>
                                  )}
                                  {showExtraColumns && (
                                    <>
                                      <td data-label="Bottiglia" style={{ color: isTransfer ? '#777' : 'inherit' }}>{m.bottleType || '-'}</td>
                                      <td data-label="Causale" style={{ color: isTransfer ? '#777' : 'inherit' }}>{m.reason || '-'}</td>
                                      <td data-label="Venditore" style={{ color: isTransfer ? '#777' : 'inherit' }}>{m.vendor || '-'}</td>
                                      <td data-label="Prezzo" style={{ whiteSpace: 'nowrap', color: isTransfer ? '#777' : 'inherit' }}>{m.price ? `€ ${m.price.toFixed(2)}` : (m.tempPrice ? `€ ${m.tempPrice.toFixed(2)} (Provv.)` : '-')}</td>
                                      <td data-label="Note" style={{ color: isTransfer ? '#777' : 'inherit', maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden' }}>{m.notes || '-'}</td>
                                      <td style={{ textAlign: 'center', cursor: 'pointer', color: 'var(--primary-color)' }} onClick={() => setShowExtraColumns(false)}>
                                        ◀
                                      </td>
                                    </>
                                  )}
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>
                    {wine.movements && wine.movements.filter(m => !selectedLocationFilter || m.locationId?.toString() === selectedLocationFilter).length > 5 && (
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                        <button
                          className="btn"
                          onClick={() => setShowAllMovements(!showAllMovements)}
                          style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', padding: '0.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                        >
                          {showAllMovements ? (
                            <><span>Riduci</span> <span style={{ fontSize: '1.2rem' }}>⏶</span></>
                          ) : (
                            <><span>Vedi tutti ({wine.movements.filter(m => !selectedLocationFilter || m.locationId?.toString() === selectedLocationFilter).length})</span> <span style={{ fontSize: '1.2rem' }}>⏷</span></>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}


              </div>
            )}

            {/* Data Form */}
            {activeTab === 'riepilogo' && (
              <>
                {unwrappedParams.id !== 'new' && (
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0 1rem 0' }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setShowFullForm(!showFullForm)}
                      style={{ background: '#f1f5f9', color: 'var(--text-primary)', border: '1px solid var(--border-color)', width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 'bold' }}
                    >
                      {showFullForm ? 'Nascondi Scheda Dettagliata ⏶' : 'Mostra/Modifica Scheda Dettagliata (Foto, Note, ecc.) ⏷'}
                    </button>
                  </div>
                )}

                {showFullForm && (
                  <div className="panel">

                    <div className="form-grid">
                      <label>Nome</label>
                      <input
                        type="text"
                        placeholder="Es. Barolo Riserva"
                        value={wine.name || ''}
                        onChange={e => setWine({ ...wine, name: e.target.value })}
                        onBlur={async () => {
                          if (unwrappedParams.id === 'new' && wine.name && wine.name.trim() !== '') {
                            try {
                              const res = await fetch(`/api/wines/metadata-by-name?name=${encodeURIComponent(wine.name)}`);
                              if (res.ok) {
                                const existingData = await res.json();
                                if (existingData) {
                                  setWine(prev => ({
                                    ...prev,
                                    photo: prev.photo || existingData.photo || '',
                                    photoBack: prev.photoBack || existingData.photoBack || '',
                                    producer: prev.producer || existingData.producer || '',
                                    region: prev.region || existingData.region || '',
                                    category: prev.category || existingData.category || '',
                                    classification: prev.classification || existingData.classification || '',
                                    grapeVarieties: (prev.grapeVarieties && prev.grapeVarieties.length > 0) ? prev.grapeVarieties : (existingData.grapeVarieties || [])
                                  }));
                                }
                              }
                            } catch (err) {
                              console.error('Failed to fetch existing metadata:', err);
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="form-grid">
                      <label>Anno</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" list="vintage-list" placeholder="Es. 2018" value={wine.vintage || ''} onChange={e => setWine({ ...wine, vintage: e.target.value })} style={{ flex: 1 }} />
                        <button type="button" className="btn" title="Gestisci Anno" onClick={(e) => { e.preventDefault(); openListModal('vintage', 'Anno', metadata.vintages); }} style={{ border: '1px solid var(--border-color)', background: 'white', padding: '0 0.5rem' }}>✏️</button>
                      </div>
                      <datalist id="vintage-list">
                        {metadata.vintages.map(v => <option key={v} value={v} />)}
                      </datalist>
                    </div>
                    <div className="form-grid">
                      <label>Nazione</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          {wine.country && getCountryFlag(wine.country) && (
                            <span style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', pointerEvents: 'none' }}>
                              {getCountryFlag(wine.country)}
                            </span>
                          )}
                          <input
                            type="text"
                            list="country-list"
                            placeholder="Es. Italia"
                            value={wine.country || ''}
                            onChange={e => setWine({ ...wine, country: e.target.value })}
                            style={{ width: '100%', paddingLeft: (wine.country && getCountryFlag(wine.country)) ? '2.5rem' : '0.75rem' }}
                          />
                        </div>
                        <button type="button" className="btn" title="Gestisci Nazione" onClick={(e) => { e.preventDefault(); openListModal('country', 'Nazione', metadata.countries); }} style={{ border: '1px solid var(--border-color)', background: 'white', padding: '0 0.5rem' }}>✏️</button>
                      </div>
                      <datalist id="country-list">
                        {metadata.countries.map(c => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                    <div className="form-grid">
                      <label>Regione</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" list="region-list" placeholder="Seleziona regione" value={wine.region || ''} onChange={e => setWine({ ...wine, region: e.target.value })} style={{ flex: 1 }} />
                        <button type="button" className="btn" title="Gestisci Regione" onClick={(e) => {
                          e.preventDefault();
                          let regionOptions = metadata.regions;
                          if (wine.country && metadata.regionsByCountry) {
                            const cKey = Object.keys(metadata.regionsByCountry).find(k => k.toLowerCase() === wine.country.trim().toLowerCase());
                            if (cKey) regionOptions = metadata.regionsByCountry[cKey];
                          }
                          openListModal('region', 'Regione', regionOptions);
                        }} style={{ border: '1px solid var(--border-color)', background: 'white', padding: '0 0.5rem' }}>✏️</button>
                      </div>
                      <datalist id="region-list">
                        {(() => {
                          if (wine.country && metadata.regionsByCountry) {
                            const cKey = Object.keys(metadata.regionsByCountry).find(k => k.toLowerCase() === wine.country.trim().toLowerCase());
                            if (cKey) return metadata.regionsByCountry[cKey].map(r => <option key={r} value={r} />);
                          }
                          return metadata.regions.map(r => <option key={r} value={r} />);
                        })()}
                      </datalist>
                    </div>
                    <div className="form-grid">
                      <label>Cantina Produttrice</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" list="producer-list" placeholder="Es. Marchesi di Barolo" value={wine.producerCellar || ''} onChange={e => setWine({ ...wine, producerCellar: e.target.value })} style={{ flex: 1 }} />
                        <button type="button" className="btn" title="Gestisci Cantina Produttrice" onClick={(e) => { e.preventDefault(); openListModal('producerCellar', 'Cantina Produttrice', metadata.producers); }} style={{ border: '1px solid var(--border-color)', background: 'white', padding: '0 0.5rem' }}>✏️</button>
                      </div>
                      <datalist id="producer-list">
                        {metadata.producers.map(p => <option key={p} value={p} />)}
                      </datalist>
                    </div>
                    <div className="form-grid">
                      <label>Produttore</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" list="producer-name-list" placeholder="Es. Gaja" value={wine.producer || ''} onChange={e => setWine({ ...wine, producer: e.target.value })} style={{ flex: 1 }} />
                        <button type="button" className="btn" title="Gestisci Produttore" onClick={(e) => { e.preventDefault(); openListModal('producer', 'Produttore', metadata.producerNames || []); }} style={{ border: '1px solid var(--border-color)', background: 'white', padding: '0 0.5rem' }}>✏️</button>
                      </div>
                      <datalist id="producer-name-list">
                        {metadata.producerNames && metadata.producerNames.map(p => <option key={p} value={p} />)}
                      </datalist>
                    </div>
                    <div className="form-grid">
                      <label>Classificazione</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" list="classification-list" placeholder="Es. DOCG" value={wine.classification || ''} onChange={e => setWine({ ...wine, classification: e.target.value })} style={{ flex: 1 }} />
                        <button type="button" className="btn" title="Gestisci Classificazione" onClick={(e) => { e.preventDefault(); openListModal('classification', 'Classificazione', metadata.classifications); }} style={{ border: '1px solid var(--border-color)', background: 'white', padding: '0 0.5rem' }}>✏️</button>
                      </div>
                      <datalist id="classification-list">
                        {metadata.classifications.map(c => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                    <div className="form-grid">
                      <label>Categoria</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" list="category-list" placeholder="Es. Vino Rosso" value={wine.category || ''} onChange={e => setWine({ ...wine, category: e.target.value })} style={{ flex: 1 }} />
                        <button type="button" className="btn" title="Gestisci Categoria" onClick={(e) => { e.preventDefault(); openListModal('category', 'Categoria', metadata.categories); }} style={{ border: '1px solid var(--border-color)', background: 'white', padding: '0 0.5rem' }}>✏️</button>
                      </div>
                      <datalist id="category-list">
                        {metadata.categories.map(c => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                    <div className="form-grid">
                      <label>Tipologia</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" list="type-list" placeholder="Es. Secco" value={wine.type || ''} onChange={e => setWine({ ...wine, type: e.target.value })} style={{ flex: 1 }} />
                        <button type="button" className="btn" title="Gestisci Tipologia" onClick={(e) => { e.preventDefault(); openListModal('type', 'Tipologia', metadata.types); }} style={{ border: '1px solid var(--border-color)', background: 'white', padding: '0 0.5rem' }}>✏️</button>
                      </div>
                      <datalist id="type-list">
                        {metadata.types.map(t => <option key={t} value={t} />)}
                      </datalist>
                    </div>

                    <div className="form-grid" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                      <label>Cantina Fisica</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="text"
                          list="location-list"
                          placeholder="Es. Cantina di casa"
                          value={wine._initialLocationName || ''}
                          onChange={e => setWine({ ...wine, _initialLocationName: e.target.value })}
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          className="btn"
                          title="Gestisci Cantina Fisica"
                          onClick={(e) => {
                            e.preventDefault();
                            openListModal('_initialLocationName', 'Cantina Fisica', locations.map(l => l.name));
                          }}
                          style={{ border: '1px solid var(--border-color)', background: 'white', padding: '0 0.5rem' }}
                        >
                          ✏️
                        </button>
                        <datalist id="location-list">
                          {locations.map(loc => <option key={loc.id} value={loc.name} />)}
                        </datalist>
                      </div>
                    </div>
                    {wine._initialLocationName && (
                      <>
                        {unwrappedParams.id === 'new' && (
                          <div className="form-grid">
                            <label>Quantità Iniziale</label>
                            <input type="number" min="1" placeholder="Es. 6" value={wine._initialQuantity || ''} onChange={e => setWine({ ...wine, _initialQuantity: e.target.value })} />
                          </div>
                        )}
                        <div className="form-grid">
                          <label>Tipo Bottiglia</label>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input type="text" list="bottle-list-initial" placeholder="Es. Normale 0.75" value={wine._initialBottleType || ''} onChange={e => setWine({ ...wine, _initialBottleType: e.target.value })} style={{ flex: 1 }} />
                            <button type="button" className="btn" title="Gestisci Tipo Bottiglia" onClick={(e) => { e.preventDefault(); openListModal('_initialBottleType', 'Tipo Bottiglia', metadata.bottleTypes); }} style={{ border: '1px solid var(--border-color)', background: 'white', padding: '0 0.5rem' }}>✏️</button>
                          </div>
                          <datalist id="bottle-list-initial">
                            {metadata.bottleTypes?.map(b => <option key={b} value={b} />)}
                          </datalist>
                        </div>
                        <div className="form-grid">
                          <label>Prezzo Unitario (€)</label>
                          <input type="number" step="0.01" placeholder="Es. 15.50" value={wine._initialPrice || ''} onChange={e => setWine({ ...wine, _initialPrice: e.target.value })} />
                        </div>
                        <div className="form-grid">
                          <label>Prezzo Provvisorio (€)</label>
                          <input type="number" step="0.01" placeholder="Es. 15.50" value={wine._initialTempPrice || ''} onChange={e => setWine({ ...wine, _initialTempPrice: e.target.value })} />
                        </div>
                      </>
                    )}

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div className="form-grid" style={{ flex: 1 }}>
                        <label>Grado Alcolico</label>
                        <input type="number" step="0.1" placeholder="Es. 13.5" value={wine.alcoholContent || ''} onChange={e => setWine({ ...wine, alcoholContent: e.target.value })} />
                      </div>
                      <div className="form-grid" style={{ flex: 1 }}>
                        <label>Temperatura</label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input type="number" step="0.1" placeholder="Da (es. 16)" value={wine.tempMin || ''} onChange={e => setWine({ ...wine, tempMin: e.target.value })} />
                          <span>a</span>
                          <input type="number" step="0.1" placeholder="A (es. 18)" value={wine.tempMax || ''} onChange={e => setWine({ ...wine, tempMax: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    <div className="form-grid" style={{ marginTop: '1rem' }}>
                      <label>Uvaggio (Vitigni)</label>
                      <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table className="data-table" style={{ width: '100%', maxWidth: '600px' }}>
                          <thead>
                            <tr>
                              <th>
                                Vitigno
                                <button type="button" className="btn" title="Gestisci Vitigni" onClick={(e) => { e.preventDefault(); openListModal('grapeVarieties', 'Vitigno', metadata.grapeVarieties); }} style={{ border: '1px solid var(--border-color)', background: 'white', padding: '0 0.5rem', marginLeft: '0.5rem' }}>✏️</button>
                              </th>
                              <th style={{ width: '100px' }}>Percentuale</th>
                              <th style={{ width: '40px' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {(wine.grapeVarieties || []).map((gv, index) => (
                              <tr key={index}>
                                <td style={{ padding: '0.2rem' }}>
                                  <input
                                    type="text"
                                    list="grape-list"
                                    value={gv.name || ''}
                                    onChange={e => {
                                      const newGrapes = [...(wine.grapeVarieties || [])];
                                      newGrapes[index] = { ...newGrapes[index], name: e.target.value };
                                      setWine({ ...wine, grapeVarieties: newGrapes });
                                    }}
                                    placeholder="es. Sangiovese"
                                    style={{ width: '100%', border: 'none', background: 'transparent' }}
                                  />
                                  <datalist id="grape-list">
                                    {metadata.grapeVarieties?.map(g => <option key={g} value={g} />)}
                                  </datalist>
                                </td>
                                <td style={{ padding: '0.2rem' }}>
                                  <input
                                    type="number"
                                    value={gv.percentage || ''}
                                    onChange={e => {
                                      const newGrapes = [...(wine.grapeVarieties || [])];
                                      newGrapes[index] = { ...newGrapes[index], percentage: e.target.value };
                                      setWine({ ...wine, grapeVarieties: newGrapes });
                                    }}
                                    placeholder="%"
                                    style={{ width: '100%', border: 'none', background: 'transparent' }}
                                  />
                                </td>
                                <td style={{ padding: '0.2rem', textAlign: 'center' }}>
                                  <button
                                    className="btn btn-danger"
                                    style={{ padding: '0.25rem 0.5rem', margin: 0 }}
                                    onClick={() => {
                                      const newGrapes = (wine.grapeVarieties || []).filter((_, i) => i !== index);
                                      setWine({ ...wine, grapeVarieties: newGrapes });
                                    }}
                                    title="Rimuovi vitigno"
                                  >
                                    &times;
                                  </button>
                                </td>
                              </tr>
                            ))}
                            <tr>
                              <td colSpan="3" style={{ padding: '0.2rem' }}>
                                <button
                                  className="btn"
                                  style={{ width: '100%', background: '#f8fafc', border: '1px dashed var(--border-color)', color: '#64748b' }}
                                  onClick={() => {
                                    const newGrapes = [...(wine.grapeVarieties || []), { name: '', percentage: '' }];
                                    setWine({ ...wine, grapeVarieties: newGrapes });
                                  }}
                                >
                                  + Aggiungi Vitigno
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="form-grid" style={{ alignItems: 'flex-start' }}>
                      <label>Nota</label>
                      <textarea rows={4} value={wine.notes || ''} onChange={e => setWine({ ...wine, notes: e.target.value })} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column: Photos */}
          {activeTab === 'riepilogo' && showFullForm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="panel" style={{ alignSelf: 'start' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Foto Fronte</h3>
                {wine.photo ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={wine.photo}
                      alt="Fronte"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}
                      onClick={() => {
                        setFullscreenImages([wine.photo, wine.photoBack].filter(Boolean));
                        setFullscreenIndex(0);
                      }}
                    />
                    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: '0.5rem' }}>
                      <button type="button" className="btn btn-secondary" style={{ padding: '0.5rem', minWidth: 'auto', background: 'white', color: 'black', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRotateImage(wine.photo, 'front'); }} title="Ruota 90°"><RotateCw size={16} /></button>
                      <button type="button" className="btn btn-danger" style={{ padding: '0.5rem', minWidth: 'auto', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWine({ ...wine, photo: null }); }} title="Elimina foto"><Trash size={16} /></button>
                    </div>
                  </div>
                ) : (
                  <div className="photo-placeholder">
                    <div style={{ textAlign: 'center' }}>
                      <ImageIcon size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                      <p>Nessuna foto fronte</p>
                    </div>
                  </div>
                )}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input type="file" accept="image/*" capture="environment" onChange={(e) => handleUpload(e, 'front')} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }} disabled={uploading} />
                    <button className="btn" style={{ width: '100%', border: '1px solid var(--border-color)', justifyContent: 'center', padding: '0.6rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }} disabled={uploading} title="Scatta foto">
                      {uploading ? '...' : <Camera size={20} />}
                    </button>
                  </div>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'front')} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }} disabled={uploading} />
                    <button className="btn" style={{ width: '100%', border: '1px solid var(--border-color)', justifyContent: 'center', padding: '0.6rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }} disabled={uploading} title="Scegli dalla galleria">
                      {uploading ? '...' : <ImageIcon size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Back Photo */}
              <div className="panel" style={{ alignSelf: 'start' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Foto Retro</h3>
                {wine.photoBack ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={wine.photoBack}
                      alt="Retro"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}
                      onClick={() => {
                        setFullscreenImages([wine.photo, wine.photoBack].filter(Boolean));
                        setFullscreenIndex(wine.photo ? 1 : 0);
                      }}
                    />
                    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: '0.5rem' }}>
                      <button type="button" className="btn btn-secondary" style={{ padding: '0.5rem', minWidth: 'auto', background: 'white', color: 'black', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRotateImage(wine.photoBack, 'back'); }} title="Ruota 90°"><RotateCw size={16} /></button>
                      <button type="button" className="btn btn-danger" style={{ padding: '0.5rem', minWidth: 'auto', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWine({ ...wine, photoBack: null }); }} title="Elimina foto"><Trash size={16} /></button>
                    </div>
                  </div>
                ) : (
                  <div className="photo-placeholder">
                    <div style={{ textAlign: 'center' }}>
                      <ImageIcon size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                      <p>Nessuna foto retro</p>
                    </div>
                  </div>
                )}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input type="file" accept="image/*" capture="environment" onChange={(e) => handleUpload(e, 'back')} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }} disabled={uploading} />
                    <button className="btn" style={{ width: '100%', border: '1px solid var(--border-color)', justifyContent: 'center', padding: '0.6rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }} disabled={uploading} title="Scatta foto">
                      {uploading ? '...' : <Camera size={20} />}
                    </button>
                  </div>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'back')} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }} disabled={uploading} />
                    <button className="btn" style={{ width: '100%', border: '1px solid var(--border-color)', justifyContent: 'center', padding: '0.6rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }} disabled={uploading} title="Scegli dalla galleria">
                      {uploading ? '...' : <ImageIcon size={20} />}
                    </button>
                  </div>
                </div>
              </div>
              {/* Photo Archive inside Right Column */}
              <div className="panel" style={{ alignSelf: 'start', marginTop: '1rem', padding: '1rem' }}>
                <button
                  className="btn"
                  onClick={(e) => { e.preventDefault(); setShowArchive(!showArchive); }}
                  style={{ width: '100%', justifyContent: 'center', background: 'white', border: '1px solid var(--border-color)', color: 'var(--primary-color)', fontSize: '1rem', padding: '0.75rem' }}
                >
                  <Camera size={18} /> {showArchive ? 'Nascondi Archivio Foto' : 'Apri Archivio Foto'}
                </button>

                {showArchive && (
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>Le foto precedenti vengono archiviate qui. Puoi ripristinarle facilmente.</p>

                    {(!wine.archivedPhotos || wine.archivedPhotos.length === 0) ? (
                      <div style={{ padding: '1rem', textAlign: 'center', background: '#f8fafc', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', color: '#64748b', fontSize: '0.85rem' }}>
                        Nessuna foto in archivio.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
                        {wine.archivedPhotos.map((photo, idx) => (
                          <div key={photo.id || idx} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', background: 'white' }}>
                            <img
                              src={photo.url}
                              alt={`Archivio ${photo.type}`}
                              style={{ width: '100%', height: '100px', objectFit: 'contain', cursor: 'pointer', borderRadius: '4px' }}
                              onClick={() => {
                                setFullscreenImages(wine.archivedPhotos.map(p => p.url));
                                setFullscreenIndex(idx);
                              }}
                            />
                            <div style={{ fontSize: '0.75rem', textAlign: 'center', marginTop: '0.25rem', color: '#64748b', fontWeight: '500' }}>
                              {photo.type}
                            </div>
                            <button
                              className="btn"
                              style={{ width: '100%', marginTop: '0.5rem', padding: '0.2rem', fontSize: '0.75rem', justifyContent: 'center', background: '#f1f5f9', border: '1px solid #cbd5e1' }}
                              onClick={(e) => {
                                e.preventDefault();
                                if (photo.type === 'Retro') {
                                  setWine({ ...wine, photoBack: photo.url });
                                } else {
                                  setWine({ ...wine, photo: photo.url });
                                }
                              }}
                            >
                              Ripristina
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}


        </div>
        {currentUser?.role !== 'viewer' && activeTab === 'riepilogo' && (
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                handleSave(wine, true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
              disabled={uploading || isSaving} 
              style={{ padding: '1rem 3rem', fontSize: '1.1rem', fontWeight: 'bold' }}
            >
              <Save size={20} style={{ marginRight: '0.5rem' }} />
              {isSaving ? 'Salvataggio in corso...' : (unwrappedParams.id === 'new' ? 'Salva Nuovo Vino' : 'Salva Modifiche')}
            </button>
          </div>
        )}
      </main>

      {/* MODAL GESTIONE ELENCHI */}
      {listModal.isOpen && (
        <div className="modal-overlay" onClick={() => setListModal({ isOpen: false, field: '', label: '', options: [] })}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Gestisci {listModal.label}</h2>
              <button type="button" className="btn" onClick={(e) => { e.preventDefault(); setListModal({ isOpen: false, field: '', label: '', options: [] }); }} style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {(listModal.options || []).length === 0 ? (
                <div style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>Nessun elemento presente in elenco.</div>
              ) : (
                (listModal.options || []).map(opt => (
                  <div key={opt} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontWeight: '500' }}>{opt}</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn"
                        title="Seleziona per questo vino"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', background: 'white', border: '1px solid var(--border-color)' }}
                        onClick={(e) => {
                          e.preventDefault();
                          if (listModal.field === 'grapeVarieties') {
                            const newGrapes = [...(wine.grapeVarieties || []), { name: opt, percentage: '' }];
                            setWine({ ...wine, grapeVarieties: newGrapes });
                          } else if (['bottleType', 'reason', 'vendor'].includes(listModal.field)) {
                            setNewMovement({ ...newMovement, [listModal.field]: opt });
                          } else {
                            setWine({ ...wine, [listModal.field]: opt });
                          }
                          setListModal({ isOpen: false, field: '', label: '', options: [] });
                        }}
                      >
                        Seleziona
                      </button>
                      <button
                        className="btn"
                        title="Rinomina globalmente"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', background: 'white', border: '1px solid var(--border-color)' }}
                        onClick={async (e) => {
                          e.preventDefault();
                          const newVal = window.prompt(`Rinomina "${opt}" in tutti i vini:`, opt);
                          if (newVal !== null && newVal.trim() !== '' && newVal !== opt) {
                            try {
                              let res;
                              if (listModal.field === '_initialLocationName') {
                                const locToRename = locations.find(l => l.name === opt);
                                if (!locToRename) return;
                                res = await fetch(`/api/locations/${locToRename.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ name: newVal })
                                });
                                if (res.ok) {
                                  const updated = await res.json();
                                  setLocations(prev => prev.map(l => l.id === updated.id ? updated : l));
                                  if (wine._initialLocationName === opt) {
                                    setWine({ ...wine, _initialLocationName: newVal });
                                  }
                                }
                              } else {
                                res = await fetch('/api/wines/metadata', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ field: listModal.field, oldVal: opt, newVal })
                                });
                              }
                              if (res && res.ok) {
                                customAlert(`\n✅ Aggiornato con successo!\n`);
                                fetchMetadata();
                                setListModal({ isOpen: false, field: '', label: '', options: [] });
                              } else {
                                customAlert('Errore durante la modifica globale.');
                              }
                            } catch (e) {
                              customAlert('Errore di rete.');
                            }
                          }
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-danger"
                        title="Elimina globalmente"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                        onClick={async (e) => {
                          e.preventDefault();
                          if (listModal.field === '_initialLocationName') {
                            const locToDelete = locations.find(l => l.name === opt);
                            if (locToDelete) {
                              setLocationMigration({ isOpen: true, locationToDeleteName: opt, locationToDeleteId: locToDelete.id, migrateToId: '' });
                              setListModal({ isOpen: false, field: '', label: '', options: [] });
                            }
                            return;
                          }
                          if (window.confirm(`Sei sicuro di voler ELIMINARE "${opt}" da tutti i vini?`)) {
                            try {
                              const res = await fetch('/api/wines/metadata', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ field: listModal.field, oldVal: opt, newVal: '' })
                              });
                              if (res.ok) {
                                customAlert(`\n❌ Elemento eliminato con successo!\n`);
                                fetchMetadata();
                                setListModal({ isOpen: false, field: '', label: '', options: [] });
                              } else {
                                customAlert('Errore durante l\'eliminazione globale.');
                              }
                            } catch (e) {
                              customAlert('Errore di rete.');
                            }
                          }
                        }}
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
              onClick={async (e) => {
                e.preventDefault();
                const newVal = window.prompt(`Aggiungi nuovo "${listModal.label}":`);
                if (newVal && newVal.trim() !== '') {
                  if (listModal.field === '_initialLocationName') {
                    try {
                      const locRes = await fetch('/api/locations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newVal.trim() }) });
                      if (locRes.ok) {
                        const newLoc = await locRes.json();
                        setLocations(prev => [...prev, newLoc]);
                        setWine({ ...wine, _initialLocationName: newVal.trim() });
                      } else {
                        customAlert('Errore aggiunta cantina fisica');
                      }
                    } catch (err) {
                      customAlert('Errore di rete.');
                    }
                  } else if (listModal.field === 'grapeVarieties') {
                    const newGrapes = [...(wine.grapeVarieties || []), { name: newVal.trim(), percentage: '' }];
                    setWine({ ...wine, grapeVarieties: newGrapes });
                  } else {
                    setWine({ ...wine, [listModal.field]: newVal.trim() });
                  }
                  setListModal({ isOpen: false, field: '', label: '', options: [] });
                }
              }}
            >
              + Aggiungi Nuovo
            </button>
          </div>
        </div>
      )}

      {/* Modal for Migrating Locations on Delete */}
      {locationMigration.isOpen && (
        <div className="modal-overlay" style={{ zIndex: 1001 }} onClick={() => setLocationMigration({ isOpen: false, locationToDeleteName: '', locationToDeleteId: null, migrateToId: '' })}>
          <div className="modal-content" style={{ maxWidth: '500px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Eliminazione Cantina</h3>
            <p>Stai eliminando la cantina <strong>{locationMigration.locationToDeleteName}</strong>.</p>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>Se questa cantina contiene dei movimenti, puoi scegliere di trasferirli in un'altra cantina. In caso contrario, verranno eliminati definitivamente!</p>

            <div style={{ margin: '1.5rem 0' }}>
              <label>Scegli cantina di destinazione (opzionale):</label>
              <select
                style={{ width: '100%', marginTop: '0.5rem' }}
                value={locationMigration.migrateToId}
                onChange={e => setLocationMigration({ ...locationMigration, migrateToId: e.target.value })}
              >
                <option value="">Nessuna (Elimina tutto)</option>
                {locations.filter(l => l.id !== locationMigration.locationToDeleteId).map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn" style={{ background: '#ddd', color: '#333' }} onClick={() => setLocationMigration({ isOpen: false, locationToDeleteName: '', locationToDeleteId: null, migrateToId: '' })}>
                Annulla
              </button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  if (!locationMigration.migrateToId) {
                    if (!window.confirm(`ATTENZIONE! Non hai selezionato nessuna cantina di destinazione.\nTUTTI i movimenti collegati a ${locationMigration.locationToDeleteName} VERRANNO CANCELLATI IRREVERSIBILMENTE!\n\nVuoi davvero procedere?`)) return;
                  }

                  try {
                    let url = `/api/locations/${locationMigration.locationToDeleteId}`;
                    if (locationMigration.migrateToId) {
                      url += `?migrateToId=${locationMigration.migrateToId}`;
                    }
                    const res = await fetch(url, { method: 'DELETE' });
                    if (res.ok) {
                      customAlert("Cantina eliminata con successo" + (locationMigration.migrateToId ? " e movimenti trasferiti." : "."));
                      setLocations(prev => prev.filter(l => l.id !== locationMigration.locationToDeleteId));
                      if (wine) {
                        const wineRes = await fetch(`/api/wines/${unwrappedParams.id}`);
                        if (wineRes.ok) {
                          const wineData = await wineRes.json();
                          setWine(wineData);
                        }
                      }
                      setLocationMigration({ isOpen: false, locationToDeleteName: '', locationToDeleteId: null, migrateToId: '' });
                    } else {
                      const err = await res.json();
                      customAlert("Errore durante l'eliminazione: " + err.error);
                    }
                  } catch (e) {
                    customAlert("Errore di rete");
                  }
                }}
              >
                {locationMigration.migrateToId ? 'Trasferisci ed Elimina' : 'Elimina Senza Trasferire'}
              </button>
            </div>
          </div>
        </div>
      )}


      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#333', color: '#fff', padding: '12px 24px', borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10000,
          fontWeight: '500', fontSize: '1rem', textAlign: 'center', maxWidth: '90vw'
        }}>
          {toastMessage.replace(/\n/g, '')}
        </div>
      )}


      {promptDialog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10001,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="prompt-dialog-content" style={{
            backgroundColor: '#fff', padding: '24px', borderRadius: '12px',
            maxWidth: '90vw', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0, color: '#333', fontSize: '1.25rem', fontWeight: 'bold' }}>Inserisci dati</h3>
            <p style={{ color: '#555', fontSize: '1.05rem', marginBottom: '16px', lineHeight: '1.5' }}>
              {promptDialog.message}
            </p>
            <input
              type="text"
              autoFocus
              className="form-control"
              list={promptDialog.options ? "prompt-datalist" : undefined}
              style={{ width: '100%', marginBottom: '24px', padding: '10px', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = e.target.value;
                  const action = promptDialog.onConfirm;
                  setPromptDialog(null);
                  action(val);
                }
              }}
              ref={(input) => {
                if (input && !input.value) {
                  // Only set default value once
                  if (promptDialog.defaultValue) {
                    input.value = promptDialog.defaultValue;
                  }
                }
              }}
            />
            {promptDialog.options && (
              <datalist id="prompt-datalist">
                {promptDialog.options.map(o => <option key={o} value={o} />)}
              </datalist>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setPromptDialog(null)}
              >
                Annulla
              </button>
              <button
                className="btn btn-primary"
                onClick={(e) => {
                  const inputEl = e.target.closest('.prompt-dialog-content').querySelector('input');
                  const val = inputEl ? inputEl.value : '';
                  const action = promptDialog.onConfirm;
                  setPromptDialog(null);
                  action(val);
                }}
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmDialog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10001,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#fff', padding: '24px', borderRadius: '12px',
            maxWidth: '90vw', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0, color: '#333', fontSize: '1.25rem', fontWeight: 'bold' }}>Conferma</h3>
            <p style={{ color: '#555', fontSize: '1.05rem', marginBottom: '24px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {confirmDialog.message}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmDialog(null)}
              >
                Annulla
              </button>
              <button
                className="btn btn-primary"
                style={confirmDialog.isDanger ? { backgroundColor: '#ef4444', borderColor: '#ef4444' } : {}}
                onClick={() => {
                  const action = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  action();
                }}
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
