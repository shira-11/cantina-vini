import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncEventEmitter } from '@/lib/eventEmitter';

export async function POST(request, { params }) {
  try {
    const role = request.headers.get('x-user-role');
    if (role === 'viewer') {
      return NextResponse.json({ error: "Accesso negato: i visitatori non possono svuotare le cantine" }, { status: 403 });
    }

    const { id } = await params;
    const locationId = parseInt(id, 10);

    if (isNaN(locationId)) {
      return NextResponse.json({ error: "ID cantina non valido" }, { status: 400 });
    }

    const location = await prisma.location.findUnique({
      where: { id: locationId }
    });

    if (!location) {
      return NextResponse.json({ error: "Cantina non trovata" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const clearMovements = body.clearMovements === true;

    if (clearMovements) {
      // Svuotamento COMPLETO: azzera giacenze ed elimina TUTTI i movimenti della cantina
      const deletedMovements = await prisma.movement.deleteMany({
        where: { locationId }
      });

      syncEventEmitter.emit('db_update');

      return NextResponse.json({
        success: true,
        message: `Cantina "${location.name}" svuotata totalmente. Azzerate le giacenze ed eliminati ${deletedMovements.count} movimenti dallo storico.`,
        deletedMovementsCount: deletedMovements.count
      });
    }

    // Troviamo tutti i movimenti della cantina selezionata
    const movements = await prisma.movement.findMany({
      where: { locationId }
    });

    // Calcoliamo la giacenza attuale per ogni vino in QUESTA specifica cantina
    const wineStockMap = new Map(); // wineId -> quantity
    for (const m of movements) {
      const current = wineStockMap.get(m.wineId) || 0;
      if (m.movementType === 'Ingresso') {
        wineStockMap.set(m.wineId, current + m.quantity);
      } else if (m.movementType === 'Uscita') {
        wineStockMap.set(m.wineId, current - m.quantity);
      }
    }

    let clearedWinesCount = 0;
    let clearedBottlesCount = 0;
    const username = request.headers.get('x-user-username') || 'Admin';

    // Per ogni vino con giacenza > 0 in QUESTA cantina, inseriamo un movimento di Uscita per azzerare
    for (const [wineId, stock] of wineStockMap.entries()) {
      if (stock > 0) {
        await prisma.movement.create({
          data: {
            wineId,
            locationId,
            movementType: 'Uscita',
            quantity: stock,
            reason: 'Svuotamento Cantina',
            notes: `Svuotamento manuale cantina: ${location.name}`,
            user: username
          }
        });
        clearedWinesCount++;
        clearedBottlesCount += stock;
      }
    }

    syncEventEmitter.emit('db_update');

    return NextResponse.json({
      success: true,
      message: `Cantina "${location.name}" svuotata con successo. Azzerate ${clearedBottlesCount} bottiglie di ${clearedWinesCount} vini (storico movimenti conservato).`,
      clearedWinesCount,
      clearedBottlesCount
    });
  } catch (error) {
    console.error("Error clearing location stock:", error);
    return NextResponse.json({ error: "Errore durante lo svuotamento della cantina" }, { status: 500 });
  }
}
