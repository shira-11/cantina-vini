import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addCustomMetadata, renameCustomMetadata, removeCustomMetadata } from '@/lib/metadata';

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
    const positions = await prisma.wine.findMany({ distinct: ['position'], select: { position: true }, where: { position: { not: null, not: '' } } });
    const movPositions = await prisma.movement.findMany({ distinct: ['position'], select: { position: true }, where: { position: { not: null, not: '' } } });
    const collocations = await prisma.wine.findMany({ distinct: ['collocation'], select: { collocation: true }, where: { collocation: { not: null, not: '' } } });
    const movCollocations = await prisma.movement.findMany({ distinct: ['collocation'], select: { collocation: true }, where: { collocation: { not: null, not: '' } } });
    const shelfNumbers = await prisma.wine.findMany({ distinct: ['shelfNumber'], select: { shelfNumber: true }, where: { shelfNumber: { not: null, not: '' } } });
    const movShelfNumbers = await prisma.movement.findMany({ distinct: ['shelfNumber'], select: { shelfNumber: true }, where: { shelfNumber: { not: null, not: '' } } });

    // Fetch GrapeVariety metadata
    const dbGrapes = await prisma.grapeVariety.findMany({ distinct: ['name'], select: { name: true } });

    // Bottle types and movements
    const wineBottleTypes = await prisma.wine.findMany({ distinct: ['bottleType'], select: { bottleType: true }, where: { bottleType: { not: null, not: '' } } });
    const movementBottleTypes = await prisma.movement.findMany({ distinct: ['bottleType'], select: { bottleType: true }, where: { bottleType: { not: null, not: '' } } });
    const reasons = await prisma.movement.findMany({ distinct: ['reason'], select: { reason: true }, where: { reason: { not: null, not: '' } } });
    const vendors = await prisma.movement.findMany({ distinct: ['vendor'], select: { vendor: true }, where: { vendor: { not: null, not: '' } } });
    const locations = await prisma.location.findMany({ select: { name: true } });

    // Fetch custom metadata items from SystemSettings
    const customSettings = await prisma.systemSettings.findMany({
      where: { key: { startsWith: 'custom_metadata_' } }
    });

    const customMap = {};
    customSettings.forEach(s => {
      try {
        const fieldName = s.key.replace('custom_metadata_', '');
        customMap[fieldName] = JSON.parse(s.value);
      } catch (e) { }
    });

    const getCustom = (field) => {
      const list = customMap[field];
      return Array.isArray(list) ? list : [];
    };

    // Fetch hidden metadata items from SystemSettings
    const hiddenSettings = await prisma.systemSettings.findMany({
      where: { key: { startsWith: 'hidden_metadata_' } }
    });

    const hiddenMap = {};
    hiddenSettings.forEach(s => {
      try {
        const fieldName = s.key.replace('hidden_metadata_', '');
        hiddenMap[fieldName] = JSON.parse(s.value);
      } catch (e) { }
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

    const defaultCollocations = [
      'Cantina', 'Cartone', 'Frigo', 'Scaffale'
    ];

    const defaultPositions = [
      ...locations.map(l => l.name),
      'Scaffale 1', 'Scaffale 2', 'Scaffale 3', 'Scaffale 4', 'Scaffale 5',
      'Frigo', 'Cartone', 'Cantina 1'
    ];

    const defaultShelfNumbers = [
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'
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

    // Extract values, merge with defaults and custom saved values, and sort alphabetically
    const data = {
      vintages: [...new Set([...getCustom('vintage'), ...vintages.map(v => v.vintage)])].filter(v => isNotHidden('vintage', v)).sort(),
      countries: [...new Set([...getCustom('country'), ...countries.map(c => c.country)])].filter(c => isNotHidden('country', c)).sort(),
      regions: [...new Set([...defaultRegions, ...getCustom('region'), ...regions.map(r => r.region)])].filter(r => isNotHidden('region', r)).sort(),
      regionsByCountry: regionsByCountry,
      producers: [...new Set([...getCustom('producerCellar'), ...producers.map(p => p.producerCellar)])].filter(p => isNotHidden('producerCellar', p)).sort(),
      producerNames: [...new Set([...getCustom('producer'), ...producerNames.map(p => p.producer)])].filter(p => isNotHidden('producer', p)).sort(),
      classifications: [...new Set([...getCustom('classification'), ...classifications.map(c => c.classification)])].filter(c => isNotHidden('classification', c)).sort(),
      categories: [...new Set([...getCustom('category'), ...categories.map(c => c.category)])].filter(c => isNotHidden('category', c)).sort(),
      types: [...new Set([...defaultTypes, ...getCustom('type'), ...types.map(t => t.type)])].filter(t => isNotHidden('type', t)).sort(),
      positions: [...new Set([...defaultPositions, ...getCustom('position'), ...positions.map(p => p.position), ...movPositions.map(p => p.position)])].filter(p => isNotHidden('position', p)).sort((a, b) => {
        return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
      }),
      collocations: [...new Set([...defaultCollocations, ...getCustom('collocation'), ...collocations.map(c => c.collocation), ...movCollocations.map(c => c.collocation)])].filter(c => isNotHidden('collocation', c)).sort(),
      shelfNumbers: [...new Set([...defaultShelfNumbers, ...getCustom('shelfNumber'), ...shelfNumbers.map(s => s.shelfNumber), ...movShelfNumbers.map(s => s.shelfNumber)])].filter(s => isNotHidden('shelfNumber', s)).sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return String(a).localeCompare(String(b));
      }),
      grapeVarieties: [...new Set([...defaultGrapeVarieties, ...getCustom('grapeVarieties'), ...dbGrapes.map(g => g.name)])].filter(g => isNotHidden('grapeVarieties', g)).sort(),

      // Movement & Wine metadata
      bottleTypes: [...new Set([...defaultBottleTypes, ...getCustom('bottleType'), ...wineBottleTypes.map(w => w.bottleType), ...movementBottleTypes.map(b => b.bottleType)])].filter(b => isNotHidden('bottleType', b)).sort(),
      reasons: [...new Set([...defaultReasons, ...getCustom('reason'), ...reasons.map(r => r.reason), ...locations.map(l => l.name)])].filter(r => isNotHidden('reason', r)).sort(),
      vendors: [...new Set([...getCustom('vendor'), ...vendors.map(v => v.vendor)])].filter(v => isNotHidden('vendor', v)).sort(),
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

    const validFields = ['position', 'vintage', 'country', 'region', 'collocation', 'shelfNumber', 'producerCellar', 'producer', 'classification', 'category', 'type', 'grapeVarieties', 'bottleType', '_initialBottleType', 'reason', 'vendor'];
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

      // 1. Remove from custom metadata in SystemSettings
      await removeCustomMetadata(actualField, oldVal);

      // 2. Add to hidden metadata list in SystemSettings
      const existingSetting = await prisma.systemSettings.findUnique({ where: { key: settingKey } });
      let hiddenList = [];
      if (existingSetting && existingSetting.value) {
        try { hiddenList = JSON.parse(existingSetting.value); } catch (e) { }
      }
      if (!hiddenList.includes(oldVal)) {
        hiddenList.push(oldVal);
        await prisma.systemSettings.upsert({
          where: { key: settingKey },
          update: { value: JSON.stringify(hiddenList) },
          create: { key: settingKey, value: JSON.stringify(hiddenList) }
        });
      }

      // 3. Update database tables
      if (actualField === 'grapeVarieties') {
        await prisma.grapeVariety.deleteMany({ where: { name: oldVal } });
      } else if (['bottleType', 'reason', 'vendor'].includes(actualField)) {
        await prisma.movement.updateMany({
          where: { [actualField]: oldVal },
          data: { [actualField]: null }
        });
      } else if (['position', 'collocation', 'shelfNumber'].includes(actualField)) {
        await prisma.wine.updateMany({
          where: { [actualField]: oldVal },
          data: { [actualField]: null }
        });
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

    // Case 1: Adding a new item (oldVal is empty)
    if (!oldVal) {
      await addCustomMetadata(actualField, finalVal);

      if (actualField === 'grapeVarieties') {
        const exists = await prisma.grapeVariety.findFirst({ where: { name: finalVal } });
        if (!exists) {
          await prisma.grapeVariety.create({ data: { name: finalVal } });
        }
      }
      return NextResponse.json({ success: true });
    }

    // Case 2: Renaming an existing item (oldVal is provided)
    await renameCustomMetadata(actualField, oldVal, finalVal);

    // If oldVal was a default preset, hide oldVal so it doesn't linger
    // and un-hide finalVal if it was previously hidden
    const existingSetting = await prisma.systemSettings.findUnique({ where: { key: settingKey } });
    let hiddenList = [];
    if (existingSetting && existingSetting.value) {
      try { hiddenList = JSON.parse(existingSetting.value); } catch (e) { }
    }
    let changed = false;
    if (oldVal && !hiddenList.includes(oldVal)) {
      hiddenList.push(oldVal);
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
    } else if (['position', 'collocation', 'shelfNumber'].includes(actualField)) {
      await prisma.wine.updateMany({
        where: { [actualField]: oldVal },
        data: { [actualField]: finalVal }
      });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database Error (PUT metadata):", error);
    return NextResponse.json({ error: "Failed to update metadata" }, { status: 500 });
  }
}
