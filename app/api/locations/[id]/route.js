import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncEventEmitter } from '@/lib/eventEmitter';

export async function PUT(request, { params }) {
  try {
    const role = request.headers.get('x-user-role');
    if (role === 'viewer') {
      return NextResponse.json({ error: "Forbidden: Viewer cannot perform this action" }, { status: 403 });
    }
    const { id } = await params;
    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const updatedLocation = await prisma.location.update({
      where: { id: parseInt(id) },
      data: { name }
    });
    
    syncEventEmitter.emit('db_update');
    return NextResponse.json(updatedLocation);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const role = request.headers.get('x-user-role');
    if (role === 'viewer') {
      return NextResponse.json({ error: "Forbidden: Viewer cannot perform this action" }, { status: 403 });
    }
    const { id } = await params;
    const locationId = parseInt(id);
    
    // Parse query params for migration
    const { searchParams } = new URL(request.url);
    const migrateToId = searchParams.get('migrateToId');
    
    // Check if location exists
    const locationToDelete = await prisma.location.findUnique({
      where: { id: locationId }
    });
    
    if (!locationToDelete) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    if (migrateToId) {
      const newLocId = parseInt(migrateToId);
      const targetLocation = await prisma.location.findUnique({
        where: { id: newLocId }
      });
      
      if (!targetLocation) {
        return NextResponse.json({ error: "Target migration location not found" }, { status: 404 });
      }

      // Find all movements that belong to the location to delete
      const movementsToUpdate = await prisma.movement.findMany({
        where: { locationId }
      });

      // Update them one by one to append to notes safely (SQLite doesn't support concat in updateMany)
      for (const movement of movementsToUpdate) {
        const migrationNote = `(Migrato da: ${locationToDelete.name})`;
        const newNotes = movement.notes ? `${movement.notes} - ${migrationNote}` : migrationNote;
        
        await prisma.movement.update({
          where: { id: movement.id },
          data: {
            locationId: newLocId,
            notes: newNotes
          }
        });
      }
    }

    // Now delete the old location
    await prisma.location.delete({
      where: { id: locationId }
    });
    
    syncEventEmitter.emit('db_update');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database Error (DELETE Location):", error);
    return NextResponse.json({ error: "Failed to delete location" }, { status: 500 });
  }
}
