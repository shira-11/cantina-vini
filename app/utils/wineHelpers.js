export const getCountryFlag = (country) => {
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

export const getBadgeClass = (category) => {
  if (!category) return 'badge';
  const cat = category.toLowerCase();
  if (cat.includes('ross')) return 'badge red';
  if (cat.includes('bianc')) return 'badge white';
  if (cat.includes('bollicin') || cat.includes('champagne')) return 'badge sparkling';
  return 'badge';
};

export const getCollocationIcon = (collocation) => {
  if (!collocation) return '';
  const c = collocation.toLowerCase().trim();
  if (c.includes('frigo')) return '🧊';
  if (c.includes('scaffal')) return '🧱';
  if (c.includes('carton')) return '📦';
  if (c.includes('cantin')) return '🍷';
  if (c.includes('armadi')) return '🚪';
  if (c.includes('tavol')) return '🪑';
  if (c.includes('cassa')) return '🪵';
  return '📍';
};

export const getStockBreakdown = (winesArray) => {
  if (!winesArray) return [];
  const locMap = {};
  winesArray.forEach(w => {
    if (!w.movements) return;
    w.movements.forEach(m => {
      const locName = m.location?.name || 'Senza Cantina';
      const isDefaultBottle = (bt) => !bt || bt === "0,75 L" || bt === "0.75 L" || bt === "Normale 0.75" || bt === "0,75L";
      const bType = m.bottleType || w.bottleType || '';
      const typeStr = !isDefaultBottle(bType) ? ` (${bType})` : "";
      const label = `${locName}${typeStr}`;
      if (!locMap[label]) locMap[label] = 0;
      if (m.movementType === 'Ingresso') locMap[label] += m.quantity;
      else if (m.movementType === 'Uscita') locMap[label] -= m.quantity;
    });
  });

  return Object.entries(locMap)
    .filter(([_, qty]) => qty > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([loc, qty]) => ({ loc, qty }));
};

export function levenshteinDistance(a, b) {
  if (!a) return b ? b.length : 0;
  if (!b) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function correctSpokenWineTranscript(rawTranscript, winesList = []) {
  if (!rawTranscript) return '';
  let transcript = rawTranscript.toLowerCase().trim();

  // 1. Clean up spoken Italian search prefixes
  transcript = transcript
    .replace(/^(cerca|trova|trovami|mostra|mostrami|fammi vedere|voglio|vorrei)\s+/gi, '')
    .trim();

  // 2. Phonetic Italian Wine Dictionary (common speech-to-text misspellings)
  const phoneticMap = {
    "turiga": "turriga", "torriga": "turriga", "turiga 2008": "turriga 2008",
    "capra": "caprai", "capria": "caprai", "arnaldo capra": "arnaldo caprai",
    "volsem": "volxem", "volksen": "volxem", "folxem": "volxem",
    "sassi caia": "sassicaia", "sassi caja": "sassicaia",
    "tignanelo": "tignanello", "tinanello": "tignanello",
    "ornelaia": "ornellaia", "ornelaja": "ornellaia",
    "brunelo": "brunello", "barolo": "barolo",
    "cannonao": "cannonau", "canonau": "cannonau", "cannona": "cannonau",
    "nuragi": "nuraghi",
    "argiolas": "argiolas", "arjiolas": "argiolas",
    "san giovese": "sangiovese",
    "quintareli": "quintarelli",
    "val policella": "valpolicella",
    "francia corta": "franciacorta",
    "spagnolo": "spagna", "spagnola": "spagna",
    "francese": "francia",
    "tedesco": "germania", "tedesca": "germania",
    "italiano": "italia", "italiana": "italia"
  };

  for (const [misheard, correction] of Object.entries(phoneticMap)) {
    const regex = new RegExp(`\\b${misheard}\\b`, 'gi');
    transcript = transcript.replace(regex, correction);
  }

  // 3. Dynamic Levenshtein fuzzy match spoken tokens against database wine terms
  if (Array.isArray(winesList) && winesList.length > 0) {
    const knownWords = new Set();
    winesList.forEach(w => {
      [w.name, w.producer, w.producerCellar, w.region, w.country, w.classification]
        .filter(Boolean)
        .forEach(field => {
          field.toLowerCase().split(/[\s,/-]+/).forEach(word => {
            if (word.length >= 4) knownWords.add(word);
          });
        });
    });

    const spokenTokens = transcript.split(/\s+/);
    const correctedTokens = spokenTokens.map(token => {
      if (token.length < 4 || knownWords.has(token)) return token;

      let bestMatch = token;
      let minDistance = 3; // Allow max 2 edits

      for (const known of knownWords) {
        if (Math.abs(known.length - token.length) > 2) continue;
        const dist = levenshteinDistance(token, known);
        if (dist < minDistance) {
          minDistance = dist;
          bestMatch = known;
        }
      }
      return bestMatch;
    });

    transcript = correctedTokens.join(' ');
  }

  return transcript;
}

export function getWineSearchSuggestions(searchQuery, winesList = [], maxResults = 8) {
  if (!searchQuery || !searchQuery.trim()) return [];
  const q = searchQuery.toLowerCase().trim();

  const suggestionsMap = new Map();

  for (const w of winesList) {
    if (!w) continue;

    // 1. Check wine name
    if (w.name && w.name.toLowerCase().includes(q)) {
      const key = `wine:${w.name.toLowerCase()}`;
      if (!suggestionsMap.has(key)) {
        suggestionsMap.set(key, {
          text: w.name,
          subtext: w.producer ? `Vino • ${w.producer}` : 'Vino',
          type: 'wine'
        });
      }
    }

    // 2. Check producer
    if (w.producer && w.producer.toLowerCase().includes(q)) {
      const key = `producer:${w.producer.toLowerCase()}`;
      if (!suggestionsMap.has(key)) {
        suggestionsMap.set(key, {
          text: w.producer,
          subtext: 'Produttore',
          type: 'producer'
        });
      }
    }

    // 3. Check producerCellar
    if (w.producerCellar && w.producerCellar.toLowerCase().includes(q)) {
      const key = `cellar:${w.producerCellar.toLowerCase()}`;
      if (!suggestionsMap.has(key)) {
        suggestionsMap.set(key, {
          text: w.producerCellar,
          subtext: 'Cantina Produttrice',
          type: 'cellar'
        });
      }
    }

    // 4. Check region
    if (w.region && w.region.toLowerCase().includes(q)) {
      const key = `region:${w.region.toLowerCase()}`;
      if (!suggestionsMap.has(key)) {
        suggestionsMap.set(key, {
          text: w.region,
          subtext: 'Regione',
          type: 'region'
        });
      }
    }

    if (suggestionsMap.size >= maxResults * 2) break;
  }

  return Array.from(suggestionsMap.values()).slice(0, maxResults);
}
