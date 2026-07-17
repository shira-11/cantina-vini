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
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Batch action error:", error);
    return NextResponse.json({ error: "Failed to process batch action" }, { status: 500 });
  }
}
