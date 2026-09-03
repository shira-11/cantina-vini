import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const WINE_KNOWLEDGE_BASE = [
  {
    keywords: ['BAROLO'],
    data: {
      name: 'Barolo Riserva',
      country: 'Italia',
      region: 'Piemonte',
      classification: 'DOCG',
      category: 'Vino Rosso',
      type: 'Secco',
      alcoholContent: 14,
      tempMin: 18,
      tempMax: 20,
      producerCellar: 'Marchesi di Barolo',
      producer: 'Gaja',
      grapeVarieties: [{ name: 'Nebbiolo', percentage: 100 }]
    }
  },
  {
    keywords: ['BARBARESCO'],
    data: {
      name: 'Barbaresco',
      country: 'Italia',
      region: 'Piemonte',
      classification: 'DOCG',
      category: 'Vino Rosso',
      type: 'Secco',
      alcoholContent: 14,
      tempMin: 18,
      tempMax: 20,
      producerCellar: 'Produttori del Barbaresco',
      producer: 'Gaja',
      grapeVarieties: [{ name: 'Nebbiolo', percentage: 100 }]
    }
  },
  {
    keywords: ['BRUNELLO', 'MONTALCINO'],
    data: {
      name: 'Brunello di Montalcino',
      country: 'Italia',
      region: 'Toscana',
      classification: 'DOCG',
      category: 'Vino Rosso',
      type: 'Secco',
      alcoholContent: 14.5,
      tempMin: 18,
      tempMax: 20,
      producerCellar: 'Biondi Santi',
      producer: 'Banfi',
      grapeVarieties: [{ name: 'Sangiovese', percentage: 100 }]
    }
  },
  {
    keywords: ['CHIANTI'],
    data: {
      name: 'Chianti Classico',
      country: 'Italia',
      region: 'Toscana',
      classification: 'DOCG',
      category: 'Vino Rosso',
      type: 'Secco',
      alcoholContent: 13.5,
      tempMin: 16,
      tempMax: 18,
      producerCellar: 'Antinori',
      producer: 'Marchesi Antinori',
      grapeVarieties: [{ name: 'Sangiovese', percentage: 80 }, { name: 'Canaiolo', percentage: 20 }]
    }
  },
  {
    keywords: ['AMARONE', 'VALPOLICELLA'],
    data: {
      name: 'Amarone della Valpolicella',
      country: 'Italia',
      region: 'Veneto',
      classification: 'DOCG',
      category: 'Vino Rosso',
      type: 'Secco',
      alcoholContent: 15.5,
      tempMin: 18,
      tempMax: 20,
      producerCellar: 'Masi',
      producer: 'Allegrini',
      grapeVarieties: [{ name: 'Corvina', percentage: 70 }, { name: 'Rondinella', percentage: 25 }]
    }
  },
  {
    keywords: ['SASSICAIA', 'TENUTA SAN GUIDO'],
    data: {
      name: 'Sassicaia',
      country: 'Italia',
      region: 'Toscana',
      classification: 'DOCG',
      category: 'Vino Rosso',
      type: 'Secco',
      alcoholContent: 14,
      tempMin: 18,
      tempMax: 20,
      producerCellar: 'Tenuta San Guido',
      producer: 'Tenuta San Guido',
      grapeVarieties: [{ name: 'Cabernet Sauvignon', percentage: 85 }, { name: 'Cabernet Franc', percentage: 15 }]
    }
  },
  {
    keywords: ['TIGNANELLO'],
    data: {
      name: 'Tignanello',
      country: 'Italia',
      region: 'Toscana',
      classification: 'IGT',
      category: 'Vino Rosso',
      type: 'Secco',
      alcoholContent: 14,
      tempMin: 18,
      tempMax: 20,
      producerCellar: 'Antinori',
      producer: 'Marchesi Antinori',
      grapeVarieties: [{ name: 'Sangiovese', percentage: 80 }, { name: 'Cabernet Sauvignon', percentage: 15 }]
    }
  },
  {
    keywords: ['FRANCIACORTA', 'BELLAVISTA', 'CA\' DEL BOSCO'],
    data: {
      name: 'Franciacorta Brut',
      country: 'Italia',
      region: 'Lombardia',
      classification: 'DOCG',
      category: 'Spumante',
      type: 'Brut',
      alcoholContent: 12.5,
      tempMin: 6,
      tempMax: 8,
      producerCellar: 'Ca\' del Bosco',
      producer: 'Ca\' del Bosco',
      grapeVarieties: [{ name: 'Chardonnay', percentage: 80 }, { name: 'Pinot Nero', percentage: 20 }]
    }
  },
  {
    keywords: ['PROSECCO'],
    data: {
      name: 'Prosecco Superiore Valdobbiadene',
      country: 'Italia',
      region: 'Veneto',
      classification: 'DOCG',
      category: 'Spumante',
      type: 'Extra Dry',
      alcoholContent: 11.5,
      tempMin: 6,
      tempMax: 8,
      producerCellar: 'Bisol',
      producer: 'Bisol',
      grapeVarieties: [{ name: 'Glera', percentage: 100 }]
    }
  },
  {
    keywords: ['VERMENTINO'],
    data: {
      name: 'Vermentino di Sardegna',
      country: 'Italia',
      region: 'Sardegna',
      classification: 'DOC',
      category: 'Vino Bianco',
      type: 'Secco',
      alcoholContent: 13,
      tempMin: 10,
      tempMax: 12,
      producerCellar: 'Argiolas',
      producer: 'Argiolas',
      grapeVarieties: [{ name: 'Vermentino', percentage: 100 }]
    }
  },
  {
    keywords: ['TURRIGA'],
    data: {
      name: 'Turriga',
      country: 'Italia',
      region: 'Sardegna',
      classification: 'IGT',
      category: 'Vino Rosso',
      type: 'Secco',
      alcoholContent: 14.5,
      tempMin: 18,
      tempMax: 20,
      producerCellar: 'Argiolas',
      producer: 'Argiolas',
      grapeVarieties: [{ name: 'Cannonau', percentage: 85 }, { name: 'Carignano', percentage: 15 }]
    }
  },
  {
    keywords: ['NERO D\'AVOLA'],
    data: {
      name: 'Nero d\'Avola',
      country: 'Italia',
      region: 'Sicilia',
      classification: 'DOC',
      category: 'Vino Rosso',
      type: 'Secco',
      alcoholContent: 13.5,
      tempMin: 16,
      tempMax: 18,
      producerCellar: 'Donnafugata',
      producer: 'Planeta',
      grapeVarieties: [{ name: 'Nero d\'Avola', percentage: 100 }]
    }
  },
  {
    keywords: ['PINOT NERO', 'PINOT NOIR', 'PESCHIERA'],
    data: {
      name: 'Pinot Nero',
      country: 'Italia',
      region: 'Trentino-Alto Adige',
      classification: 'DOC',
      category: 'Vino Rosso',
      type: 'Secco',
      alcoholContent: 13.5,
      tempMin: 16,
      tempMax: 18,
      producerCellar: 'Elena Walch',
      producer: 'Elena Walch',
      grapeVarieties: [{ name: 'Pinot Nero', percentage: 100 }]
    }
  },
  {
    keywords: ['PRIMITIVO', 'MANDURIA'],
    data: {
      name: 'Primitivo di Manduria',
      country: 'Italia',
      region: 'Puglia',
      classification: 'DOC',
      category: 'Vino Rosso',
      type: 'Secco',
      alcoholContent: 14.5,
      tempMin: 18,
      tempMax: 20,
      producerCellar: 'San Marzano',
      producer: 'San Marzano',
      grapeVarieties: [{ name: 'Primitivo', percentage: 100 }]
    }
  },
  {
    keywords: ['NEBBIOLO'],
    data: {
      name: 'Nebbiolo d\'Alba',
      country: 'Italia',
      region: 'Piemonte',
      classification: 'DOC',
      category: 'Vino Rosso',
      type: 'Secco',
      alcoholContent: 13.5,
      tempMin: 16,
      tempMax: 18,
      producerCellar: 'Vietti',
      producer: 'Vietti',
      grapeVarieties: [{ name: 'Nebbiolo', percentage: 100 }]
    }
  },
  {
    keywords: ['BARBERA'],
    data: {
      name: 'Barbera d\'Asti',
      country: 'Italia',
      region: 'Piemonte',
      classification: 'DOCG',
      category: 'Vino Rosso',
      type: 'Secco',
      alcoholContent: 13.5,
      tempMin: 16,
      tempMax: 18,
      producerCellar: 'Braida',
      producer: 'Braida',
      grapeVarieties: [{ name: 'Barbera', percentage: 100 }]
    }
  },
  {
    keywords: ['LUGANA'],
    data: {
      name: 'Lugana',
      country: 'Italia',
      region: 'Lombardia',
      classification: 'DOC',
      category: 'Vino Bianco',
      type: 'Secco',
      alcoholContent: 13,
      tempMin: 10,
      tempMax: 12,
      producerCellar: 'Cà dei Frati',
      producer: 'Cà dei Frati',
      grapeVarieties: [{ name: 'Turbiana', percentage: 100 }]
    }
  }
];

function extractFieldsFromOnlineText(query, rawText) {
  if (!rawText) return null;

  const textUpper = rawText.toUpperCase();
  const fields = {
    name: query,
    country: 'Italia',
    region: '',
    classification: '',
    category: 'Vino Rosso',
    type: 'Secco',
    alcoholContent: '',
    tempMin: '',
    tempMax: '',
    producerCellar: '',
    producer: '',
    grapeVarieties: []
  };

  if (textUpper.includes('FRANCIA') || textUpper.includes('FRANCE') || textUpper.includes('BORDEAUX') || textUpper.includes('CHAMPAGNE') || textUpper.includes('BOURGOGNE')) {
    fields.country = 'Francia';
  } else if (textUpper.includes('SPAGNA') || textUpper.includes('RIOJA')) {
    fields.country = 'Spagna';
  } else if (textUpper.includes('GERMANIA') || textUpper.includes('MOSELLA')) {
    fields.country = 'Germania';
  }

  const regionsList = [
    'Piemonte', 'Toscana', 'Veneto', 'Lombardia', 'Sicilia', 'Sardegna',
    'Puglia', 'Emilia-Romagna', 'Campania', 'Friuli-Venezia Giulia',
    'Trentino-Alto Adige', 'Abruzzo', 'Umbria', 'Marche', 'Basilicata',
    'Calabria', 'Liguria', 'Molise', 'Valle d\'Aosta'
  ];
  for (const reg of regionsList) {
    if (textUpper.includes(reg.toUpperCase())) {
      fields.region = reg;
      break;
    }
  }

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

  if (textUpper.includes('CHAMPAGNE') || textUpper.includes('SPUMANTE') || textUpper.includes('PROSECCO') || textUpper.includes('FRANCIACORTA') || textUpper.includes('BRUT')) {
    fields.category = 'Spumante';
    fields.type = textUpper.includes('EXTRA DRY') ? 'Extra Dry' : 'Brut';
    fields.tempMin = 6;
    fields.tempMax = 8;
  } else if (textUpper.includes('BIANCO') || textUpper.includes('WHITE') || textUpper.includes('CHARDONNAY') || textUpper.includes('SAUVIGNON') || textUpper.includes('VERMENTINO') || textUpper.includes('PINOT GRIGIO')) {
    fields.category = 'Vino Bianco';
    fields.tempMin = 10;
    fields.tempMax = 12;
  } else if (textUpper.includes('ROSATO') || textUpper.includes('ROSÉ')) {
    fields.category = 'Vino Rosato';
    fields.tempMin = 12;
    fields.tempMax = 14;
  } else if (textUpper.includes('DOLCE') || textUpper.includes('MOSCATO') || textUpper.includes('PASSITO')) {
    fields.category = 'Vino Dolce / Passito';
    fields.type = 'Dolce';
    fields.tempMin = 12;
    fields.tempMax = 14;
  } else {
    fields.category = 'Vino Rosso';
    fields.tempMin = 16;
    fields.tempMax = 18;
  }

  const alcMatch = rawText.match(/(\d{1,2}[\.,]?\d?)\s*%\s*(vol)?/i);
  if (alcMatch) {
    fields.alcoholContent = parseFloat(alcMatch[1].replace(',', '.'));
  }

  const knownGrapes = [
    'Nebbiolo', 'Sangiovese', 'Corvina', 'Rondinella', 'Barbera', 'Dolcetto',
    'Primitivo', 'Nero d\'Avola', 'Cannonau', 'Vermentino', 'Glera', 'Chardonnay',
    'Pinot Nero', 'Pinot Noir', 'Pinot Grigio', 'Cabernet Sauvignon', 'Cabernet Franc',
    'Merlot', 'Syrah', 'Sauvignon Blanc', 'Moscato', 'Montepulciano', 'Aglianico'
  ];

  for (const g of knownGrapes) {
    if (textUpper.includes(g.toUpperCase())) {
      fields.grapeVarieties.push({ name: g, percentage: null });
    }
  }

  return fields;
}

async function searchInternetForWine(query) {
  try {
    let combinedText = '';

    // Cerca su Wikipedia Italia
    const wikiUrl = `https://it.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' vino')}&format=json&origin=*`;
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

    // Cerca su DuckDuckGo se testo breve
    if (combinedText.length < 50) {
      const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' vino scheda produttore vitigno')}`;
      const ddgRes = await fetch(ddgUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (ddgRes.ok) {
        const html = await ddgRes.text();
        const cleanText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
        combinedText += ' ' + cleanText;
      }
    }

    if (!combinedText.trim()) return null;
    return extractFieldsFromOnlineText(query, combinedText);
  } catch (err) {
    console.warn("Internet search error:", err);
    return null;
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || '';
    const queryUpper = name.trim().toUpperCase();

    if (!queryUpper) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // 1. Cerca prima nel database degli utenti per riscontro esatto o parziale
    let wine = await prisma.wine.findFirst({
      where: {
        name: {
          contains: name.trim()
        }
      },
      orderBy: {
        id: 'desc'
      },
      include: {
        grapeVarieties: true
      }
    });

    if (wine) {
      return NextResponse.json(wine);
    }

    // 2. Cerca nel dizionario di conoscenza vini
    const matchedKB = WINE_KNOWLEDGE_BASE.find(item => 
      item.keywords.some(kw => queryUpper.includes(kw))
    );

    if (matchedKB) {
      return NextResponse.json(matchedKB.data);
    }

    // 3. Ricerca automatica in tempo reale su INTERNET (Wikipedia & Web)
    const onlineResult = await searchInternetForWine(name.trim());
    if (onlineResult) {
      return NextResponse.json(onlineResult);
    }

    return NextResponse.json(null);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to fetch wine metadata" }, { status: 500 });
  }
}
