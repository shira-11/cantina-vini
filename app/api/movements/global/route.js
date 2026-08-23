import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 100;
    const page = parseInt(searchParams.get('page')) || 1;
    const skip = (page - 1) * limit;

    const movements = await prisma.movement.findMany({
      skip,
      take: limit,
      orderBy: {
        date: 'desc'
      },
      include: {
        wine: {
          select: {
            id: true,
            name: true,
            vintage: true,
            producer: true,
            photo: true
          }
        },
        location: {
          select: {
            name: true
          }
        }
      }
    });

    const total = await prisma.movement.count();

    return NextResponse.json({
      movements,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching global movements:', error);
    return NextResponse.json({ error: 'Failed to fetch global movements' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const role = request.headers.get('x-user-role');
    if (role === 'viewer') {
      return NextResponse.json({ error: "Forbidden: Viewer cannot perform this action" }, { status: 403 });
    }
    const currentUser = request.headers.get('x-user-username');
    const { pin, scope } = await request.json();

    // Verification of Deletion PIN from SystemSettings
    const pinSetting = await prisma.systemSettings.findFirst({
      where: { key: 'deletion_pin' }
    });
    const expectedPin = pinSetting?.value || '1234';

    if (String(pin || '').trim() !== String(expectedPin).trim()) {
      return NextResponse.json({ error: "PIN di sicurezza errato. Operazione annullata." }, { status: 401 });
    }

    // Svuota ESCLUSIVAMENTE la lista degli eventi di log/audit, SENZA MAI TOCCARE LE BOTTIGLIE E LE GIACENZE REALI (Ingresso/Uscita)!
    await prisma.movement.deleteMany({
      where: {
        OR: [
          { movementType: 'Modifica' },
          { movementType: 'Modifica Scheda' },
          { movementType: 'Modifica Movimento' },
          { movementType: 'Eliminazione Movimento' },
          { reason: 'Nuova Scheda Vino' },
          { reason: 'Modifica della scheda' }
        ]
      }
    });

    const { syncEventEmitter } = await import('@/lib/eventEmitter');
    syncEventEmitter.emit('db_update');

    return NextResponse.json({ success: true, message: 'Visualizzazione del registro svuotata con successo. Le giacenze e le bottiglie in cantina sono rimaste intatte al 100%.' });
  } catch (error) {
    console.error('Error clearing global movement log:', error);
    return NextResponse.json({ error: 'Errore durante lo svuotamento del registro' }, { status: 500 });
  }
}
