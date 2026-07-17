import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncEventEmitter } from '@/lib/eventEmitter';

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(locations);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const role = request.headers.get('x-user-role');
    if (role === 'viewer') {
      return NextResponse.json({ error: "Forbidden: Viewer cannot perform this action" }, { status: 403 });
    }
    const data = await request.json();
    if (!data.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const newLocation = await prisma.location.create({
      data: { name: data.name }
    });
    syncEventEmitter.emit('db_update');
    return NextResponse.json(newLocation, { status: 201 });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 });
  }
}
