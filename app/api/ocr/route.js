import { NextResponse } from 'next/server';

function isCleanLine(line) {
  if (!line || typeof line !== 'string') return false;
  if (line.includes('\\') || line.includes('{') || line.includes('}') || line.includes('|') || line.includes('~')) return false;
  const letters = line.match(/[a-zA-Zàèéìòùáéíóúäöü]/g) || [];
  if (letters.length < 3) return false;
  return true;
}

function parseWineFieldsFromText(rawText) {
  if (!rawText || typeof rawText !== 'string') return {};

  const lines = rawText.split('\n').map(l => l.trim()).filter(l => isCleanLine(l));
  const textUpper = rawText.toUpperCase();

  const fields = {
    name: '',
    vintage: '',
    country: 'Italia',
    region: '',
    producerCellar: '',
    producer: '',
    classification: '',
    category: 'Vino Rosso',
    type: 'Secco',
    alcohol: '',
    grapeVarieties: [],
    notes: ''
  };

  // 1. Annata (Vintage)
  const vintageMatch = rawText.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
  if (vintageMatch) {
    fields.vintage = vintageMatch[1];
  }

  // 2. Grado Alcolico
  const alcMatch = rawText.match(/(\d{1,2}[\.,]?\d?)\s*%\s*(vol)?/i);
  if (alcMatch) {
    fields.alcohol = alcMatch[1].replace(',', '.');
  }

  // 3. Nazione
  if (textUpper.includes('FRANCIA') || textUpper.includes('FRANCE') || textUpper.includes('BORDEAUX') || textUpper.includes('CHAMPAGNE') || textUpper.includes('BOURGOGNE')) {
    fields.country = 'Francia';
  } else if (textUpper.includes('SPAGNA') || textUpper.includes('RIOJA')) {
    fields.country = 'Spagna';
  } else if (textUpper.includes('GERMANIA') || textUpper.includes('MOSELLA')) {
    fields.country = 'Germania';
  } else {
    fields.country = 'Italia';
  }

  // 4. Regione
  const regionsList = [
    'Friuli-Venezia Giulia', 'Friuli', 'Piemonte', 'Toscana', 'Veneto', 'Lombardia', 'Sicilia', 'Sardegna',
    'Puglia', 'Emilia-Romagna', 'Campania', 'Trentino-Alto Adige', 'Abruzzo', 'Umbria', 'Marche', 'Basilicata',
    'Calabria', 'Liguria', 'Molise', 'Valle d\'Aosta'
  ];
  for (const reg of regionsList) {
    if (textUpper.includes(reg.toUpperCase())) {
      fields.region = reg === 'Friuli' ? 'Friuli-Venezia Giulia' : reg;
      break;
    }
  }

  // 5. Classificazione
  if (textUpper.includes('DOCG') || textUpper.includes('DENOMINAZIONE DI ORIGINE CONTROLLATA E GARANTITA')) {
    fields.classification = 'DOCG';
  } else if (textUpper.includes('DOC') || textUpper.includes('DENOMINAZIONE DI ORIGINE CONTROLLATA')) {
    fields.classification = 'DOC';
  } else if (textUpper.includes('IGT') || textUpper.includes('INDICAZIONE GEOGRAFICA TIPICA')) {
    fields.classification = 'IGT';
  } else if (textUpper.includes('AOC')) {
    fields.classification = 'AOC';
  } else if (textUpper.includes('DOP')) {
    fields.classification = 'DOP';
  } else if (textUpper.includes('IGP')) {
    fields.classification = 'IGP';
  }

  // 6. Categoria
  if (textUpper.includes('CHAMPAGNE') || textUpper.includes('SPUMANTE') || textUpper.includes('PROSECCO') || textUpper.includes('FRANCIACORTA') || textUpper.includes('BRUT')) {
    fields.category = 'Spumante';
    fields.type = textUpper.includes('EXTRA DRY') ? 'Extra Dry' : 'Brut';
  } else if (textUpper.includes('BIANCO') || textUpper.includes('WHITE') || textUpper.includes('CHARDONNAY') || textUpper.includes('SAUVIGNON') || textUpper.includes('VERMENTINO') || textUpper.includes('PINOT GRIGIO') || textUpper.includes('GEWÜRZTRAMINER') || textUpper.includes('FRIULANO') || textUpper.includes('RIBOLLA')) {
    fields.category = 'Vino Bianco';
  } else if (textUpper.includes('ROSATO') || textUpper.includes('ROSÉ') || textUpper.includes('ROSE')) {
    fields.category = 'Vino Rosato';
  } else if (textUpper.includes('DOLCE') || textUpper.includes('MOSCATO') || textUpper.includes('PASSITO')) {
    fields.category = 'Vino Dolce / Passito';
    fields.type = 'Dolce';
  } else {
    fields.category = 'Vino Rosso';
  }

  // 7. Estrazione Vitigni dal testo
  const knownGrapes = [
    'Friulano', 'Ribolla Gialla', 'Malvasia', 'Nebbiolo', 'Sangiovese', 'Corvina', 'Rondinella',
    'Barbera', 'Dolcetto', 'Primitivo', 'Nero d\'Avola', 'Cannonau', 'Vermentino', 'Glera',
    'Chardonnay', 'Pinot Nero', 'Pinot Noir', 'Pinot Grigio', 'Cabernet Sauvignon', 'Cabernet Franc',
    'Merlot', 'Syrah', 'Sauvignon', 'Moscato', 'Montepulciano', 'Aglianico', 'Refosco'
  ];

  for (const g of knownGrapes) {
    if (textUpper.includes(g.toUpperCase())) {
      if (!fields.grapeVarieties.some(v => v.name === g)) {
        fields.grapeVarieties.push({ name: g, percentage: null });
      }
    }
  }

  // 8. Estrazione Nome e Produttore dalle righe pulite dell'etichetta
  if (lines.length > 0) {
    const validLines = lines.filter(l => {
      const u = l.toUpperCase();
      return !u.includes('PRODOTTO IN') && !u.includes('CONTIENE') && !u.includes('SOLFITI') && !u.includes('VOL') && !u.includes('ITALIA') && !u.match(/^\d+$/);
    });

    if (validLines.length > 0) {
      // Se abbiamo più righe, solitamente la riga più evidente o prima è il nome o produttore
      fields.name = validLines[0];
      if (validLines.length > 1) {
        fields.producerCellar = validLines[1];
        fields.producer = validLines[1];
      }
    }
  }

  return fields;
}

// Ricerca Automatica ed Autonoma su Internet (Wikipedia & DuckDuckGo Web Search)
async function searchInternetForWine(query) {
  try {
    if (!query || typeof query !== 'string') return null;

    const cleanQuery = query
      .replace(/[^\w\sàèéìòùáéíóú]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanQuery.length < 3) return null;

    let combinedText = '';

    // DuckDuckGo Search API per schede vini online
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery + ' vino scheda tecnica vitigno produttore')}`;
    const ddgRes = await fetch(ddgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (ddgRes.ok) {
      const html = await ddgRes.text();
      const snippets = [];
      const regex = /<a class="result__snippet[^"]*"[^>]*>(.*?)<\/a>/g;
      let match;
      while ((match = regex.exec(html)) !== null) {
        snippets.push(match[1].replace(/<[^>]+>/g, ''));
      }
      combinedText += ' ' + snippets.join(' ');
    }

    // Wikipedia Italia Search API
    const wikiUrl = `https://it.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery + ' vino')}&format=json&origin=*`;
    const wikiRes = await fetch(wikiUrl, { headers: { 'User-Agent': 'WineApp/1.0' } });
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      const firstHit = wikiData?.query?.search?.[0];
      if (firstHit && firstHit.title) {
        const pageUrl = `https://it.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(firstHit.title)}&format=json&origin=*`;
        const pageRes = await fetch(pageUrl, { headers: { 'User-Agent': 'WineApp/1.0' } });
        if (pageRes.ok) {
          const pageData = await pageRes.json();
          const pages = pageData?.query?.pages;
          if (pages) {
            const pageObj = Object.values(pages)[0];
            if (pageObj && pageObj.extract) {
              combinedText += ' ' + pageObj.extract;
            }
          }
        }
      }
    }

    if (!combinedText.trim()) return null;
    return parseWineFieldsFromText(cleanQuery + ' ' + combinedText);
  } catch (err) {
    console.warn("Autonomous Internet search error:", err);
    return null;
  }
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let text = '';

    if (contentType.includes('application/json')) {
      const json = await request.json();
      text = json.text || '';
    } else {
      const formData = await request.formData();
      const file = formData.get('file');

      if (file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        try {
          const TesseractModule = await import('tesseract.js');
          const Tesseract = TesseractModule.default || TesseractModule;
          const { data } = await Tesseract.recognize(buffer, 'ita+eng');
          text = data?.text || '';
        } catch (tessErr) {
          console.warn("Server Tesseract error:", tessErr);
        }
      }
    }

    // 1. Estrazione iniziale dal testo OCR dell'immagine
    let fields = parseWineFieldsFromText(text);

    // 2. Se l'estrazione iniziale è parziale, esegui la RICERCA INTERNET AUTONOMA in tempo reale!
    if (text && text.trim().length > 3) {
      const onlineFields = await searchInternetForWine(text);
      if (onlineFields) {
        fields = {
          name: fields.name || onlineFields.name,
          vintage: fields.vintage || onlineFields.vintage,
          country: fields.country || onlineFields.country || 'Italia',
          region: fields.region || onlineFields.region,
          producerCellar: fields.producerCellar || onlineFields.producerCellar,
          producer: fields.producer || onlineFields.producer,
          classification: fields.classification || onlineFields.classification,
          category: fields.category || onlineFields.category,
          type: fields.type || onlineFields.type,
          alcohol: fields.alcohol || onlineFields.alcohol,
          grapeVarieties: (fields.grapeVarieties && fields.grapeVarieties.length > 0) ? fields.grapeVarieties : (onlineFields.grapeVarieties || []),
          notes: fields.notes || onlineFields.notes
        };
      }
    }

    return NextResponse.json({
      text,
      fields,
      isUnclear: !fields.name && !fields.vintage
    });
  } catch (error) {
    console.error('OCR Error:', error);
    return NextResponse.json({
      error: 'Failed to process image',
      text: '',
      fields: {
        name: '',
        vintage: '',
        country: 'Italia',
        region: '',
        producerCellar: '',
        producer: '',
        classification: '',
        category: 'Vino Rosso',
        type: 'Secco',
        alcohol: '',
        grapeVarieties: [],
        notes: ''
      },
      isUnclear: true
    });
  }
}
