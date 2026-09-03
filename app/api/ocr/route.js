import { NextResponse } from 'next/server';

function parseWineFieldsFromText(rawText) {
  if (!rawText || typeof rawText !== 'string') return {};

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
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

  // 1. Vintage (Annata) - cerca un anno a 4 cifre tra 1950 e 2030
  const vintageMatch = rawText.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
  if (vintageMatch) {
    fields.vintage = vintageMatch[1];
  }

  // 2. Grado alcolico (es. 13.5% vol, 14% vol, 13,5% vol)
  const alcMatch = rawText.match(/(\d{1,2}[\.,]?\d?)\s*%\s*(vol)?/i);
  if (alcMatch) {
    fields.alcohol = alcMatch[1].replace(',', '.');
  }

  // 3. Classificazione (DOCG, DOC, IGT, DOP, IGP, VdT)
  if (textUpper.includes('DOCG') || textUpper.includes('DENOMINAZIONE DI ORIGINE CONTROLLATA E GARANTITA')) {
    fields.classification = 'DOCG';
  } else if (textUpper.includes('DOC') || textUpper.includes('DENOMINAZIONE DI ORIGINE CONTROLLATA')) {
    fields.classification = 'DOC';
  } else if (textUpper.includes('IGT') || textUpper.includes('INDICAZIONE GEOGRAFICA TIPICA')) {
    fields.classification = 'IGT';
  } else if (textUpper.includes('DOP')) {
    fields.classification = 'DOP';
  } else if (textUpper.includes('IGP')) {
    fields.classification = 'IGP';
  }

  // 4. Regione e Nazione
  const regionsList = [
    'Piemonte', 'Toscana', 'Veneto', 'Lombardia', 'Sicilia', 'Sardegna',
    'Puglia', 'Emilia-Romagna', 'Campania', 'Friuli-Venezia Giulia',
    'Trentino-Alto Adige', 'Abruzzo', 'Umbria', 'Marche', 'Basilicata',
    'Calabria', 'Liguria', 'Molise', 'Valle d\'Aosta'
  ];
  for (const reg of regionsList) {
    if (textUpper.includes(reg.toUpperCase())) {
      fields.region = reg;
      fields.country = 'Italia';
      break;
    }
  }

  // 5. Categoria (Vino Rosso, Vino Bianco, Spumante, Rosato, ecc.)
  if (textUpper.includes('CHAMPAGNE') || textUpper.includes('SPUMANTE') || textUpper.includes('PROSECCO') || textUpper.includes('FRANCIACORTA') || textUpper.includes('BRUT')) {
    fields.category = 'Spumante';
  } else if (textUpper.includes('BIANCO') || textUpper.includes('WHITE') || textUpper.includes('CHARDONNAY') || textUpper.includes('SAUVIGNON') || textUpper.includes('VERMENTINO') || textUpper.includes('PINOT GRIGIO') || textUpper.includes('GEWÜRZTRAMINER')) {
    fields.category = 'Vino Bianco';
  } else if (textUpper.includes('ROSATO') || textUpper.includes('ROSÉ') || textUpper.includes('ROSE')) {
    fields.category = 'Vino Rosato';
  } else if (textUpper.includes('DOLCE') || textUpper.includes('MOSCATO') || textUpper.includes('PASSITO')) {
    fields.category = 'Vino Dolce / Passito';
    fields.type = 'Dolce';
  } else {
    fields.category = 'Vino Rosso';
  }

  // 6. Nomi di vini e vitigni noti
  const knownWines = [
    'Barolo', 'Barbaresco', 'Brunello di Montalcino', 'Amarone', 'Chianti', 'Chianti Classico',
    'Sassicaia', 'Tignanello', 'Ornellaia', 'Bolgheri', 'Ripasso', 'Valpolicella',
    'Nebbiolo', 'Barbera', 'Dolcetto', 'Sangiovese', 'Primitivo', 'Nero d\'Avola',
    'Pinot Nero', 'Pinot Noir', 'Syrah', 'Merlot', 'Cabernet Sauvignon', 'Gattinara',
    'Morellino di Scansano', 'Montepulciano d\'Abruzzo', 'Lugana', 'Franciacorta', 'Prosecco'
  ];

  for (const wName of knownWines) {
    if (textUpper.includes(wName.toUpperCase())) {
      if (!fields.name) fields.name = wName;
      if (['Nebbiolo', 'Barbera', 'Dolcetto', 'Sangiovese', 'Primitivo', 'Pinot Nero', 'Merlot', 'Syrah', 'Chardonnay', 'Vermentino'].includes(wName)) {
        fields.grapeVarieties.push({ name: wName, percentage: '' });
      }
    }
  }

  // Se il nome è ancora vuoto, prendi la prima riga significativa
  if (!fields.name && lines.length > 0) {
    const candidateLines = lines.filter(l => {
      const u = l.toUpperCase();
      return !u.includes('PRODOTTO IN ITALIA') && !u.includes('CONTIENE SOLFITI') && !u.includes('VOL') && !u.match(/^\d+$/);
    });
    if (candidateLines.length > 0) {
      fields.name = candidateLines[0];
    }
  }

  return fields;
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

    const fields = parseWineFieldsFromText(text);

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
