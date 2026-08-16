import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sessions = await prisma.inventorySession.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { items: true }
        },
        items: {
          select: {
            id: true,
            expectedQty: true,
            countedQty: true,
            isChecked: true
          }
        }
      }
    });

    const formattedSessions = sessions.map(session => {
      const totalItems = session.items.length;
      const checkedItems = session.items.filter(i => i.isChecked).length;
      const totalExpected = session.items.reduce((sum, i) => sum + (i.expectedQty || 0), 0);
      const totalCounted = session.items.reduce((sum, i) => sum + (i.countedQty !== null ? i.countedQty : 0), 0);
      const hasDiscrepancy = session.items.some(i => i.countedQty !== null && i.countedQty !== i.expectedQty);

      return {
        id: session.id,
        title: session.title,
        year: session.year,
        status: session.status,
        notes: session.notes,
        createdBy: session.createdBy,
        createdAt: session.createdAt,
        completedAt: session.completedAt,
        totalItems,
        checkedItems,
        totalExpected,
        totalCounted,
        hasDiscrepancy
      };
    });

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error("Failed to fetch inventory sessions:", error);
    return NextResponse.json({ error: "Failed to fetch inventory sessions" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, year, notes, createdBy, locationId } = body;

    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const sessionTitle = title && title.trim() !== '' ? title.trim() : `Inventario ${currentYear}`;

    // Fetch all active non-archived wines with their movements and locations
    const wines = await prisma.wine.findMany({
      where: { isArchived: false },
      include: {
        movements: {
          include: { location: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const locations = await prisma.location.findMany({
      orderBy: { name: 'asc' }
    });

    // Prepare inventory items
    const itemsToCreate = [];

    for (const wine of wines) {
      // Calculate stock per location for this wine
      const locStockMap = new Map();
      
      for (const m of wine.movements) {
        if (!m.locationId) continue;
        const locId = m.locationId;
        const current = locStockMap.get(locId) || 0;
        const qty = m.quantity || 0;
        if (m.movementType === 'Ingresso') locStockMap.set(locId, current + qty);
        else if (m.movementType === 'Uscita') locStockMap.set(locId, current - qty);
      }

      // If a specific locationId filter was requested for this session
      if (locationId) {
        const targetLocId = parseInt(locationId);
        const stock = locStockMap.get(targetLocId) || 0;
        itemsToCreate.push({
          wineId: wine.id,
          locationId: targetLocId,
          expectedQty: stock > 0 ? stock : 0,
          countedQty: null,
          isChecked: false
        });
      } else {
        // Create an item for each location where stock exists or has movements
        if (locStockMap.size > 0) {
          for (const [locId, stock] of locStockMap.entries()) {
            if (stock > 0 || wine.movements.some(m => m.locationId === locId)) {
              itemsToCreate.push({
                wineId: wine.id,
                locationId: locId,
                expectedQty: stock > 0 ? stock : 0,
                countedQty: null,
                isChecked: false
              });
            }
          }
        } else if (locations.length > 0) {
          // If no movements yet, attach to first location with 0 stock
          itemsToCreate.push({
            wineId: wine.id,
            locationId: locations[0].id,
            expectedQty: 0,
            countedQty: null,
            isChecked: false
          });
        }
      }
    }

    if (!prisma.inventorySession || !prisma.inventoryItem) {
      throw new Error("I modelli di inventario non sono ancora stati caricati nell'istanza Prisma Client. Riavviare il server.");
    }

    // 1. Create session first
    const session = await prisma.inventorySession.create({
      data: {
        title: sessionTitle,
        year: currentYear,
        status: 'in_progress',
        notes: notes || null,
        createdBy: createdBy || null
      }
    });

    // 2. Insert items in batches of 250 to stay well under SQL parameter limits
    const itemsWithSessionId = itemsToCreate.map(item => ({
      ...item,
      sessionId: session.id
    }));

    const batchSize = 250;
    for (let i = 0; i < itemsWithSessionId.length; i += batchSize) {
      const batch = itemsWithSessionId.slice(i, i + batchSize);
      try {
        await prisma.inventoryItem.createMany({
          data: batch
        });
      } catch (errMany) {
        // Fallback to transaction if createMany fails
        await prisma.$transaction(
          batch.map(item => prisma.inventoryItem.create({ data: item }))
        );
      }
    }

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("Failed to create inventory session:", error);
    return NextResponse.json({ error: "Errore creazione inventario: " + error.message }, { status: 500 });
  }
}
