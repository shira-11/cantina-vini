import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncEventEmitter } from '@/lib/eventEmitter';

export async function DELETE(request, { params }) {
  try {
    const role = request.headers.get('x-user-role');
    if (role === 'viewer') {
      return NextResponse.json({ error: "Forbidden: Viewer cannot perform this action" }, { status: 403 });
    }
    const { id } = await params;
    const movementId = parseInt(id);

    if (!isNaN(movementId)) {
      const movement = await prisma.movement.findUnique({ where: { id: movementId } });
      if (movement) {
        if (movement.movementType === 'Uscita') {
          const pairedMovements = await prisma.movement.findMany({
            where: {
              wineId: movement.wineId,
              movementType: 'Ingresso',
              reason: { startsWith: 'Trasf. da' }
            }
          });
          
          let paired = null;
          let minDiff = Infinity;
          const oldDateTime = new Date(movement.date).getTime();
          for (const m of pairedMovements) {
            const diff = Math.abs(new Date(m.date).getTime() - oldDateTime);
            if (diff < minDiff) {
              minDiff = diff;
              paired = m;
            }
          }
          
          if (paired) {
            await prisma.movement.delete({ where: { id: paired.id } }).catch(() => {});
          }
        }

        await prisma.movement.delete({ where: { id: movementId } }).catch(() => {});
      }
    }

    syncEventEmitter.emit('db_update');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to delete movement" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const role = request.headers.get('x-user-role');
    if (role === 'viewer') {
      return NextResponse.json({ error: "Forbidden: Viewer cannot perform this action" }, { status: 403 });
    }
    const { id } = await params;
    const movementId = parseInt(id);
    const body = await request.json();

    const oldMovement = !isNaN(movementId) ? await prisma.movement.findUnique({ where: { id: movementId } }) : null;

    let resultMovement;

    if (oldMovement) {
      resultMovement = await prisma.movement.update({
        where: { id: movementId },
        data: {
          date: body.date ? new Date(body.date) : new Date(),
          movementType: body.movementType || oldMovement.movementType,
          quantity: body.quantity !== undefined ? parseInt(body.quantity) : oldMovement.quantity,
          bottleType: body.bottleType ?? oldMovement.bottleType,
          reason: body.reason ?? oldMovement.reason,
          vendor: body.vendor ?? oldMovement.vendor,
          price: body.price ? parseFloat(body.price) : null,
          tempPrice: body.tempPrice ? parseFloat(body.tempPrice) : null,
          notes: body.notes ?? oldMovement.notes,
          location: body.locationId ? { connect: { id: parseInt(body.locationId) } } : undefined
        }
      });

      if (oldMovement.movementType === 'Uscita') {
        const pairedMovements = await prisma.movement.findMany({
          where: {
            wineId: oldMovement.wineId,
            movementType: 'Ingresso',
            reason: { startsWith: 'Trasf. da' }
          }
        });
        
        let paired = null;
        let minDiff = Infinity;
        const oldDateTime = new Date(oldMovement.date).getTime();
        for (const m of pairedMovements) {
          const diff = Math.abs(new Date(m.date).getTime() - oldDateTime);
          if (diff < minDiff) {
            minDiff = diff;
            paired = m;
          }
        }
        
        if (paired) {
          await prisma.movement.update({
            where: { id: paired.id },
            data: {
              date: body.date ? new Date(body.date) : new Date(),
              quantity: body.quantity !== undefined ? parseInt(body.quantity) : paired.quantity,
              bottleType: body.bottleType ?? paired.bottleType,
              price: body.price ? parseFloat(body.price) : null,
              tempPrice: body.tempPrice ? parseFloat(body.tempPrice) : null,
              notes: body.notes ?? paired.notes
            }
          }).catch(() => {});
        }
      }
    } else {
      // Upsert/Create fallback if ID is temp or record not found
      resultMovement = await prisma.movement.create({
        data: {
          date: body.date ? new Date(body.date) : new Date(),
          movementType: body.movementType || 'Ingresso',
          quantity: parseInt(body.quantity) || 0,
          bottleType: body.bottleType || 'Normale 0.75',
          reason: body.reason || '',
          vendor: body.vendor || '',
          price: body.price ? parseFloat(body.price) : null,
          tempPrice: body.tempPrice ? parseFloat(body.tempPrice) : null,
          notes: body.notes || '',
          locationId: parseInt(body.locationId),
          wineId: parseInt(body.wineId)
        }
      });
    }

    syncEventEmitter.emit('db_update');
    return NextResponse.json(resultMovement);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update movement" }, { status: 500 });
  }
}
