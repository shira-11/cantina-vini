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

    const currentUser = request.headers.get('x-user-username');

    // Trova il movimento per vedere se ha un Ingresso associato ed effettuare il tracciamento
    const movement = await prisma.movement.findUnique({ where: { id: movementId } });
    if (movement && movement.movementType === 'Uscita') {
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
         await prisma.movement.delete({ where: { id: paired.id } });
       }
    }

    // Registra evento nel log storico prima di eliminare il movimento principale
    if (movement && !movement.movementType.includes('Eliminazione')) {
      await prisma.movement.create({
        data: {
          date: new Date(),
          movementType: 'Eliminazione Movimento',
          quantity: 0,
          reason: `Eliminato movimento di ${movement.movementType}`,
          locationId: movement.locationId,
          wineId: movement.wineId,
          notes: `Movimento (${movement.movementType}: ${movement.quantity > 0 ? movement.quantity + ' bt' : '0 bt'}, ${movement.reason || ''}) eliminato`,
          user: currentUser || null
        }
      });
    }

    await prisma.movement.delete({
      where: { id: movementId }
    });
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
    
    const currentUser = request.headers.get('x-user-username');
    const oldMovement = await prisma.movement.findUnique({ where: { id: movementId } });

    if (oldMovement && !oldMovement.movementType.includes('Modifica Movimento')) {
      await prisma.movement.create({
        data: {
          date: new Date(),
          movementType: 'Modifica Movimento',
          quantity: 0,
          reason: `Modificato movimento di ${oldMovement.movementType}`,
          locationId: parseInt(body.locationId) || oldMovement.locationId,
          wineId: oldMovement.wineId,
          notes: `Movimento (${oldMovement.movementType}) aggiornato: Qta ${oldMovement.quantity} ➔ ${body.quantity}`,
          user: currentUser || null
        }
      });
    }

    const updatedMovement = await prisma.movement.update({
      where: { id: movementId },
      data: {
        date: new Date(body.date),
        movementType: body.movementType,
        quantity: parseInt(body.quantity),
        bottleType: body.bottleType,
        reason: body.reason,
        vendor: body.vendor,
        price: body.price ? parseFloat(body.price) : null,
        tempPrice: body.tempPrice ? parseFloat(body.tempPrice) : null,
        notes: body.notes || '',
        location: { connect: { id: parseInt(body.locationId) } }
      }
    });

    if (oldMovement && oldMovement.movementType === 'Uscita') {
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
             date: new Date(body.date),
             quantity: parseInt(body.quantity),
             bottleType: body.bottleType,
             price: body.price ? parseFloat(body.price) : null,
             tempPrice: body.tempPrice ? parseFloat(body.tempPrice) : null,
             notes: body.notes || '',
           }
         });
       }
    }
    
    syncEventEmitter.emit('db_update');
    return NextResponse.json(updatedMovement);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update movement", stack: error.stack }, { status: 500 });
  }
}
