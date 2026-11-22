import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncEventEmitter } from '@/lib/eventEmitter';
import { addCustomMetadata } from '@/lib/metadata';

export async function POST(request) {
  try {
    const role = request.headers.get('x-user-role');
    if (role === 'viewer') {
      return NextResponse.json({ error: "Forbidden: Viewer cannot perform this action" }, { status: 403 });
    }
    const data = await request.json();
    const currentUser = request.headers.get('x-user-username');
    
    const movement = await prisma.movement.create({
      data: {
        wineId: parseInt(data.wineId),
        locationId: parseInt(data.locationId),
        movementType: data.movementType, // 'Ingresso' | 'Uscita'
        quantity: parseInt(data.quantity),
        date: data.date ? new Date(data.date) : undefined,
        bottleType: data.bottleType,
        collocation: data.collocation || null,
        shelfNumber: data.shelfNumber || null,
        reason: data.reason,
        vendor: data.vendor,
        price: data.price ? parseFloat(data.price) : null,
        tempPrice: data.tempPrice ? parseFloat(data.tempPrice) : null,
        notes: data.notes || '',
        user: data.user || currentUser || null
      }
    });
    if (data.collocation) await addCustomMetadata('collocation', data.collocation);
    if (data.shelfNumber) await addCustomMetadata('shelfNumber', data.shelfNumber);
    if (data.bottleType) await addCustomMetadata('bottleType', data.bottleType);
    if (data.reason) await addCustomMetadata('reason', data.reason);
    if (data.vendor) await addCustomMetadata('vendor', data.vendor);

    syncEventEmitter.emit('db_update');
    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to create movement" }, { status: 500 });
  }
}
