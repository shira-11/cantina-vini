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

    // Trova il movimento per vedere se ha un Ingresso associato
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
    
    const oldMovement = await prisma.movement.findUnique({ where: { id: movementId } });

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
