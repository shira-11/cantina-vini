import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncEventEmitter } from '@/lib/eventEmitter';
import { addCustomMetadata } from '@/lib/metadata';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const wine = await prisma.wine.findUnique({
      where: { id: parseInt(id) },
      include: {
        movements: {
          include: { location: true },
          orderBy: { date: 'desc' }
        },
        grapeVarieties: true,
        archivedPhotos: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!wine) {
      return NextResponse.json({ error: "Wine not found" }, { status: 404 });
    }

    // Fetch all vintages of the same wine
    const allVintages = await prisma.wine.findMany({
      where: {
        name: wine.name
      },
      select: {
        id: true,
        vintage: true,
        bottleType: true,
        position: true,
        collocation: true,
        shelfNumber: true,
        movements: {
          select: {
            movementType: true,
            quantity: true,
            position: true,
            location: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { vintage: 'desc' }
    });

    const allVintagesWithStock = allVintages.map(v => {
      let stock = 0;
      const locStockMap = {};
      v.movements.forEach(m => {
        const locName = m.location?.name;
        if (locName) {
          if (!locStockMap[locName]) locStockMap[locName] = 0;
          if (m.movementType === 'Ingresso') locStockMap[locName] += m.quantity;
          else if (m.movementType === 'Uscita') locStockMap[locName] -= m.quantity;
        }
        if (m.movementType === 'Ingresso') stock += m.quantity;
        else if (m.movementType === 'Uscita') stock -= m.quantity;
      });

      const activeLocations = Object.entries(locStockMap)
        .filter(([_, q]) => q > 0)
        .map(([name, q]) => ({ name, quantity: q }));

      let displayPosition = (v.position || '').trim();
      if (!displayPosition) {
        const parts = [v.collocation, v.shelfNumber ? `Scaffale ${v.shelfNumber}` : ''].filter(Boolean);
        if (parts.length > 0) {
          displayPosition = parts.join(' - ');
        } else if (activeLocations.length > 0) {
          displayPosition = activeLocations.map(l => l.name).join(', ');
        }
      }

      return {
        id: v.id,
        vintage: v.vintage || 'N/D',
        bottleType: v.bottleType || 'Normale 0.75',
        position: v.position || '',
        displayPosition: displayPosition || '',
        activeLocations,
        stock
      };
    });

    return NextResponse.json({ ...wine, allVintages: allVintagesWithStock });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to fetch wine details" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const role = request.headers.get('x-user-role');
    if (role === 'viewer') {
      return NextResponse.json({ error: "Forbidden: Viewer cannot perform this action" }, { status: 403 });
    }
    const { id } = await params;
    const data = await request.json();
    const currentUser = request.headers.get('x-user-username');
    const wineId = parseInt(id);

    // Aggiornamento mirato della posizione per una specifica Cantina Fisica
    if (data.locationId !== undefined && data.position !== undefined) {
      const locIdInt = parseInt(data.locationId);
      const newPos = data.position ? data.position.trim() : null;
      if (!isNaN(locIdInt)) {
        await prisma.movement.updateMany({
          where: { wineId: wineId, locationId: locIdInt },
          data: { position: newPos }
        });
      }
      if (newPos) {
        await addCustomMetadata('position', newPos);
      }
      const otherKeys = Object.keys(data).filter(k => k !== 'locationId' && k !== 'position');
      if (otherKeys.length === 0) {
        syncEventEmitter.emit('db_update');
        return NextResponse.json({ success: true, position: newPos });
      }
    }

    // Fetch the current wine to check old photos
    const currentWine = await prisma.wine.findUnique({ where: { id: wineId } });

    // Archivia le vecchie foto se cambiano
    const newArchivedPhotos = [];
    if (data.photo && currentWine && currentWine.photo && data.photo !== currentWine.photo) {
      newArchivedPhotos.push({ url: currentWine.photo, type: 'Fronte' });
    }
    if (data.photoBack && currentWine && currentWine.photoBack && data.photoBack !== currentWine.photoBack) {
      newArchivedPhotos.push({ url: currentWine.photoBack, type: 'Retro' });
    }

    const allLocations = await prisma.location.findMany();
    const newMovementsToCreate = [];
    const newMovs = data.movements?.filter(m => m.isNew || String(m.id).startsWith('temp-')) || [];

    for (const m of newMovs) {
      const sourceLocId = parseInt(m.locationId || m.location?.id);
      const sourceLoc = allLocations.find(l => l.id === sourceLocId);

      newMovementsToCreate.push({
        date: new Date(m.date),
        movementType: m.movementType,
        quantity: parseInt(m.quantity),
        bottleType: m.bottleType,
        collocation: m.collocation || null,
        shelfNumber: m.shelfNumber || null,
        reason: m.reason,
        vendor: m.vendor,
        price: m.price ? parseFloat(m.price) : null,
        tempPrice: m.tempPrice ? parseFloat(m.tempPrice) : null,
        locationId: sourceLocId,
        notes: m.notes || '',
        user: m.user || currentUser || null
      });

      if (m.movementType === 'Uscita' && m.reason) {
        const reasonStr = m.reason.trim().toLowerCase();
        const destLoc = allLocations.find(l => {
          const locName = l.name.toLowerCase();
          if (locName === reasonStr) return true;
          const locNameClean = locName.replace('cantina', '').trim();
          const reasonClean = reasonStr.replace('cantina', '').trim();
          return locNameClean === reasonClean && locNameClean.length > 0;
        });
        if (destLoc && destLoc.id !== sourceLocId) {
          newMovementsToCreate.push({
            date: new Date(m.date),
            movementType: 'Ingresso',
            quantity: parseInt(m.quantity),
            bottleType: m.bottleType,
            reason: `Trasf. da ${sourceLoc ? sourceLoc.name : 'cantina'}`,
            vendor: m.vendor,
            price: m.price ? parseFloat(m.price) : null,
            tempPrice: m.tempPrice ? parseFloat(m.tempPrice) : null,
            locationId: destLoc.id,
            notes: m.notes || '',
            user: m.user || currentUser || null
          });
        }
      }
    }

    const fieldsToCheck = ['name', 'vintage', 'country', 'region', 'collocation', 'shelfNumber', 'producerCellar', 'producer', 'classification', 'category', 'type', 'notes', 'bottleType', 'alcoholContent', 'tempMin', 'tempMax'];
    let hasTextualChanges = false;
    const changedFieldNames = [];
    for (const field of fieldsToCheck) {
      const newVal = data[field] !== undefined ? String(data[field] ?? '').trim() : '';
      const oldVal = currentWine[field] !== undefined && currentWine[field] !== null ? String(currentWine[field]).trim() : '';
      if (data[field] !== undefined && newVal !== oldVal) {
        hasTextualChanges = true;
        changedFieldNames.push(field);
      }
    }

    let hasPhotoChanges = false;
    if (data.photo !== undefined && data.photo !== currentWine.photo) {
      hasPhotoChanges = true;
      changedFieldNames.push('foto fronte');
    }
    if (data.photoBack !== undefined && data.photoBack !== currentWine.photoBack) {
      hasPhotoChanges = true;
      changedFieldNames.push('foto retro');
    }

    // We update the basic info here
    const updatedWine = await prisma.wine.update({
      where: { id: wineId },
      data: {
        name: data.name,
        vintage: data.vintage,
        country: data.country,
        region: data.region,
        position: data.position !== undefined ? (data.position ? data.position.trim() : null) : undefined,
        collocation: data.collocation,
        shelfNumber: data.shelfNumber,
        producerCellar: data.producerCellar,
        producer: data.producer,
        classification: data.classification,
        category: data.category,
        type: data.type,
        alcoholContent: data.alcoholContent ? parseFloat(data.alcoholContent) : null,
        tempMin: data.tempMin ? parseFloat(data.tempMin) : null,
        tempMax: data.tempMax ? parseFloat(data.tempMax) : null,
        bottleType: data._initialBottleType || null,
        notes: data.notes,
        photo: data.photo,
        photoBack: data.photoBack,
        movements: newMovementsToCreate.length > 0 ? {
          create: newMovementsToCreate
        } : undefined,
        archivedPhotos: newArchivedPhotos.length > 0 ? {
          create: newArchivedPhotos
        } : undefined,
        grapeVarieties: {
          deleteMany: {},
          create: (data.grapeVarieties || []).filter(g => g.name && g.name.trim() !== '').map(g => ({
            name: g.name,
            percentage: g.percentage ? parseFloat(g.percentage) : null
          }))
        }
      }
    });

    // CASCADE UPDATE: Sincronizza i dati base (Nazione, Regione, Produttore, ecc.) con le altre annate dello stesso vino
    if (data.name && data.name.trim() !== '') {
      const otherWines = await prisma.wine.findMany({
        where: { name: data.name.trim(), id: { not: wineId } }
      });

      if (otherWines.length > 0) {
        // Aggiorna campi base per tutte le altre annate
        await prisma.wine.updateMany({
          where: { name: data.name.trim(), id: { not: wineId } },
          data: {
            country: data.country,
            region: data.region,
            producerCellar: data.producerCellar,
            producer: data.producer,
            classification: data.classification,
            category: data.category,
            type: data.type,
            photo: data.photo !== undefined ? data.photo : undefined,
            photoBack: data.photoBack !== undefined ? data.photoBack : undefined
          }
        });

        // Sincronizza anche l'uvaggio (grapeVarieties) per tutte le altre annate
        const grapesToCreate = (data.grapeVarieties || []).filter(g => g.name && g.name.trim() !== '').map(g => ({
          name: g.name,
          percentage: g.percentage ? parseFloat(g.percentage) : null
        }));

        for (const ow of otherWines) {
          await prisma.wine.update({
            where: { id: ow.id },
            data: {
              grapeVarieties: {
                deleteMany: {},
                create: grapesToCreate
              }
            }
          });
        }
      }
    }

    // Aggiorna massivamente i movimenti per i campi modificati dalla scheda principale
    if ('_initialBottleType' in data) {
      await prisma.movement.updateMany({
        where: { wineId: wineId },
        data: { bottleType: data._initialBottleType || '' }
      });
    }
    if ('_initialPrice' in data && data._initialPrice !== null && data._initialPrice !== '') {
      await prisma.movement.updateMany({
        where: { wineId: wineId },
        data: { price: parseFloat(data._initialPrice) }
      });
    }
    if ('_initialTempPrice' in data && data._initialTempPrice !== null && data._initialTempPrice !== '') {
      await prisma.movement.updateMany({
        where: { wineId: wineId },
        data: { tempPrice: parseFloat(data._initialTempPrice) }
      });
    }

    // Auto-register custom metadata to keep in suggestions
    if (data.position) await addCustomMetadata('position', data.position);
    if (data.collocation) await addCustomMetadata('collocation', data.collocation);
    if (data.shelfNumber) await addCustomMetadata('shelfNumber', data.shelfNumber);
    if (data.producerCellar) await addCustomMetadata('producerCellar', data.producerCellar);
    if (data.producer) await addCustomMetadata('producer', data.producer);
    if (data.classification) await addCustomMetadata('classification', data.classification);
    if (data.category) await addCustomMetadata('category', data.category);
    if (data.type) await addCustomMetadata('type', data.type);

    for (const m of newMovementsToCreate) {
      if (m.collocation) await addCustomMetadata('collocation', m.collocation);
      if (m.shelfNumber) await addCustomMetadata('shelfNumber', m.shelfNumber);
    }

    syncEventEmitter.emit('db_update');
    return NextResponse.json(updatedWine);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: String(error.message || error) }, { status: 500 });
  }
}

import { promises as fs } from 'fs';
import path from 'path';

export async function DELETE(request, { params }) {
  try {
    const role = request.headers.get('x-user-role');
    if (role === 'viewer') {
      return NextResponse.json({ error: "Forbidden: Viewer cannot perform this action" }, { status: 403 });
    }
    const { id } = await params;
    const wineId = parseInt(id);

    // Trova il vino e le sue foto archiviate prima di eliminarlo
    const wineToDelete = await prisma.wine.findUnique({
      where: { id: wineId },
      include: { archivedPhotos: true }
    });

    if (!wineToDelete) {
      return NextResponse.json({ error: "Wine not found" }, { status: 404 });
    }

    // Funzione helper per verificare se una foto è usata da altre annate
    const isPhotoInUseElsewhere = async (url) => {
      if (!url) return true; // se null/empty, non facciamo nulla

      const inWines = await prisma.wine.findFirst({
        where: {
          id: { not: wineId },
          OR: [{ photo: url }, { photoBack: url }]
        }
      });
      if (inWines) return true;

      const inArchives = await prisma.winePhoto.findFirst({
        where: {
          wineId: { not: wineId },
          url: url
        }
      });
      if (inArchives) return true;

      return false;
    };

    const deletePhysicalFile = async (url) => {
      if (!url) return;
      try {
        const inUse = await isPhotoInUseElsewhere(url);
        if (!inUse) {
          const filename = url.split('/').pop();
          const uploadDir = path.join(process.cwd(), 'public', 'foto_bottiglie');
          const filePath = path.join(uploadDir, filename);
          await fs.unlink(filePath);
          console.log(`Eliminato file fisico: ${filename}`);
        }
      } catch (err) {
        // Ignoriamo gli errori di file non trovato
        console.error('Errore durante l\'eliminazione del file fisico:', err.message);
      }
    };

    // Tentiamo di eliminare i file fisici
    const urlsToDelete = [wineToDelete.photo, wineToDelete.photoBack];
    wineToDelete.archivedPhotos.forEach(ap => urlsToDelete.push(ap.url));

    for (const url of urlsToDelete) {
      if (url) await deletePhysicalFile(url);
    }

    // Infine, elimina il vino dal database (questo eliminerà a cascata anche archivedPhotos)
    await prisma.wine.delete({
      where: { id: wineId }
    });

    syncEventEmitter.emit('db_update');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to delete wine" }, { status: 500 });
  }
}
