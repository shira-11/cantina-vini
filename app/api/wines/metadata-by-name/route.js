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

    // 2. Se non presente in DB, cerca nel dizionario enciclopedico di conoscenza vini
    const matchedKB = WINE_KNOWLEDGE_BASE.find(item => 
      item.keywords.some(kw => queryUpper.includes(kw))
    );

    if (matchedKB) {
      return NextResponse.json(matchedKB.data);
    }

    return NextResponse.json(null);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to fetch wine metadata" }, { status: 500 });
  }
}
