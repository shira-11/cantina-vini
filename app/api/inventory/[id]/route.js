import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncEventEmitter } from '@/lib/eventEmitter';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id);

    const session = await prisma.inventorySession.findUnique({
      where: { id: sessionId },
      include: {
        items: {
          include: {
            wine: {
              select: {
                id: true,
                name: true,
                vintage: true,
                bottleType: true,
                producer: true,
                producerCellar: true,
                country: true,
                category: true,
                photo: true
              }
            },
            location: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: [
            { wine: { name: 'asc' } },
            { wine: { vintage: 'asc' } }
          ]
        }
      }
    });

    if (!session) {
      return NextResponse.json({ error: "Session non trovata" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Failed to fetch inventory session details:", error);
    return NextResponse.json({ error: "Errore durante il recupero dell'inventario" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id);
    const body = await request.json();

    // Batch update items
    if (body.items && Array.isArray(body.items)) {
      const updatePromises = body.items.map(item => {
        return prisma.inventoryItem.update({
          where: { id: item.id },
          data: {
            countedQty: item.countedQty !== undefined ? item.countedQty : undefined,
            isChecked: item.isChecked !== undefined ? item.isChecked : undefined,
            notes: item.notes !== undefined ? item.notes : undefined
          }
        });
      });

      await Promise.all(updatePromises);
    }

    // Single item update
    if (body.itemId) {
      await prisma.inventoryItem.update({
        where: { id: parseInt(body.itemId) },
        data: {
          countedQty: body.countedQty !== undefined ? body.countedQty : undefined,
          isChecked: body.isChecked !== undefined ? body.isChecked : undefined,
          notes: body.notes !== undefined ? body.notes : undefined
        }
      });
    }

    // Session update (status, notes, title)
    if (body.status || body.notes || body.title) {
      await prisma.inventorySession.update({
        where: { id: sessionId },
        data: {
          status: body.status || undefined,
          notes: body.notes || undefined,
          title: body.title || undefined
        }
      });
    }

    const updatedSession = await prisma.inventorySession.findUnique({
      where: { id: sessionId },
      include: {
        items: {
          include: {
            wine: true,
            location: true
          }
        }
      }
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("Failed to update inventory session:", error);
    return NextResponse.json({ error: "Errore durante l'aggiornamento dell'inventario" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id);
    const body = await request.json();
    const currentUser = request.headers.get('x-user-username') || 'Sistema';

    const session = await prisma.inventorySession.findUnique({
      where: { id: sessionId },
      include: {
        items: {
          include: {
            wine: true,
            location: true
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json({ error: "Sessione non trovata" }, { status: 404 });
    }

    if (body.action === 'finalize') {
      const createdMovements = [];

      for (const item of session.items) {
        // If countedQty was set and differs from expectedQty
        const counted = item.countedQty !== null ? item.countedQty : item.expectedQty;
        const expected = item.expectedQty || 0;
        const diff = counted - expected;

        if (diff !== 0 && item.wineId && item.locationId) {
          const movement = await prisma.movement.create({
            data: {
              wineId: item.wineId,
              locationId: item.locationId,
              movementType: diff > 0 ? 'Ingresso' : 'Uscita',
              quantity: Math.abs(diff),
              bottleType: item.wine.bottleType || null,
              reason: `Rettifica Inventario ${session.year} (${session.title})`,
              notes: item.notes || `Rettifica automatica da conteggio inventario (${expected} -> ${counted})`,
              user: currentUser,
              date: new Date()
            }
          });
          createdMovements.push(movement);
        }
      }

      const completedSession = await prisma.inventorySession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      });

      syncEventEmitter.emit('db_update');

      return NextResponse.json({
        message: "Inventario completato e rettifiche applicate con successo",
        session: completedSession,
        movementsCreated: createdMovements.length
      });
    }

    if (body.action === 'cancel') {
      const cancelledSession = await prisma.inventorySession.update({
        where: { id: sessionId },
        data: {
          status: 'cancelled'
        }
      });

      return NextResponse.json({
        message: "Inventario annullato",
        session: cancelledSession
      });
    }

    return NextResponse.json({ error: "Azione non valida" }, { status: 400 });
  } catch (error) {
    console.error("Failed to process inventory action:", error);
    return NextResponse.json({ error: "Errore nella gestione della chiusura inventario: " + error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id);

    await prisma.inventoryItem.deleteMany({
      where: { sessionId }
    });

    await prisma.inventorySession.delete({
      where: { id: sessionId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete inventory session:", error);
    return NextResponse.json({ error: "Errore durante l'eliminazione dell'inventario" }, { status: 500 });
  }
}
