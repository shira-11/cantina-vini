import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const vintages = await prisma.wine.findMany({ distinct: ['vintage'], select: { vintage: true }, where: { vintage: { not: null, not: '' } } });
    const countries = await prisma.wine.findMany({ distinct: ['country'], select: { country: true }, where: { country: { not: null, not: '' } } });
    const regions = await prisma.wine.findMany({ distinct: ['region'], select: { region: true }, where: { region: { not: null, not: '' } } });
    const producers = await prisma.wine.findMany({ distinct: ['producerCellar'], select: { producerCellar: true }, where: { producerCellar: { not: null, not: '' } } });
    const producerNames = await prisma.wine.findMany({ distinct: ['producer'], select: { producer: true }, where: { producer: { not: null, not: '' } } });
    const classifications = await prisma.wine.findMany({ distinct: ['classification'], select: { classification: true }, where: { classification: { not: null, not: '' } } });
    const categories = await prisma.wine.findMany({ distinct: ['category'], select: { category: true }, where: { category: { not: null, not: '' } } });
    const types = await prisma.wine.findMany({ distinct: ['type'], select: { type: true }, where: { type: { not: null, not: '' } } });

    // Fetch GrapeVariety metadata
    const dbGrapes = await prisma.grapeVariety.findMany({ distinct: ['name'], select: { name: true } });
    
    // Bottle types and movements
    const wineBottleTypes = await prisma.wine.findMany({ distinct: ['bottleType'], select: { bottleType: true }, where: { bottleType: { not: null, not: '' } } });
    const movementBottleTypes = await prisma.movement.findMany({ distinct: ['bottleType'], select: { bottleType: true }, where: { bottleType: { not: null, not: '' } } });
    const reasons = await prisma.movement.findMany({ distinct: ['reason'], select: { reason: true }, where: { reason: { not: null, not: '' } } });
    const vendors = await prisma.movement.findMany({ distinct: ['vendor'], select: { vendor: true }, where: { vendor: { not: null, not: '' } } });
    const locations = await prisma.location.findMany({ select: { name: true } });

    // Fetch hidden metadata items from SystemSettings
    const hiddenSettings = await prisma.systemSettings.findMany({
      where: { key: { startsWith: 'hidden_metadata_' } }
    });

    const hiddenMap = {};
    hiddenSettings.forEach(s => {
      try {
        const fieldName = s.key.replace('hidden_metadata_', '');
        hiddenMap[fieldName] = JSON.parse(s.value);
      } catch (e) {}
    });

    const isNotHidden = (field, val) => {
      if (!val) return false;
      const hiddenList = hiddenMap[field];
      if (!hiddenList || !Array.isArray(hiddenList)) return true;
      return !hiddenList.includes(val);
    };

    const defaultRegions = [
      'Toscana', 'Piemonte', 'Trentino Alto Adige', 'Sicilia', 
      'Friuli Venezia Giulia', 'Campania', 'Emilia Romagna', 
      'Liguria', 'Veneto', 'Marche', 'Lombardia', 'Sardegna', 
      'Umbria', 'Abruzzo', 'Calabria', 'Lazio', 'Basilicata'
    ];

    const defaultTypes = [
      'Aromatizzato', 'Dessert', 'Distillato', 'Dolce',
      'Frizzante', 'Fruttato', 'Liquoroso', 'Secco', 'Semi secco'
    ];

    const defaultBottleTypes = [
      'Alsaziana 0,75 Lt', 'Balthasar 12 Lt', 'Bocksbeutel', 'Bordolese 0,75 Lt',
      'Borgogna 0,75 Lt', 'Champagne', 'Jeroboam 3 Lt', 'Magnum 1,5 Lt',
      'Methusalem 6 Lt', 'Mezza Bottiglia', 'Normale 0.75', 'Piccola',
      'Rehoboam (6X)', 'Renana 0,75 Lt', 'Salmanasar (12X)', 'Sovereign (34X)'
    ];

    const defaultReasons = [
      'Acquisto', 'Consumo', 'Inventario', 'Regalo', 'Vendita'
    ];

    const defaultGrapeVarieties = [
      "Aglianico", "Aglianico del Vulture", "Albana", "Aleatico", "Alicante", "Aligotè", "Ancelotta", "Ansonica", "Antiniello", "Arneis", "Asprinio", "Barbera", "Bellone", "Biancame", "Bianchello", "Biancolella", "Blank Fume'", "Bombino bianco", "Bombino nero", "Bonarda", "Bonarda piemontese", "Bosco", "Bourboulenc", "Bovale grande", "Bovale sardo", "Brachetto", "Caberlot", "Cabernet", "Cabernet Franc", "Cabernet Sauvignon", "Caddiu", "Calabrese", "Camenere", "Canaiolo", "Cannonau", "Caranyena", "Carignano", "Carmenere", "Carricante", "Casetta", "Castiglione", "Catarratto", "Cesanese", "Chardonnay", "Chasselas", "Cigliegiolo", "Cinsault", "Cococciola", "Coda di Volpe", "Colorino", "Cortese", "Corvina", "Corvina veronese", "Corvinone", "Counoise", "Croatina", "Durello", "Enantio", "Erbaluce", "Falanghina", "Fenile", "Fiano", "Forastera", "Fortana", "Francavidda", "Franconia", "Frappato", "Freisa", "Friulano", "Friularo", "Fumin", "Gaglioppo", "Gamay", "Garganega", "Garnatxa negra", "Ginestra", "Glera", "Graciano", "Granacha", "Grecanico dorato", "Grechetto", "Greco", "Greco bianco", "Greco nero", "Grenache", "Grenache blanc", "Grignolino", "Grillo", "Groppello", "Gruner Veltliner", "Guarnaccia", "Impigno", "Inzolia", "Kerner", "Lacrima", "Lagrein", "Lambrusco", "Lambrusco Fontana", "Lambrusco Maestri", "Lambrusco Salamino", "Lambrusco Sorbara", "Magliocco canino", "Malbec", "Malvasia", "Malvasia di Casorzo", "Malvasia di Schierano", "Malvasia Istriana", "Malvasia Nera", "Malvasia nera di Brindisi", "Malvasia nera di Lecce", "Mammolo", "Manzoni", "Marchione", "Marsanne", "Maruggio", "Marzemino", "Merlot", "Meunier", "Minutolo", "Molinara", "Monastrell", "Monica", "Montepulciano", "Montonico", "Montù", "Moscato", "Mourvedre", "Mouscadelle", "Müller Thurgau", "Nebbiolo", "Negrara", "Negroamaro", "Nerello", "Nerello Cappuccio", "Nerello mascalese", "Nero d'Avola", "Neyret", "Nieddera", "Nielluccio", "Nieluccio", "Nocera", "Nosiola", "Notardomenico", "Nuragus", "Ortrugo", "Oseleta", "Ottavianello", "Palomino Fino", "Pampanuto", "Passerina", "Pecorino", "Petit Verdot", "Picolit", "Piculit Neri", "Pigato", "Pignoletto", "Pignolo", "Pinot", "Pinot bianco", "Pinot grigio", "Pinot Meunier", "Pinot nero", "Priè blanc", "Primitivo", "Procanico", "Prugnolo Gentile", "Raboso", "Ravello", "Rebo", "Refosco dal peduncolo", "Riesling", "Riesling Italico", "Ripoli", "Rondinella", "Rossese", "Rossignola", "Roussanne", "Ruchè", "Sagrantino", "Sangiovese", "SanGiovese Grosso", "Sangioveto", "Sauvignon", "Sauvignon Blanc", "Schiava", "Schioppettino", "Sciascinoso", "Semillion", "Susumaniello", "Sylvaner", "Syrah", "Tempranillo", "Teroldego", "Terrano del Carso", "Timorasso"
    ];

    const countryRegionsMap = {
      "Italia": [
        "Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia Romagna",
        "Friuli Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche",
        "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana",
        "Trentino Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"
      ],
      "Francia": [
        "Alsace", "Bordeaux", "Bourgogne", "Champagne", "Corse", "Jura", 
        "Languedoc-Roussillon", "Loire", "Provence", "Rhône", "Savoie", "Sud-Ouest"
      ],
      "Spagna": [
        "Andalusia", "Aragona", "Canarie", "Cantabria", "Castiglia-La Mancia", 
        "Castiglia e León", "Catalogna", "Estremadura", "Galizia", "La Rioja", 
        "Navarra", "Paesi Baschi", "Valencia"
      ],
      "Germania": [
        "Ahr", "Baden", "Franken", "Hessische Bergstraße", "Mittelrhein", 
        "Mosel", "Nahe", "Pfalz", "Rheingau", "Rheinhessen", "Saale-Unstrut", 
        "Sachsen", "Württemberg"
      ],
      "Stati Uniti": [
        "California", "Washington", "Oregon", "New York"
      ],
      "Australia": [
        "South Australia", "New South Wales", "Victoria", "Western Australia", "Tasmania"
      ],
      "Cile": [
        "Aconcagua", "Atacama", "Coquimbo", "Valle Central", "Regione Sud"
      ],
      "Argentina": [
        "Mendoza", "San Juan", "La Rioja", "Salta", "Patagonia"
      ],
      "Sud Africa": [
        "Western Cape", "Stellenbosch", "Paarl", "Franschhoek", "Constantia"
      ],
      "Portogallo": [
        "Alentejo", "Algarve", "Bairrada", "Dão", "Douro", "Lisboa", "Minho (Vinho Verde)", "Península de Setúbal"
      ]
    };

    // Extract dynamic regions from existing wines to group them by country
    const dbWines = await prisma.wine.findMany({ select: { country: true, region: true }, where: { country: { not: null, not: '' }, region: { not: null, not: '' } } });
    const regionsByCountry = { ...countryRegionsMap };
    
    // Add existing DB regions to the respective country
    dbWines.forEach(w => {
      const c = w.country.trim();
      const r = w.region.trim();
      if (!regionsByCountry[c]) {
        regionsByCountry[c] = [];
      }
      if (!regionsByCountry[c].includes(r)) {
        regionsByCountry[c].push(r);
      }
    });

    // Sort regions alphabetically for each country
    for (const c in regionsByCountry) {
      regionsByCountry[c].sort();
    }

    // Extract values, merge with defaults if needed, and sort alphabetically
    const data = {
      vintages: vintages.map(v => v.vintage).filter(v => isNotHidden('vintage', v)).sort(),
      countries: countries.map(c => c.country).filter(c => isNotHidden('country', c)).sort(),
      regions: [...new Set([...defaultRegions, ...regions.map(r => r.region)])].filter(r => isNotHidden('region', r)).sort(),
      regionsByCountry: regionsByCountry,
      producers: producers.map(p => p.producerCellar).filter(p => isNotHidden('producerCellar', p)).sort(),
      producerNames: producerNames.map(p => p.producer).filter(p => isNotHidden('producer', p)).sort(),
      classifications: classifications.map(c => c.classification).filter(c => isNotHidden('classification', c)).sort(),
      categories: categories.map(c => c.category).filter(c => isNotHidden('category', c)).sort(),
      types: [...new Set([...defaultTypes, ...types.map(t => t.type)])].filter(t => isNotHidden('type', t)).sort(),
      grapeVarieties: [...new Set([...defaultGrapeVarieties, ...dbGrapes.map(g => g.name)])].filter(g => isNotHidden('grapeVarieties', g)).sort(),
      
      // Movement & Wine metadata
      bottleTypes: [...new Set([...defaultBottleTypes, ...wineBottleTypes.map(w => w.bottleType), ...movementBottleTypes.map(b => b.bottleType)])].filter(b => isNotHidden('bottleType', b)).sort(),
      reasons: [...new Set([...defaultReasons, ...reasons.map(r => r.reason), ...locations.map(l => l.name)])].filter(r => isNotHidden('reason', r)).sort(),
      vendors: vendors.map(v => v.vendor).filter(v => isNotHidden('vendor', v)).sort(),
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Metadata Error:", error);
    return NextResponse.json({ error: "Failed to fetch metadata" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const role = request.headers.get('x-user-role');
    if (role === 'viewer') {
      return NextResponse.json({ error: "Forbidden: Viewer cannot perform this action" }, { status: 403 });
    }
    const { field, oldVal, newVal } = await request.json();
    
    const validFields = ['vintage', 'country', 'region', 'producerCellar', 'producer', 'classification', 'category', 'type', 'grapeVarieties', 'bottleType', '_initialBottleType', 'reason', 'vendor'];
    if (!validFields.includes(field)) {
      return NextResponse.json({ error: "Campo non valido per l'aggiornamento globale" }, { status: 400 });
    }

    const actualField = field === '_initialBottleType' ? 'bottleType' : field;
    const settingKey = `hidden_metadata_${actualField}`;

    // If deleting item (newVal is null or empty)
    if (!newVal || newVal.trim() === '') {
      if (!oldVal) {
        return NextResponse.json({ error: "Valore originale mancante" }, { status: 400 });
      }

      // Add to hidden metadata list in SystemSettings
      const existingSetting = await prisma.systemSettings.findUnique({ where: { key: settingKey } });
      let hiddenList = [];
      if (existingSetting && existingSetting.value) {
        try { hiddenList = JSON.parse(existingSetting.value); } catch(e) {}
      }
      if (!hiddenList.includes(oldVal)) {
        hiddenList.push(oldVal);
        await prisma.systemSettings.upsert({
          where: { key: settingKey },
          update: { value: JSON.stringify(hiddenList) },
          create: { key: settingKey, value: JSON.stringify(hiddenList) }
        });
      }

      // Update database tables
      if (actualField === 'grapeVarieties') {
        await prisma.grapeVariety.deleteMany({ where: { name: oldVal } });
      } else if (['bottleType', 'reason', 'vendor'].includes(actualField)) {
        await prisma.movement.updateMany({
          where: { [actualField]: oldVal },
          data: { [actualField]: null }
        });
      } else {
        await prisma.wine.updateMany({
          where: { [actualField]: oldVal },
          data: { [actualField]: null }
        });
      }

      return NextResponse.json({ success: true });
    }

    // If adding or renaming item (newVal is provided)
    const finalVal = newVal.trim();

    // If adding a new item or renaming, un-hide it if it was previously hidden
    const existingSetting = await prisma.systemSettings.findUnique({ where: { key: settingKey } });
    if (existingSetting && existingSetting.value) {
      try {
        let hiddenList = JSON.parse(existingSetting.value);
        let changed = false;
        if (oldVal && hiddenList.includes(oldVal)) {
          hiddenList = hiddenList.filter(x => x !== oldVal);
          changed = true;
        }
        if (hiddenList.includes(finalVal)) {
          hiddenList = hiddenList.filter(x => x !== finalVal);
          changed = true;
        }
        if (changed) {
          await prisma.systemSettings.upsert({
            where: { key: settingKey },
            update: { value: JSON.stringify(hiddenList) },
            create: { key: settingKey, value: JSON.stringify(hiddenList) }
          });
        }
      } catch (e) {}
    }

    if (oldVal) {
      if (actualField === 'grapeVarieties') {
        await prisma.grapeVariety.updateMany({
          where: { name: oldVal },
          data: { name: finalVal }
        });
      } else if (['bottleType', 'reason', 'vendor'].includes(actualField)) {
        await prisma.movement.updateMany({
          where: { [actualField]: oldVal },
          data: { [actualField]: finalVal }
        });
      } else {
        await prisma.wine.updateMany({
          where: { [actualField]: oldVal },
          data: { [actualField]: finalVal }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database Error (PUT metadata):", error);
    return NextResponse.json({ error: "Failed to update metadata" }, { status: 500 });
  }
}
