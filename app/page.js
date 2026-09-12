'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { Wine, Search, Plus, Grape, MapPin, Loader2, Camera, FileText, List, FileSpreadsheet, History, ChevronDown, ChevronLeft, ChevronRight, X, Menu, Image as ImageIcon, User, LogOut, Shield, Settings, Mic, HelpCircle, CheckSquare, QrCode } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import * as XLSX from 'xlsx';

import { getCountryFlag, getBadgeClass, correctSpokenWineTranscript, getWineSearchSuggestions } from './utils/wineHelpers';
import { StockCell } from './components/StockCell';
import { MobileCatalog } from './components/MobileCatalog';
import HelpGuideModal from './components/HelpGuideModal';
import GlobalMovementLog from './components/GlobalMovementLog';
import QRCodeModal from '@/components/QRCodeModal';
import QRScannerModal from '@/components/QRScannerModal';

export default function Home() {
  const router = useRouter();
  const [wines, setWines] = useState([]);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrWineModal, setQrWineModal] = useState(null);
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('homeWines');
    }
    return true;
  });
  const [ocrLoading, setOcrLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const searchFromUrl = urlParams.get('search') || urlParams.get('scan') || urlParams.get('q') || urlParams.get('id') || urlParams.get('wine');
      if (searchFromUrl) return searchFromUrl.trim();
      return sessionStorage.getItem('homeSearch') || '';
    }
    return '';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const searchFromUrl = urlParams.get('search') || urlParams.get('scan') || urlParams.get('q') || urlParams.get('id') || urlParams.get('wine');
      if (searchFromUrl) {
        setSearch(searchFromUrl.trim());
      }
    }
  }, []);
  const [expandedGroups, setExpandedGroups] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('homeExpandedGroups');
      if (cached) return JSON.parse(cached);
    }
    return {};
  });
  const [showArchive, setShowArchive] = useState(false);
  const [hoveredPhoto, setHoveredPhoto] = useState(null);
  const [photoPreviewSeconds, setPhotoPreviewSeconds] = useState(3);
  const photoTimerRef = useRef(null);
  const lastPhotoOpenTimeRef = useRef(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = getWineSearchSuggestions(search, wines, 8);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('sidebarCollapsed') === 'true';
    }
    return false;
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('sidebarCollapsed', next ? 'true' : 'false');
      }
      return next;
    });
  };
  const [dbLocations, setDbLocations] = useState([]);

  const [isMobile, setIsMobile] = useState(false);
  const [forceDesktop, setForceDesktop] = useState(false);
  const [isGlobalLogOpen, setIsGlobalLogOpen] = useState(false);
  const [showPdfMenu, setShowPdfMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetch('/api/locations').then(res => res.json()).then(data => {
      if (Array.isArray(data)) {
        setDbLocations(data.map(d => d.name));
      }
    }).catch(console.error);
  }, []);

  const [visitorAllowedFilters, setVisitorAllowedFilters] = useState([
    'country', 'region', 'producerCellar', 'producer',
    'classification', 'category', 'location', 'availability',
    'photo', 'bottleType'
  ]);
  const [visitorAllowedButtons, setVisitorAllowedButtons] = useState([
    'print_scheda', 'print_nazioni', 'print_pdf',
    'export_excel', 'history_log', 'inventory'
  ]);
  const [visitorAllowWineDetails, setVisitorAllowWineDetails] = useState(true);
  const [enableSearchAutocomplete, setEnableSearchAutocomplete] = useState(true);

  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => {
      if (data.visitorAllowedFilters) {
        setVisitorAllowedFilters(data.visitorAllowedFilters);
      }
      if (data.visitorAllowedButtons) {
        setVisitorAllowedButtons(data.visitorAllowedButtons);
      }
      if (data.visitorAllowWineDetails !== undefined) {
        setVisitorAllowWineDetails(data.visitorAllowWineDetails);
      }
      if (data.enableSearchAutocomplete !== undefined) {
        setEnableSearchAutocomplete(data.enableSearchAutocomplete);
      }
      if (data.photoPreviewSeconds) {
        setPhotoPreviewSeconds(data.photoPreviewSeconds);
      }
    }).catch(console.error);
  }, []);

  const canViewButton = (btnId) => {
    if (currentUser?.role === 'admin') return true;
    if (btnId === 'inventory') {
      const invAllowed = currentUser?.canAccessInventory;
      if (invAllowed === 0 || invAllowed === false || invAllowed === '0') return false;
      if (invAllowed === 1 || invAllowed === true || invAllowed === '1') return true;
    }
    return visitorAllowedButtons.includes(btnId);
  };

  const showWinePhotoNearElement = (e, photoUrl) => {
    if (!photoUrl) return;
    if (e && e.stopPropagation) e.stopPropagation();

    const now = Date.now();

    // Prevent Safari touchscreen double-event bug (mouseenter + click firing within 400ms)
    if (hoveredPhoto === photoUrl) {
      if (now - lastPhotoOpenTimeRef.current < 400) {
        return; // Ignore second event fired by touch
      }
      if (photoTimerRef.current) {
        clearTimeout(photoTimerRef.current);
        photoTimerRef.current = null;
      }
      setHoveredPhoto(null);
      return;
    }

    if (photoTimerRef.current) {
      clearTimeout(photoTimerRef.current);
      photoTimerRef.current = null;
    }

    lastPhotoOpenTimeRef.current = now;

    let posX = 0;
    let posY = 0;

    if (e && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      posY = rect.bottom + 12;
      posX = Math.max(10, rect.left + 30);

      if (typeof window !== 'undefined' && posX + 250 > window.innerWidth) {
        posX = Math.max(10, window.innerWidth - 260);
      }
    } else if (e) {
      posX = e.clientX + 30;
      posY = e.clientY + 25;
    }

    setMousePos({ x: posX || 200, y: posY || 200 });
    setHoveredPhoto(photoUrl);

    // Automatically trigger hide timer based on photoPreviewSeconds from settings
    const seconds = photoPreviewSeconds || 3;
    photoTimerRef.current = setTimeout(() => {
      setHoveredPhoto(null);
      photoTimerRef.current = null;
    }, seconds * 1000);
  };

  const startPhotoHideTimerAfterLeave = () => {
    // Kept for mouseleave compatibility, ensures timer continues or refreshes
    if (!photoTimerRef.current && hoveredPhoto) {
      const seconds = photoPreviewSeconds || 3;
      photoTimerRef.current = setTimeout(() => {
        setHoveredPhoto(null);
        photoTimerRef.current = null;
      }, seconds * 1000);
    }
  };

  const [metadata, setMetadata] = useState(null);

  const toggleGroup = (name) => {
    setExpandedGroups(prev => {
      const next = { ...prev, [name]: !prev[name] };
      if (typeof window !== 'undefined') sessionStorage.setItem('homeExpandedGroups', JSON.stringify(next));
      return next;
    });
  };

  const [filters, setFilters] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('homeFilters');
      if (cached) return JSON.parse(cached);
    }
    return {
      country: '', region: '', producerCellar: '', producer: '',
      classification: '', category: '', location: '', availability: '', photo: '', bottleType: ''
    };
  });

  const [sortOrder, setSortOrder] = useState('asc');

  // Resizing state
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e) => {
      if (isResizing) {
        // limit between 250px and 800px or half window width
        setSidebarWidth(Math.max(250, Math.min(800, e.clientX)));
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (!isResizing) return;

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const handleMouseMove = (e) => {
      setSidebarWidth(Math.max(250, Math.min(800, e.clientX)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSpeechSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    }
  }, []);

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Il tuo browser non supporta la ricerca vocale.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'it-IT';
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let rawTranscript = event.results[0][0].transcript;
      if (event.results[0].length > 1) {
        for (let k = 0; k < event.results[0].length; k++) {
          const alt = event.results[0][k].transcript;
          if (alt) {
            rawTranscript = alt;
            break;
          }
        }
      }

      let transcript = correctSpokenWineTranscript(rawTranscript, wines);

      const newFilters = { ...filters };

      const catMap = {
        "bianco": "Bianco",
        "rosso": "Rosso",
        "champagne": "Champagne",
        "passito": "Passito",
        "moscato": "Moscato",
        "rosè": "Rosè",
        "rosé": "Rosè",
        "rose": "Rosè",
        "franciacorta": "Franciacorta",
        "prosecco": "Prosecco",
        "spumante secco": "Spumante Secco",
        "spumante dolce": "Spumante Dolce"
      };

      for (const [key, val] of Object.entries(catMap)) {
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        if (regex.test(transcript)) {
          newFilters.category = val;
          transcript = transcript.replace(regex, '').replace(/\s+/g, ' ').trim();
          break;
        }
      }

      const locMap = {
        "cantina milano": "Cantina Milano",
        "cantina arezzo": "Cantina Arezzo",
        "cantina saint moritz": "Cantina Saint Moritz",
        "cantina levanzo": "Cantina Levanzo"
      };

      for (const [key, val] of Object.entries(locMap)) {
        if (transcript.includes(key)) {
          newFilters.location = val;
          transcript = transcript.replace(key, '').replace(/\s+/g, ' ').trim();
          break;
        }
      }

      setFilters(newFilters);
      setSearch(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Errore riconoscimento vocale:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const [sortConfig, setSortConfig] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('homeSortConfig');
      if (cached) return JSON.parse(cached);
    }
    return { key: 'name', direction: 'asc' };
  });

  const [colWidths, setColWidths] = useState({
    name: 300, totalStock: 150, vintage: 100, country: 200, category: 200, bottleType: 120
  });

  const [activeMenu, setActiveMenu] = useState(null); // 'scheda', 'indice', 'excel'
  const [selectedGroups, setSelectedGroups] = useState([]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.print-menu-container')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Salva i filtri e l'ordinamento in sessionStorage quando cambiano
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('homeFilters', JSON.stringify(filters));
    }
  }, [filters]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('homeSortConfig', JSON.stringify(sortConfig));
    }
  }, [sortConfig]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('homeSearch', search);
    }
    fetchWines();
  }, [search, showArchive]);

  // Ascolta anche i cambiamenti di visibilità della pagina per sicurezza
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && sessionStorage.getItem('homeNeedsRefresh') === 'true') {
        sessionStorage.removeItem('homeNeedsRefresh');
        fetchWines();
      }
    };

    // Controlla anche con un interval per coprire il caso della cache di Next.js
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && sessionStorage.getItem('homeNeedsRefresh') === 'true') {
        sessionStorage.removeItem('homeNeedsRefresh');
        fetchWines();
      }
    }, 500);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    fetchWines();

    // Fetch user info
    fetch('/api/auth/me')
      .then(res => {
        if (res.status === 401) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(err => console.error("Error fetching user:", err));
  }, [router]);

  const fetchWinesRef = useRef();

  // SSE connection for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = (e) => {
      if (e.data === 'update' && fetchWinesRef.current) {
        fetchWinesRef.current();
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await fetch('/api/wines/metadata');
        const data = await res.json();
        if (res.ok) setMetadata(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    const scrollPos = sessionStorage.getItem('homeScrollPos');
    if (scrollPos && wines.length > 0) {
      const y = parseInt(scrollPos, 10);
      requestAnimationFrame(() => {
        window.scrollTo(0, y);
        setTimeout(() => {
          window.scrollTo(0, y);
          sessionStorage.removeItem('homeScrollPos');
        }, 150);
      });
    }
  }, [wines.length]);

  const fetchWines = async () => {
    if (!wines.length) setLoading(true);
    try {
      const res = await fetch(`/api/wines?search=${search}&archived=${showArchive}&t=${Date.now()}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setWines(data);
      } else {
        console.error("API returned error:", data);
        setWines([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWinesRef.current = fetchWines;
    fetchWines();
  }, [search, showArchive]);

  const canViewFilter = (filterId) => {
    if (!currentUser || currentUser.role !== 'viewer') return true;
    return visitorAllowedFilters.includes(filterId);
  };

  const getBadgeClass = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('ross')) return 'badge red';
    if (cat.includes('bianc')) return 'badge white';
    if (cat.includes('bollicin') || cat.includes('champagne')) return 'badge sparkling';
    return 'badge';
  };

  const filteredWines = wines.map(w => {
    let displayStock = w.totalStock;
    if (canViewFilter('location') && filters.location) {
      let stockInLoc = 0;
      for (const m of w.movements) {
        if (m.location?.name === filters.location) {
          if (m.movementType === 'Ingresso') stockInLoc += m.quantity;
          if (m.movementType === 'Uscita') stockInLoc -= m.quantity;
        }
      }
      displayStock = stockInLoc;
    }
    return { ...w, displayStock };
  }).filter(w => {
    // Filtro per testo di ricerca o ID vino da QR code
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      const idMatch = String(w.id) === q;
      const nameMatch = w.name?.toLowerCase().includes(q);
      const producerMatch = (w.producerCellar || w.producer || '')?.toLowerCase().includes(q);
      const vintageMatch = String(w.vintage || '').toLowerCase().includes(q);
      const categoryMatch = w.category?.toLowerCase().includes(q);
      const countryMatch = w.country?.toLowerCase().includes(q);
      const regionMatch = w.region?.toLowerCase().includes(q);
      const classificationMatch = w.classification?.toLowerCase().includes(q);
      if (!idMatch && !nameMatch && !producerMatch && !vintageMatch && !categoryMatch && !countryMatch && !regionMatch && !classificationMatch) {
        return false;
      }
    }

    if (canViewFilter('country') && filters.country && w.country !== filters.country) return false;
    if (canViewFilter('region') && filters.region && w.region !== filters.region) return false;
    if (canViewFilter('producerCellar') && filters.producerCellar && w.producerCellar !== filters.producerCellar) return false;
    if (canViewFilter('producer') && filters.producer && w.producer !== filters.producer) return false;
    if (canViewFilter('classification') && filters.classification && w.classification !== filters.classification) return false;
    if (canViewFilter('category') && filters.category && w.category !== filters.category) return false;

    if (canViewFilter('availability')) {
      if (filters.availability === 'available' && w.displayStock <= 0) return false;
      if (filters.availability === 'unavailable' && w.displayStock > 0) return false;
      if (filters.availability === 'was_in_stock') {
        if (w.displayStock > 0) return false;
        if (!w.movements || w.movements.length === 0) return false;
      }
    }
    if (canViewFilter('location') && filters.location && w.displayStock <= 0 && filters.availability !== 'unavailable' && filters.availability !== 'was_in_stock') return false;

    if (canViewFilter('photo')) {
      if (filters.photo === 'with_photo' && !w.photo) return false;
      if (filters.photo === 'without_photo' && w.photo) return false;
    }

    if (canViewFilter('bottleType') && filters.bottleType) {
      const hasMovementBottle = w.movements && w.movements.some(m => m.bottleType === filters.bottleType);
      if (w.bottleType !== filters.bottleType && !hasMovementBottle) {
        return false;
      }
    }

    return true;
  });

  const groupedMap = new Map();
  for (const w of filteredWines) {
    const cleanName = (w.name || '').trim();
    const groupKey = cleanName.toLowerCase();

    if (!groupedMap.has(groupKey)) {
      groupedMap.set(groupKey, {
        name: cleanName,
        country: w.country || '',
        category: w.category || '',
        producerCellar: w.producerCellar || '',
        displayStock: 0,
        wines: [],
        photo: w.photo,
        id: w.id
      });
    }
    const g = groupedMap.get(groupKey);
    g.wines.push(w);
    g.displayStock += w.displayStock;
    if (!g.country && w.country) g.country = w.country;
    if (!g.category && w.category) g.category = w.category;
    if (!g.photo && w.photo) g.photo = w.photo;
    if (!g.producerCellar && w.producerCellar) g.producerCellar = w.producerCellar;
  }

  const groupedWinesArray = Array.from(groupedMap.values()).sort((a, b) => {
    let valA = a[sortConfig.key] || '';
    let valB = b[sortConfig.key] || '';

    if (sortConfig.key === 'totalStock') {
      valA = a.displayStock || 0;
      valB = b.displayStock || 0;
    }

    if (sortConfig.key === 'vintage') {
      valA = Math.max(...a.wines.map(w => parseInt(w.vintage) || 0));
      valB = Math.max(...b.wines.map(w => parseInt(w.vintage) || 0));
    }

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortConfig.direction === 'asc'
        ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
        : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
    }

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });


  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleResize = (e, colKey) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = colWidths[colKey];

    const onMouseMove = (moveEvent) => {
      const diff = moveEvent.clientX - startX;
      setColWidths(prev => ({
        ...prev,
        [colKey]: Math.max(60, startWidth + diff)
      }));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleVisualSearch = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrLoading(true);

    try {
      // Ridimensiona l'immagine prima dell'upload per evitare che il server si blocchi
      const resizedBlob = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1000;
            const MAX_HEIGHT = 1000;
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
              if (blob) resolve(blob);
              else reject(new Error("Impossibile convertire l'immagine."));
            }, 'image/jpeg', 0.8);
          };
          img.onerror = () => reject(new Error("Formato immagine non valido o file corrotto."));
          img.src = event.target.result;
        };
        reader.onerror = () => reject(new Error("Impossibile leggere il file."));
        reader.readAsDataURL(file);
      });

      const formData = new FormData();
      formData.append('file', resizedBlob, 'image.jpg');

      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (res.ok && (data.text || data.fields?.name)) {
        // Se Gemini ha identificato il nome esatto del vino
        if (data.fields && data.fields.name) {
          const exactName = data.fields.name.trim();
          const pCellar = (data.fields.producerCellar || '').trim();

          // Cerca se esiste già nella cantina locale
          let bestMatch = null;
          let highestScore = 0;

          wines.forEach(wine => {
            let score = 0;
            const wineNameLower = wine.name.toLowerCase();
            const searchNameLower = exactName.toLowerCase();

            if (wineNameLower.includes(searchNameLower) || searchNameLower.includes(wineNameLower)) {
              score += 10;
            }
            if (pCellar && (wine.producerCellar || '').toLowerCase().includes(pCellar.toLowerCase())) {
              score += 5;
            }
            if (score > highestScore) {
              highestScore = score;
              bestMatch = wine;
            }
          });

          if (bestMatch && highestScore >= 5) {
            setSearch(bestMatch.name);
          } else {
            // Se non c'è in cantina, imposta il nome esatto identificato dall'IA
            setSearch(exactName);
          }
        } else {
          // Parole comuni sulle etichette da ignorare se non c'è Gemini
          const blacklist = ['denominazione', 'origine', 'controllata', 'garantita', 'imbottigliato', 'prodotto', 'italia', 'vendemmia', 'cantina', 'annata', 'contiene', 'solfiti', 'volume', 'alcol', 'viticoltori', 'agricola', 'tenuta', 'azienda', 'delle', 'della', 'degli', 'riserva', 'superiore', 'classico', 'docg', 'doc', 'igt'];

          // Pulisce il testo includendo lettere accentate
          const cleanText = (data.text || '').replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ\s]/g, ' ');
          const wordsArray = cleanText.split(/[\s\n]+/).filter(w => w.length > 3 && !blacklist.includes(w.toLowerCase()));

          // Cerca il miglior abbinamento confrontando le parole lette con il database locale
          let bestMatch = null;
          let highestScore = 0;

          wines.forEach(wine => {
            let score = 0;
            const wineString = `${wine.name} ${wine.producer} ${wine.producerCellar || ''}`.toLowerCase();

            wordsArray.forEach(word => {
              if (wineString.includes(word.toLowerCase())) {
                score += word.length;
              }
            });

            if (score > highestScore) {
              highestScore = score;
              bestMatch = wine;
            }
          });

          if (bestMatch && highestScore > 3) {
            setSearch(bestMatch.name);
          } else {
            wordsArray.sort((a, b) => b.length - a.length);
            const bestWord = wordsArray.length > 0 ? wordsArray[0] : '';

            if (bestWord) {
              setSearch(bestWord);
            } else {
              alert('Testo non leggibile o troppo breve, riprova con una foto più nitida.');
            }
          }
        }
      } else {
        alert("Errore nella lettura dell'etichetta. Assicurati che l'immagine sia a fuoco.");
      }
    } catch (error) {
      console.error(error);
      alert(`Errore: ${error.message || "Impossibile elaborare l'immagine"}`);
    } finally {
      setOcrLoading(false);
      // Reset input value so the same file can be selected again
      e.target.value = null;
    }
  };

  const defaultRegions = [
    'Toscana', 'Piemonte', 'Trentino Alto Adige', 'Sicilia',
    'Friuli Venezia Giulia', 'Campania', 'Emilia Romagna',
    'Liguria', 'Veneto', 'Marche', 'Lombardia', 'Sardegna',
    'Umbria', 'Abruzzo', 'Calabria', 'Lazio', 'Basilicata'
  ];

  const uniqueCountries = [...new Set(wines.map(w => w.country).filter(Boolean))].sort();
  const winesForRegion = filters.country ? wines.filter(w => w.country === filters.country) : wines;
  const dbRegions = winesForRegion.map(w => w.region).filter(Boolean);
  const possibleDefaultRegions = (!filters.country || filters.country.toLowerCase() === 'italia') ? defaultRegions : [];
  const uniqueRegions = [...new Set([...possibleDefaultRegions, ...dbRegions])].sort();
  const uniqueProducerCellars = [...new Set(wines.map(w => w.producerCellar).filter(Boolean))].sort();
  const uniqueProducers = [...new Set(wines.map(w => w.producer).filter(Boolean))].sort();
  const uniqueClassifications = [...new Set(wines.map(w => w.classification).filter(Boolean))].sort();
  const uniqueCategories = [...new Set(wines.map(w => w.category).filter(Boolean))].sort();
  const uniqueLocations = [...new Set([...dbLocations, ...wines.flatMap(w => w.movements.map(m => m.location?.name)).filter(Boolean)])].sort();
  const uniqueBottleTypes = [...new Set([
    ...(metadata?.bottleTypes || []),
    ...wines.flatMap(w => w.movements?.map(m => m.bottleType)).filter(Boolean)
  ])].sort();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const userAllowedLocations = (() => {
    if (!currentUser || currentUser.role === 'admin' || !currentUser.allowedLocations || currentUser.allowedLocations === 'ALL') {
      return null;
    }
    try {
      const parsed = JSON.parse(currentUser.allowedLocations);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch(e) {}
    return null;
  })();

  const availableLocations = userAllowedLocations 
    ? uniqueLocations.filter(loc => userAllowedLocations.includes(loc))
    : uniqueLocations;

  const handleWineClick = (wineId) => {
    if (currentUser?.role === 'viewer' && !visitorAllowWineDetails) {
      return;
    }

    sessionStorage.setItem('homeScrollPos', window.scrollY.toString());
    router.push(`/wine/${wineId}`);
  };

  const isVisitorUser = !currentUser || currentUser?.role === 'viewer';
  const shouldShowMobileView = isVisitorUser ? isMobile : (typeof window !== 'undefined' && window.innerWidth < 640);

  if (shouldShowMobileView && !forceDesktop) {
    return (
      <>
        <MobileCatalog
          wines={filteredWines}
          loading={loading}
          search={search}
          setSearch={setSearch}
          filters={filters}
          setFilters={setFilters}
          canViewFilter={canViewFilter}
          canViewButton={canViewButton}
          onWineClick={handleWineClick}
          setForceDesktop={setForceDesktop}
          uniqueCountries={uniqueCountries}
          uniqueRegions={uniqueRegions}
          uniqueProducerCellars={uniqueProducerCellars}
          uniqueProducers={uniqueProducers}
          uniqueClassifications={uniqueClassifications}
          uniqueCategories={uniqueCategories}
          uniqueLocations={uniqueLocations}
          uniqueBottleTypes={uniqueBottleTypes}
          currentUser={currentUser}
          setIsGlobalLogOpen={setIsGlobalLogOpen}
          winesArray={groupedWinesArray}
          enableSearchAutocomplete={enableSearchAutocomplete}
          onOpenQRScanner={() => setShowQRScanner(true)}
        />
        <GlobalMovementLog isOpen={isGlobalLogOpen} onClose={() => setIsGlobalLogOpen(false)} />
        {showQRScanner && (
          <QRScannerModal
            onClose={() => setShowQRScanner(false)}
            onScanSuccess={(wineId) => {
              const foundWine = wines.find(w => String(w.id) === String(wineId));
              if (foundWine) {
                setSearch(foundWine.name);
              } else {
                setSearch(String(wineId));
              }
              setShowQRScanner(false);
            }}
          />
        )}
        {qrWineModal && (
          <QRCodeModal
            wine={qrWineModal}
            onClose={() => setQrWineModal(null)}
          />
        )}
      </>
    );
  }

  return (
    <div className="app-container">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className={`sidebar-backdrop ${isSidebarOpen ? 'show' : ''}`}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {showHelp && <HelpGuideModal onClose={() => setShowHelp(false)} />}

      {/* Sidebar Filters */}
      {!isSidebarCollapsed && (
        <aside
          className={`sidebar ${isSidebarOpen ? 'open' : ''}`}
          style={{ '--sidebar-width': `${sidebarWidth}px` }}
        >
          <div
            onMouseDown={startResizing}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '6px',
              cursor: 'col-resize',
              backgroundColor: isResizing ? 'var(--primary-color)' : 'transparent',
              zIndex: 10
            }}
            className="sidebar-resizer"
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
              onClick={() => {
                setShowArchive(false);
                setSearch('');
                setFilters({
                  country: '',
                  region: '',
                  producerCellar: '',
                  producer: '',
                  classification: '',
                  category: '',
                  location: '',
                  availability: '',
                  photo: '',
                  bottleType: ''
                });
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem('homeFilters');
                  if (window.location.pathname !== '/') {
                    window.location.href = '/';
                  }
                }
              }}
              title="Torna alla Home e resetta filtri"
            >
              <Wine size={28} color="var(--primary-color)" />
              <h2 style={{ margin: 0 }}>{showArchive ? 'ARCHIVIO VINI' : 'CANTINA'}</h2>
            </div>
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: 'pointer',
                padding: '0.3rem 0.5rem',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              title="Chiudi pannello filtri (Nascondi spazietto)"
            >
              <ChevronLeft size={22} color="#0f172a" />
            </button>
          </div>

          <div className="filter-group">
            <label style={search ? { color: '#047857', fontWeight: 'bold' } : {}}>
              {search ? '🟢 ' : ''}Cerca
            </label>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={18} style={{ position: 'absolute', left: 10, top: 11, color: search ? '#10b981' : '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Nome, produttore..."
                  value={search}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowSuggestions(true);
                  }}
                  style={{
                    paddingLeft: '2.25rem',
                    paddingRight: speechSupported ? '3.5rem' : '2.25rem',
                    width: '100%',
                    ...(search ? { backgroundColor: '#ecfdf5', borderColor: '#10b981', color: '#047857', fontWeight: 'bold', boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)' } : {})
                  }}
                />
                {speechSupported && (
                  <button
                    onClick={startVoiceSearch}
                    title="Ricerca vocale"
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '0',
                      cursor: 'pointer',
                      position: 'absolute',
                      right: '2.25rem',
                      top: '11px',
                      color: isListening ? '#ef4444' : '#64748b',
                      animation: isListening ? 'pulse 1.5s infinite' : 'none'
                    }}
                  >
                    <Mic size={18} />
                  </button>
                )}
                {search && (
                  <X
                    size={16}
                    style={{ position: 'absolute', right: 10, top: 12, color: '#94a3b8', cursor: 'pointer' }}
                    onClick={() => {
                      setSearch('');
                      setShowSuggestions(false);
                    }}
                  />
                )}

                {/* Google-style Autocomplete Suggestions Dropdown */}
                {enableSearchAutocomplete !== false && showSuggestions && suggestions.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      backgroundColor: 'white',
                      borderRadius: '10px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
                      border: '1px solid var(--border-color)',
                      maxHeight: '260px',
                      overflowY: 'auto',
                      zIndex: 2000
                    }}
                  >
                    {suggestions.map((s, idx) => (
                      <div
                        key={idx}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSearch(s.text);
                          setShowSuggestions(false);
                        }}
                        style={{
                          padding: '0.6rem 0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer',
                          borderBottom: idx === suggestions.length - 1 ? 'none' : '1px solid #f1f5f9',
                          fontSize: '0.9rem',
                          color: '#0f172a',
                          backgroundColor: 'white'
                        }}
                      >
                        <Wine size={15} color="#8b5cf6" style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: 600 }}>{s.text}</span>
                        {s.subtext && (
                          <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: 'auto' }}>
                            {s.subtext}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {currentUser?.role !== 'viewer' && (
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                  <div style={{ position: 'relative', flex: 1 }} title="Scatta foto all'etichetta per ricerca visiva OCR">
                    <input type="file" accept="image/*" capture="environment" onChange={handleVisualSearch} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }} disabled={ocrLoading} />
                    <button type="button" className="btn" style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border-color)', background: 'white', color: ocrLoading ? '#94a3b8' : 'var(--primary-color)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {ocrLoading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                    </button>
                  </div>
                  {canViewButton('qr_scanner') && (
                    <button
                      type="button"
                      className="btn"
                      onClick={(e) => { e.preventDefault(); setShowQRScanner(true); }}
                      title="Scansiona QR Code / Codice a Barre da fotocamera"
                      style={{
                        flex: 1,
                        padding: '0.625rem',
                        border: '1px solid var(--border-color)',
                        background: 'white',
                        color: 'var(--primary-color)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                        borderRadius: '8px'
                      }}
                    >
                      <QrCode size={18} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {canViewFilter('country') && (
            <div className="filter-group">
              <label style={filters.country ? { color: '#047857', fontWeight: 'bold' } : {}}>
                {filters.country ? '🟢 ' : ''}Nazione
              </label>
              <select
                value={filters.country}
                onChange={e => setFilters({ ...filters, country: e.target.value })}
                style={filters.country ? { backgroundColor: '#ecfdf5', borderColor: '#10b981', color: '#047857', fontWeight: 'bold', boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)' } : {}}
              >
                <option value="">Tutte</option>
                {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {canViewFilter('region') && filters.country && (
            <div className="filter-group">
              <label style={filters.region ? { color: '#047857', fontWeight: 'bold' } : {}}>
                {filters.region ? '🟢 ' : ''}Regione
              </label>
              <select
                value={filters.region}
                onChange={e => setFilters({ ...filters, region: e.target.value })}
                style={filters.region ? { backgroundColor: '#ecfdf5', borderColor: '#10b981', color: '#047857', fontWeight: 'bold', boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)' } : {}}
              >
                <option value="">Tutte</option>
                {uniqueRegions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}

          {canViewFilter('producerCellar') && (
            <div className="filter-group">
              <label style={filters.producerCellar ? { color: '#047857', fontWeight: 'bold' } : {}}>
                {filters.producerCellar ? '🟢 ' : ''}Cantina Produttrice
              </label>
              <select
                value={filters.producerCellar}
                onChange={e => setFilters({ ...filters, producerCellar: e.target.value })}
                style={filters.producerCellar ? { backgroundColor: '#ecfdf5', borderColor: '#10b981', color: '#047857', fontWeight: 'bold', boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)' } : {}}
              >
                <option value="">Tutte</option>
                {uniqueProducerCellars.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}

          {canViewFilter('producer') && (
            <div className="filter-group">
              <label style={filters.producer ? { color: '#047857', fontWeight: 'bold' } : {}}>
                {filters.producer ? '🟢 ' : ''}Produttore
              </label>
              <select
                value={filters.producer}
                onChange={e => setFilters({ ...filters, producer: e.target.value })}
                style={filters.producer ? { backgroundColor: '#ecfdf5', borderColor: '#10b981', color: '#047857', fontWeight: 'bold', boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)' } : {}}
              >
                <option value="">Tutti</option>
                {uniqueProducers.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}

          {canViewFilter('classification') && (
            <div className="filter-group">
              <label style={filters.classification ? { color: '#047857', fontWeight: 'bold' } : {}}>
                {filters.classification ? '🟢 ' : ''}Classificazione
              </label>
              <select
                value={filters.classification}
                onChange={e => setFilters({ ...filters, classification: e.target.value })}
                style={filters.classification ? { backgroundColor: '#ecfdf5', borderColor: '#10b981', color: '#047857', fontWeight: 'bold', boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)' } : {}}
              >
                <option value="">Tutte</option>
                {uniqueClassifications.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {canViewFilter('category') && (
            <div className="filter-group">
              <label style={filters.category ? { color: '#047857', fontWeight: 'bold' } : {}}>
                {filters.category ? '🟢 ' : ''}Categoria
              </label>
              <select
                value={filters.category}
                onChange={e => setFilters({ ...filters, category: e.target.value })}
                style={filters.category ? { backgroundColor: '#ecfdf5', borderColor: '#10b981', color: '#047857', fontWeight: 'bold', boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)' } : {}}
              >
                <option value="">Tutte</option>
                {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {canViewFilter('location') && (
            <div className="filter-group">
              <label style={filters.location ? { color: '#047857', fontWeight: 'bold' } : {}}>
                {filters.location ? '🟢 ' : ''}Cantina Fisica
              </label>
              <select
                value={filters.location}
                onChange={e => setFilters({ ...filters, location: e.target.value })}
                style={filters.location ? { backgroundColor: '#ecfdf5', borderColor: '#10b981', color: '#047857', fontWeight: 'bold', boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)' } : {}}
              >
                <option value="">Tutte</option>
                {availableLocations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          )}

          {canViewFilter('availability') && (
            <div className="filter-group">
              <label style={filters.availability ? { color: '#047857', fontWeight: 'bold' } : {}}>
                {filters.availability ? '🟢 ' : ''}Disponibilità
              </label>
              <select
                value={filters.availability}
                onChange={e => setFilters({ ...filters, availability: e.target.value })}
                style={filters.availability ? { backgroundColor: '#ecfdf5', borderColor: '#10b981', color: '#047857', fontWeight: 'bold', boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)' } : {}}
              >
                <option value="">Tutte</option>
                <option value="available">Solo Disponibili</option>
                <option value="unavailable">Giacenze Non Disponibili</option>
              </select>
            </div>
          )}

          {canViewFilter('photo') && (
            <div className="filter-group">
              <label style={filters.photo ? { color: '#047857', fontWeight: 'bold' } : {}}>
                {filters.photo ? '🟢 ' : ''}Foto
              </label>
              <select
                value={filters.photo || ''}
                onChange={e => setFilters({ ...filters, photo: e.target.value })}
                style={filters.photo ? { backgroundColor: '#ecfdf5', borderColor: '#10b981', color: '#047857', fontWeight: 'bold', boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)' } : {}}
              >
                <option value="">Tutte</option>
                <option value="with_photo">Con Foto</option>
                <option value="without_photo">Senza Foto</option>
              </select>
            </div>
          )}

          {canViewFilter('bottleType') && (
            <div className="filter-group">
              <label style={filters.bottleType ? { color: '#047857', fontWeight: 'bold' } : {}}>
                {filters.bottleType ? '🟢 ' : ''}Tipo Bottiglia
              </label>
              <select
                value={filters.bottleType || ''}
                onChange={e => setFilters({ ...filters, bottleType: e.target.value })}
                style={filters.bottleType ? { backgroundColor: '#ecfdf5', borderColor: '#10b981', color: '#047857', fontWeight: 'bold', boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)' } : {}}
              >
                <option value="">Tutte</option>
                {uniqueBottleTypes.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <button
              className="btn"
              style={{ width: '100%', justifyContent: 'center', background: 'white', border: '1px solid var(--border-color)' }}
              onClick={() => {
                setSearch('');
                setFilters({
                  country: '',
                  region: '',
                  producerCellar: '',
                  producer: '',
                  classification: '',
                  category: '',
                  location: '',
                  availability: '',
                  photo: '',
                  bottleType: ''
                });
                setSelectedGroups([]);
              }}
            >
              🔄 Azzera Filtri
            </button>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              className="btn"
              style={{ width: '100%', justifyContent: 'center', background: showArchive ? 'var(--primary-color)' : 'white', color: showArchive ? 'white' : 'inherit', border: '1px solid var(--border-color)' }}
              onClick={() => {
                setShowArchive(!showArchive);
                setSelectedGroups([]);
              }}
            >
              {showArchive ? '🗄️ Torna alla Cantina' : '🗄️ Vedi Archivio'}
            </button>

            {currentUser?.role === 'admin' && (
              <>
                <button
                  className="btn"
                  style={{ width: '100%', justifyContent: 'center', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onClick={() => router.push('/admin/settings')}
                >
                  <Settings size={18} color="var(--primary-color)" />
                  <span>Impostazioni Visitatore</span>
                </button>
                <button
                  className="btn"
                  style={{ width: '100%', justifyContent: 'center', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onClick={() => router.push('/admin/users')}
                >
                  <Shield size={18} color="var(--primary-color)" />
                  <span>Gestione Utenti</span>
                </button>
              </>
            )}
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        <header className="header">
          <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isSidebarCollapsed && (
              <button
                type="button"
                onClick={toggleSidebarCollapse}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '0.35rem 0.65rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: 'var(--primary-color)',
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}
                title="Apri pannello filtri (Mostra spazietto)"
              >
                <ChevronRight size={20} />
                <span>Filtri</span>
              </button>
            )}
            <button
              className="mobile-menu-btn"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'none' }}
            >
              <Menu size={28} />
            </button>
            <h1
              className="mobile-title"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setShowArchive(false);
                setSearch('');
                setFilters({
                  country: '',
                  region: '',
                  producerCellar: '',
                  producer: '',
                  classification: '',
                  category: '',
                  location: '',
                  availability: '',
                  photo: '',
                  bottleType: ''
                });
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem('homeFilters');
                  if (window.location.pathname !== '/') {
                    window.location.href = '/';
                  }
                }
              }}
              title="Torna alla Home e resetta filtri"
            >
              {showArchive ? 'Archivio' : 'Cantina Vini'}
            </h1>

            {/* Menu Stampe & Export & Cestino */}
            <div className="header-tools">

              {/* Azioni di eliminazione/recupero visibili solo se ci sono elementi selezionati */}
              {currentUser?.role !== 'viewer' && selectedGroups.length > 0 && (
                <>
                  {!showArchive ? (
                    <>
                      <div className="print-menu-container" style={{ cursor: 'pointer' }} onClick={() => {
                        setConfirmDialog({
                          message: `Sei sicuro di voler archiviare i ${selectedGroups.length} vini selezionati? Potrai recuperarli dall'Archivio.`,
                          onConfirm: async () => {
                            const targetIds = groupedWinesArray.filter(g => selectedGroups.map(s => s.trim().toLowerCase()).includes(g.name.trim().toLowerCase())).flatMap(g => g.wines.map(w => w.id));
                            try {
                              const res = await fetch('/api/wines/batch', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'archive', wineIds: targetIds })
                              });
                              if (res.ok) {
                                alert("Vini archiviati con successo!");
                                setSelectedGroups([]);
                                fetchWines();
                              } else {
                                const err = await res.text();
                                alert("Errore durante l'archiviazione: " + err);
                              }
                            } catch (e) { alert('Errore di rete: ' + e.message); }
                          }
                        });
                      }} title="Archivia selezionati">
                        <span style={{ fontSize: '1.3rem' }}>🗄️</span>
                      </div>

                      {selectedGroups.length >= 2 && (
                        <>
                          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 0.5rem' }}></div>

                          <div className="print-menu-container" style={{ cursor: 'pointer' }} onClick={() => {
                            setConfirmDialog({
                              message: `Vuoi UNIFICARE i ${selectedGroups.length} vini selezionati in un'unica scheda principale trasferendo tutte le annate ed i movimenti?`,
                              onConfirm: async () => {
                                const targetIds = groupedWinesArray.filter(g => selectedGroups.map(s => s.trim().toLowerCase()).includes(g.name.trim().toLowerCase())).flatMap(g => g.wines.map(w => w.id));
                                try {
                                  const res = await fetch('/api/wines/batch', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'merge', wineIds: targetIds })
                                  });
                                  if (res.ok) {
                                    alert("Vini unificati ed uniti con successo in un'unica scheda!");
                                    setSelectedGroups([]);
                                    fetchWines();
                                  } else {
                                    const err = await res.text();
                                    alert("Errore durante l'unificazione: " + err);
                                  }
                                } catch (e) { alert('Errore di rete: ' + e.message); }
                              }
                            });
                          }} title="Unisci / Unifica Schede Vino Duplicate">
                            <span style={{ fontSize: '1.3rem' }}>🔗</span>
                          </div>
                        </>
                      )}

                      <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 0.5rem' }}></div>

                      <div className="print-menu-container" style={{ cursor: 'pointer' }} onClick={() => {
                        setConfirmDialog({
                          message: `ATTENZIONE: Sei sicuro di voler ELIMINARE DEFINITIVAMENTE i ${selectedGroups.length} vini selezionati? Questa azione non è reversibile.`,
                          isDanger: true,
                          onConfirm: async () => {
                            const targetIds = groupedWinesArray.filter(g => selectedGroups.map(s => s.trim().toLowerCase()).includes(g.name.trim().toLowerCase())).flatMap(g => g.wines.map(w => w.id));
                            if (targetIds.length === 0) {
                              alert("Nessun vino valido selezionato per l'eliminazione."); return;
                            }
                            try {
                              const res = await fetch('/api/wines/batch', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'delete', wineIds: targetIds })
                              });
                              if (res.ok) {
                                alert("Vini eliminati definitivamente con successo!");
                                setSelectedGroups([]);
                                fetchWines();
                              } else {
                                const err = await res.text();
                                alert("Errore durante l'eliminazione definitiva: " + err);
                              }
                            } catch (e) { alert('Errore di rete: ' + e.message); }
                          }
                        });
                      }} title="Elimina Definitivamente">
                        <span style={{ fontSize: '1.3rem' }}>🗑️</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="print-menu-container" style={{ cursor: 'pointer' }} onClick={() => {
                        setConfirmDialog({
                          message: `Sei sicuro di voler ripristinare i ${selectedGroups.length} vini selezionati? Torneranno in cantina.`,
                          onConfirm: async () => {
                            const targetIds = groupedWinesArray.filter(g => selectedGroups.includes(g.name)).flatMap(g => g.wines.map(w => w.id));
                            try {
                              const res = await fetch('/api/wines/batch', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'restore', wineIds: targetIds })
                              });
                              if (res.ok) {
                                alert("Vini ripristinati con successo!");
                                setSelectedGroups([]);
                                fetchWines();
                              } else {
                                const err = await res.text();
                                alert("Errore durante il ripristino: " + err);
                              }
                            } catch (e) { alert('Errore di rete: ' + e.message); }
                          }
                        });
                      }} title="Ripristina in Cantina">
                        <span style={{ fontSize: '1.3rem' }}>♻️</span>
                      </div>

                      <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 0.5rem' }}></div>

                      <div className="print-menu-container" style={{ cursor: 'pointer' }} onClick={() => {
                        setConfirmDialog({
                          message: `ATTENZIONE: Sei sicuro di voler ELIMINARE DEFINITIVAMENTE i ${selectedGroups.length} vini selezionati? Questa azione non è reversibile.`,
                          isDanger: true,
                          onConfirm: async () => {
                            const targetIds = groupedWinesArray.filter(g => selectedGroups.includes(g.name)).flatMap(g => g.wines.map(w => w.id));
                            if (targetIds.length === 0) {
                              alert("Nessun vino valido selezionato per l'eliminazione."); return;
                            }
                            try {
                              const res = await fetch('/api/wines/batch', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'delete', wineIds: targetIds })
                              });
                              if (res.ok) {
                                alert("Vini eliminati definitivamente con successo!");
                                setSelectedGroups([]);
                                fetchWines();
                              } else {
                                const err = await res.text();
                                alert("Errore durante l'eliminazione definitiva: " + err);
                              }
                            } catch (e) { alert('Errore di rete: ' + e.message); }
                          }
                        });
                      }} title="Elimina Definitivamente">
                        <span style={{ fontSize: '1.3rem' }}>🗑️</span>
                      </div>
                    </>
                  )}
                  <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', marginRight: '0.5rem', marginLeft: '0.5rem' }}></div>
                </>
              )}

              {!showArchive && (
                <>
                  {/* Pulsante SCHEDA */}
                  {canViewButton('print_scheda') && (
                    <div className="print-menu-container" style={{ cursor: 'pointer' }} onClick={() => {
                      try {
                        const targetGroups = selectedGroups.length > 0
                          ? groupedWinesArray.filter(g => selectedGroups.includes(g.name))
                          : groupedWinesArray;

                        if (targetGroups.length === 0) {
                          alert('Nessun vino selezionato o filtrato.');
                          return;
                        }

                        const namesToPrint = targetGroups.map(g => g.name);
                        sessionStorage.setItem('printWineNames', JSON.stringify(namesToPrint));
                        sessionStorage.setItem('printGroupBy', 'filtri_attivi');

                        const newWin = window.open('/print/scheda', '_blank');
                        if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
                          window.location.href = '/print/scheda';
                        }
                      } catch (err) {
                        alert("Errore nell'apertura della stampa: " + err.message);
                      }
                    }} title="Stampa Schede Vino (Copertine da Filtri)">
                      <FileText size={24} color="#475569" />
                    </div>
                  )}

                  {/* Pulsante ELENCO GIACENZE */}
                  {canViewButton('print_nazioni') && (
                    <>
                      <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>
                      <div className="print-menu-container" style={{ cursor: 'pointer' }} onClick={() => {
                        const targetGroups = selectedGroups.length > 0 ? groupedWinesArray.filter(g => selectedGroups.includes(g.name)) : groupedWinesArray;
                        if (targetGroups.length === 0) { alert('Nessun vino selezionato/filtrato.'); return; }
                        sessionStorage.setItem('printWineNames', JSON.stringify(targetGroups.map(g => g.name)));
                        const newWin = window.open('/print/elenco-nazioni', '_blank');
                        if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
                          window.location.href = '/print/elenco-nazioni';
                        }
                      }} title="Elenco giacenze vini per paese">
                        <List size={24} color="#475569" />
                      </div>
                    </>
                  )}

                  {/* Pulsante STAMPA DETTAGLIATA PDF */}
                  {canViewButton('print_pdf') && (
                    <>
                      <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <div className="toolbar-icon" onClick={() => {
                          const targetGroups = selectedGroups.length > 0 ? groupedWinesArray.filter(g => selectedGroups.includes(g.name)) : groupedWinesArray;
                          if (targetGroups.length === 0) { alert('Nessun vino selezionato/filtrato.'); return; }
                          sessionStorage.setItem('printWineNames', JSON.stringify(targetGroups.map(g => g.name)));
                          setShowPdfMenu(!showPdfMenu);
                        }} title="Stampa Elenco Giacenze Dettagliato (PDF)">
                          <FileText size={24} color="#f43f5e" />
                        </div>
                        {showPdfMenu && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginTop: '8px',
                            background: 'white',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                            zIndex: 9999,
                            minWidth: '240px',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                          }}>
                            <div style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                              ORDINA PDF PER:
                            </div>
                            {[
                              { label: 'Nome Vino (A-Z)', sort: 'name' },
                              { label: 'Nazione (A-Z)', sort: 'country' },
                              { label: 'Cantina Produttrice (A-Z)', sort: 'producer' },
                              { label: 'Categoria (A-Z)', sort: 'category' }
                            ].map((opt, idx) => (
                              <div
                                key={idx}
                                style={{ padding: '12px 16px', fontSize: '14px', cursor: 'pointer', borderBottom: idx < 3 ? '1px solid #f1f5f9' : 'none' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                                onClick={() => {
                                  setShowPdfMenu(false);
                                  const newWin = window.open(`/print/giacenze-dettaglio?sort=${opt.sort}`, '_blank');
                                  if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
                                    window.location.href = `/print/giacenze-dettaglio?sort=${opt.sort}`;
                                  }
                                }}
                              >
                                {opt.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Pulsante EXCEL */}
                  {canViewButton('export_excel') && (
                    <>
                      <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>
                      <div className="print-menu-container" style={{ cursor: 'pointer' }} onClick={async () => {
                        const targetGroups = selectedGroups.length > 0 ? groupedWinesArray.filter(g => selectedGroups.includes(g.name)) : groupedWinesArray;
                        if (targetGroups.length === 0) { alert('Nessun vino selezionato/filtrato.'); return; }

                        try {
                          // 1. Fetch locations per colonne dinamiche
                          const res = await fetch('/api/locations');
                          let locationsData = [];
                          if (res.ok) {
                            locationsData = await res.json();
                          }
                          const locNames = locationsData.map(l => l.name);

                          // 2. Prepara le intestazioni (Headers)
                          const headers = [
                            "Nome Vino", "Annata", "Nazione", "Cantina produttore",
                            "Categoria", "Classificazione", "Inventariato", "Disponibile", "Usato"
                          ];
                          locNames.forEach(loc => {
                            const shortName = loc.replace(/cantina /i, '').trim();
                            headers.push(`Disp. ${shortName}`);
                            headers.push(`Usato ${shortName}`);
                          });

                          const dataRows = [headers];

                          // 3. Processa i vini per calcolare giacenze e consumi globali e per sede
                          targetGroups.forEach(g => {
                            g.wines.forEach(w => {
                              let globalIngresso = 0;
                              let globalUscita = 0;

                              const locStats = {};
                              locNames.forEach(loc => {
                                locStats[loc] = { ingresso: 0, uscita: 0 };
                              });

                              if (w.movements && w.movements.length > 0) {
                                w.movements.forEach(m => {
                                  const qty = m.quantity || 0;
                                  const isIngresso = m.movementType === 'Ingresso';
                                  const isUscita = m.movementType === 'Uscita';

                                  if (isIngresso) globalIngresso += qty;
                                  if (isUscita) globalUscita += qty;

                                  if (m.location && m.location.name) {
                                    const lName = m.location.name;
                                    if (locStats[lName]) {
                                      if (isIngresso) locStats[lName].ingresso += qty;
                                      if (isUscita) locStats[lName].uscita += qty;
                                    }
                                  }
                                });
                              }

                              const row = [
                                w.name || "",
                                w.vintage || "",
                                w.country || "",
                                w.producer || "",
                                w.category || "",
                                w.classification || "",
                                globalIngresso,
                                globalIngresso - globalUscita,
                                globalUscita
                              ];

                              locNames.forEach(loc => {
                                const stats = locStats[loc];
                                const disp = stats.ingresso - stats.uscita;
                                row.push(disp === 0 && stats.uscita === 0 && stats.ingresso === 0 ? "" : disp);
                                row.push(stats.uscita === 0 ? "" : stats.uscita);
                              });

                              dataRows.push(row);
                            });
                          });

                          // 4. Crea il foglio Excel
                          const ws = XLSX.utils.aoa_to_sheet(dataRows);

                          // 5. Imposta la larghezza delle colonne e l'orientamento
                          const wscols = [
                            { wch: 32 }, // Nome Vino
                            { wch: 7 },  // Annata
                            { wch: 12 }, // Nazione
                            { wch: 22 }, // Cantina
                            { wch: 12 }, // Categoria
                            { wch: 14 }, // Classificazione
                            { wch: 11 }, // Inventariato
                            { wch: 11 }, // Disponibile
                            { wch: 8 },  // Usato
                          ];
                          locNames.forEach(() => {
                            wscols.push({ wch: 10 }); // Disp Sede
                            wscols.push({ wch: 10 }); // Usato Sede
                          });
                          ws['!cols'] = wscols;

                          // Imposta la pagina A4 in orizzontale
                          ws['!pageSetup'] = { orientation: 'landscape' };

                          const wb = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(wb, ws, "Giacenze");

                          XLSX.writeFile(wb, "Elenco_Giacenze_Vino.xlsx");

                        } catch (e) {
                          console.error("Errore esportazione:", e);
                          alert("Errore durante l'esportazione: " + e.message);
                        }
                      }} title="Esporta in Excel">
                        <FileSpreadsheet size={24} color="#16a34a" />
                      </div>
                    </>
                  )}

                  {canViewButton('history_log') && (
                    <div className="toolbar-icon" onClick={() => setIsGlobalLogOpen(true)} title="Cronologia Movimenti">
                      <History size={24} color="#3b82f6" />
                    </div>
                  )}

                  {canViewButton('inventory') && (
                    <div className="toolbar-icon" onClick={() => router.push('/inventory')} title="Inventario Fisico (Conteggio e Rettifica)">
                      <CheckSquare size={24} color="#10b981" />
                    </div>
                  )}

                  <div className="toolbar-icon" onClick={() => {
                    if (selectedGroups.length > 0) {
                      const targetIds = groupedWinesArray.filter(g => selectedGroups.includes(g.name)).flatMap(g => g.wines.map(w => w.id));
                      if (targetIds.length > 0) {
                        sessionStorage.setItem('selectedWineIds', JSON.stringify(targetIds));
                        router.push(`/print/qr-labels?selected=${encodeURIComponent(targetIds.join(','))}`);
                        return;
                      }
                    }
                    alert("Seleziona prima uno o più vini mettendo la spunta (tik) nella colonna a sinistra, poi clicca sull'icona per stampare le etichette QR Code.");
                  }} title={selectedGroups.length > 0 ? `Stampa Etichette QR Code per i ${selectedGroups.length} vini selezionati (A4)` : "Seleziona i vini con il tik prima di stampare le etichette QR Code"}>
                    <QrCode size={24} color="#6366f1" />
                  </div>

                  <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 0.5rem' }}></div>

                  {!currentUser ? (
                    <button
                      onClick={() => router.push('/login')}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#3b82f6', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
                      title="Effettua il Login con nome utente Adriano"
                    >
                      <User size={16} /> Accedi (Login)
                    </button>
                  ) : (
                    <div className="user-profile-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#f1f5f9', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      <User size={18} color="#64748b" />
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' }}>
                        {currentUser.username}
                      </span>
                    </div>
                  )}

                  {currentUser?.role === 'admin' && (
                    <>
                      <div
                        className="toolbar-icon"
                        onClick={() => router.push('/admin/users')}
                        title="Gestione Utenti e Accessi"
                      >
                        <Shield size={24} color="#0284c7" />
                      </div>
                      <div
                        className="toolbar-icon"
                        onClick={() => router.push('/admin/settings')}
                        title="Impostazioni Visitatore"
                      >
                        <Settings size={24} color="#0284c7" />
                      </div>
                    </>
                  )}

                  <div className="toolbar-icon" style={{ marginLeft: '0.25rem' }} title="Esci dal gestionale" onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/login';
                  }}>
                    <LogOut size={20} color="#ef4444" />
                  </div>
                </>
              )}

            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
            <div style={{ color: '#334155', fontSize: '13px', textAlign: 'right', lineHeight: '1.3', whiteSpace: 'nowrap', background: '#f8fafc', padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div>Etichette Trovate: <strong style={{ color: '#0284c7' }}>{groupedWinesArray.length}</strong></div>
              <div>Selezionate: <strong style={{ color: selectedGroups.length > 0 ? '#16a34a' : '#64748b' }}>{selectedGroups.length}</strong></div>
            </div>

            <button
              className="btn"
              style={{ padding: '0.5rem', background: '#e0f2fe', color: 'var(--primary-color)', border: '1px solid #bae6fd', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setShowHelp(true)}
              title="Guida all'uso"
            >
              <HelpCircle size={22} strokeWidth={2.5} />
            </button>

            {currentUser?.role !== 'viewer' && (
              <button className="btn btn-primary" onClick={() => {
                sessionStorage.setItem('homeScrollPos', window.scrollY.toString());
                router.push('/wine/new');
              }}>
                <Plus size={18} /> Nuovo Vino
              </button>
            )}
          </div>
        </header>

        <div className="table-container" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="empty-state">
              <Loader2 className="animate-spin" size={48} />
              <p>Caricamento cantina in corso...</p>
            </div>
          ) : (
            <table className="data-table" style={{ tableLayout: 'fixed', minWidth: '100%', width: Object.values(colWidths).reduce((a, b) => a + b, 0) + 40 }}>
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={groupedWinesArray.length > 0 && selectedGroups.length === groupedWinesArray.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGroups(groupedWinesArray.map(g => g.name));
                        } else {
                          setSelectedGroups([]);
                        }
                      }}
                    />
                  </th>
                  <th style={{ width: colWidths.name, position: 'relative' }} onClick={() => handleSort('name')}>
                    Nome {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    <div className="resizer" onMouseDown={(e) => handleResize(e, 'name')} />
                  </th>
                  <th style={{ width: colWidths.totalStock, position: 'relative' }} onClick={() => handleSort('totalStock')}>
                    {filters.location ? `Giacenza ${filters.location}` : 'Giacenza Totale'} {sortConfig.key === 'totalStock' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    <div className="resizer" onMouseDown={(e) => handleResize(e, 'totalStock')} />
                  </th>
                  <th style={{ width: colWidths.vintage, position: 'relative' }} onClick={() => handleSort('vintage')}>
                    Anno {sortConfig.key === 'vintage' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    <div className="resizer" onMouseDown={(e) => handleResize(e, 'vintage')} />
                  </th>
                  <th style={{ width: colWidths.country, position: 'relative' }} onClick={() => handleSort('country')}>
                    Nazione {sortConfig.key === 'country' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    <div className="resizer" onMouseDown={(e) => handleResize(e, 'country')} />
                  </th>
                  <th style={{ width: colWidths.category, position: 'relative' }} onClick={() => handleSort('category')}>
                    Categoria {sortConfig.key === 'category' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    <div className="resizer" onMouseDown={(e) => handleResize(e, 'category')} />
                  </th>
                  <th style={{ width: colWidths.bottleType, position: 'relative' }}>
                    Tipo Bottiglia
                    <div className="resizer" onMouseDown={(e) => handleResize(e, 'bottleType')} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {groupedWinesArray.map(group => (
                  <React.Fragment key={group.name}>
                    <tr
                      onClick={() => {
                        if (group.wines.length === 1) {
                          handleWineClick(group.wines[0].id);
                        } else {
                          toggleGroup(group.name);
                        }
                      }}
                      style={{ cursor: 'pointer', background: expandedGroups[group.name] ? '#f8fafc' : (selectedGroups.includes(group.name) ? '#f0f9ff' : 'white') }}
                    >
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedGroups.includes(group.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGroups(prev => [...prev, group.name]);
                            } else {
                              setSelectedGroups(prev => prev.filter(n => n !== group.name));
                            }
                          }}
                        />
                      </td>
                      <td style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          {group.wines.length > 1 ? (
                            <span
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', fontSize: '0.85rem', color: '#475569', cursor: 'pointer', borderRadius: '4px', userSelect: 'none', flexShrink: 0 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleGroup(group.name);
                              }}
                            >
                              {expandedGroups[group.name] ? '▼' : '▶'}
                            </span>
                          ) : (
                            <span style={{ display: 'inline-block', width: '20px', flexShrink: 0 }} />
                          )}
                          <span
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={(e) => showWinePhotoNearElement(e, group.photo)}
                            onMouseLeave={startPhotoHideTimerAfterLeave}
                            onTouchStart={(e) => showWinePhotoNearElement(e, group.photo)}
                            onTouchEnd={startPhotoHideTimerAfterLeave}
                            onClick={(e) => {
                              if (group.wines.length === 1) {
                                handleWineClick(group.wines[0].id);
                              } else {
                                toggleGroup(group.name);
                              }
                            }}
                          >
                            {group.name}
                          </span>
                          {group.wines.length > 1 && <span style={{ fontSize: '0.8rem', color: '#94a3b8', userSelect: 'none' }}>({group.wines.length})</span>}
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()} onMouseEnter={(e) => e.stopPropagation()}>
                        <StockCell winesArray={group.wines} displayStock={group.displayStock} filters={filters} setHoveredPhoto={setHoveredPhoto} />
                      </td>
                      <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {group.wines.length === 1 ? (group.wines[0].vintage || '-') : 'Varie'}
                      </td>
                      <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '1.1rem' }}>{getCountryFlag(group.country)}</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.country || '-'}</span>
                        </div>
                      </td>
                      <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span className={getBadgeClass(group.category)}>
                          {group.category || '-'}
                        </span>
                      </td>
                      <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b', fontSize: '0.9rem' }}>
                        {[...new Set(group.wines.flatMap(w => [w.bottleType, ...(w.movements?.map(m => m.bottleType) || [])]).filter(Boolean))].join(', ') || '0,75 L'}
                      </td>
                    </tr>
                    {expandedGroups[group.name] && group.wines.length > 1 && group.wines.map(wine => (
                      <tr
                        key={wine.id}
                        onClick={() => {
                          handleWineClick(wine.id);
                        }}
                        style={{ background: '#fcfcfc', cursor: 'pointer' }}
                      >
                        <td></td>
                        <td style={{ paddingLeft: '2.5rem', fontSize: '0.9rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span>
                            ↳ {wine.name} {wine.vintage ? `- ${wine.vintage}` : ''}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.9rem', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()} onMouseEnter={(e) => e.stopPropagation()}><StockCell winesArray={[wine]} displayStock={wine.displayStock} filters={filters} setHoveredPhoto={setHoveredPhoto} /></td>
                        <td style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wine.vintage || '-'}</td>
                        <td style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '1.1rem', marginRight: '0.3rem' }}>{getCountryFlag(wine.country)}</span>
                          {wine.country || '-'}
                        </td>
                        <td style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><span className={getBadgeClass(wine.category)}>{wine.category || '-'}</span></td>
                        <td style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }}>
                          {[...new Set([wine.bottleType, ...(wine.movements?.map(m => m.bottleType) || [])].filter(Boolean))].join(', ') || '0,75 L'}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filteredWines.length === 0 && (
            <div className="empty-state">
              <Wine size={48} />
              <h3>Nessun vino trovato</h3>
              <p>Prova a cambiare i filtri di ricerca.</p>
            </div>
          )}
        </div>
      </main>

      {/* Floating Hover / Touch Image */}
      {hoveredPhoto && (
        <div
          onClick={() => {
            if (photoTimerRef.current) {
              clearTimeout(photoTimerRef.current);
              photoTimerRef.current = null;
            }
            setHoveredPhoto(null);
          }}
          style={{
            position: 'fixed',
            top: Math.max(10, mousePos.y),
            left: Math.min((typeof window !== 'undefined' ? window.innerWidth : 1200) - 250, Math.max(10, mousePos.x)),
            zIndex: 9999,
            cursor: 'pointer',
            backgroundColor: 'white',
            padding: '6px',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.4), 0 8px 10px -6px rgba(0,0,0,0.3)',
            border: '2px solid #8b5cf6',
            maxWidth: '240px'
          }}
          title="Clicca per chiudere subito"
        >
          <img src={hoveredPhoto} alt="Anteprima bottiglia" style={{ maxWidth: '220px', maxHeight: '300px', width: 'auto', height: 'auto', borderRadius: '8px', display: 'block', objectFit: 'contain', margin: '0 auto' }} />
        </div>
      )}



      {/* Custom Confirm Dialog */}
      {confirmDialog && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', maxWidth: '400px', width: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, color: confirmDialog.isDanger ? '#ef4444' : '#0f172a' }}>
              {confirmDialog.isDanger ? '⚠️ Attenzione' : 'Conferma Azione'}
            </h3>
            <p style={{ color: '#475569', lineHeight: 1.5, marginBottom: '2rem' }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                className="btn"
                style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}
                onClick={() => setConfirmDialog(null)}>
                Annulla
              </button>
              <button
                className="btn"
                style={{ backgroundColor: confirmDialog.isDanger ? '#ef4444' : '#3b82f6', color: 'white' }}
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}>
                {confirmDialog.isDanger ? 'Sì, Elimina' : 'Conferma'}
              </button>
            </div>
          </div>
        </div>
      )}

      <GlobalMovementLog isOpen={isGlobalLogOpen} onClose={() => setIsGlobalLogOpen(false)} />

      {showQRScanner && (
        <QRScannerModal
          onClose={() => setShowQRScanner(false)}
          onScanSuccess={(wineId) => {
            const foundWine = wines.find(w => String(w.id) === String(wineId));
            if (foundWine) {
              setSearch(foundWine.name);
            } else {
              setSearch(String(wineId));
            }
            setShowQRScanner(false);
          }}
        />
      )}

      {qrWineModal && (
        <QRCodeModal
          wine={qrWineModal}
          onClose={() => setQrWineModal(null)}
        />
      )}
    </div>
  );
}
