import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncEventEmitter } from '@/lib/eventEmitter';

export async function POST(request) {
  try {
    const role = request.headers.get('x-user-role');
    if (role === 'viewer') {
      return NextResponse.json({ error: "Forbidden: Viewer cannot perform this action" }, { status: 403 });
    }
    const { action, wineIds } = await request.json();

    if (!wineIds || !Array.isArray(wineIds) || wineIds.length === 0) {
      return NextResponse.json({ error: "No wines selected" }, { status: 400 });
    }

    if (action === 'archive') {
      await prisma.wine.updateMany({
        where: { id: { in: wineIds } },
        data: { isArchived: true }
      });
      syncEventEmitter.emit('db_update');
      return NextResponse.json({ success: true, message: "Vini archiviati" });
    } else if (action === 'restore') {
      await prisma.wine.updateMany({
        where: { id: { in: wineIds } },
        data: { isArchived: false }
      });
      syncEventEmitter.emit('db_update');
      return NextResponse.json({ success: true, message: "Vini ripristinati" });
    } else if (action === 'delete') {
      await prisma.wine.deleteMany({
        where: { id: { in: wineIds } }
      });
      syncEventEmitter.emit('db_update');
      return NextResponse.json({ success: true, message: "Vini eliminati definitivamente" });
    } else if (action === 'merge') {
      if (wineIds.length < 2) {
        return NextResponse.json({ error: "Seleziona almeno 2 vini da unificare" }, { status: 400 });
      }

      // 1. Prendi il primo vino come principale (master)
      const targetWineId = wineIds[0];
      const otherWineIds = wineIds.slice(1);

      const targetWine = await prisma.wine.findUnique({ where: { id: targetWineId } });
      if (!targetWine) {
        return NextResponse.json({ error: "Vino di destinazione non trovato" }, { status: 404 });
      }

      // 2. Trasferisci tutti i movimenti dei vini duplicati al vino principale
      await prisma.movement.updateMany({
        where: { wineId: { in: otherWineIds } },
        data: { wineId: targetWineId }
      });

      // 3. Recupera i dettagli degli altri vini per integrare metadati mancanti (Nazione, Regione, Produttore, Foto)
      const otherWines = await prisma.wine.findMany({ where: { id: { in: otherWineIds } } });
      const updates = {};
      for (const w of otherWines) {
        if (!targetWine.country && w.country) updates.country = w.country;
        if (!targetWine.region && w.region) updates.region = w.region;
        if (!targetWine.producerCellar && w.producerCellar) updates.producerCellar = w.producerCellar;
        if (!targetWine.producer && w.producer) updates.producer = w.producer;
        if (!targetWine.classification && w.classification) updates.classification = w.classification;
        if (!targetWine.category && w.category) updates.category = w.category;
        if (!targetWine.photo && w.photo) updates.photo = w.photo;
        if (!targetWine.photoBack && w.photoBack) updates.photoBack = w.photoBack;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.wine.update({
          where: { id: targetWineId },
          data: updates
        });
      }

      // 4. Elimina le schede duplicate ormai unificate
      await prisma.wine.deleteMany({
        where: { id: { in: otherWineIds } }
      });

      syncEventEmitter.emit('db_update');
      return NextResponse.json({ success: true, message: "Vini unificati con successo" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Batch action error:", error);
    return NextResponse.json({ error: "Failed to process batch action" }, { status: 500 });
  }
}
