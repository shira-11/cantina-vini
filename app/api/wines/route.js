import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncEventEmitter } from '@/lib/eventEmitter';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const showArchived = searchParams.get('archived') === 'true';

    let searchConditions = [];
    if (search) {
      const stopWords = ['di', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'vino', 'annata', 'del', 'della', 'dello', 'degli', 'delle'];
      
      const words = search.toLowerCase()
        .replace(/italiano/g, 'italia')
        .replace(/italiana/g, 'italia')
        .replace(/francese/g, 'francia')
        .replace(/spagnolo/g, 'spagna')
        .split(/[\\s,]+/)
        .filter(w => w.length > 1 && !stopWords.includes(w));

      // If after filtering we have no words, fallback to the original whole string
      const searchTerms = words.length > 0 ? words : [search.trim()];

      searchConditions = searchTerms.map(term => {
        const numVal = parseInt(term, 10);
        const isNumeric = !isNaN(numVal) && String(numVal) === term.trim();
        return {
          OR: [
            ...(isNumeric ? [{ id: { equals: numVal } }] : []),
            { name: { contains: term } },
            { country: { contains: term } },
            { category: { contains: term } },
            { producer: { contains: term } },
            { producerCellar: { contains: term } },
            { region: { contains: term } },
            { classification: { contains: term } },
            { bottleType: { contains: term } },
            { vintage: { contains: term } },
            { movements: { some: { OR: [{ bottleType: { contains: term } }, { location: { name: { contains: term } } }] } } }
          ]
        };
      });
    }

    // Fetch wines along with their movements to calculate total stock
    const wines = await prisma.wine.findMany({
      where: {
        isArchived: showArchived,
        ...(searchConditions.length > 0 ? { AND: searchConditions } : {})
      },
      include: {
        grapeVarieties: true,
        movements: {
          include: { location: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Calculate total quantity for each wine
    const winesWithStock = wines.map(wine => {
      let totalStock = 0;
      for (const m of wine.movements) {
        if (m.movementType === 'Ingresso') totalStock += m.quantity;
        else if (m.movementType === 'Uscita') totalStock -= m.quantity;
      }
      return {
        ...wine,
        totalStock
      };
    });

    return NextResponse.json(winesWithStock);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to fetch wines" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const role = request.headers.get('x-user-role');
    if (role === 'viewer') {
      return NextResponse.json({ error: "Forbidden: Viewer cannot perform this action" }, { status: 403 });
    }
    const data = await request.json();
    const currentUser = request.headers.get('x-user-username');

    const newWine = await prisma.wine.create({
      data: {
        name: data.name,
        vintage: data.vintage,
        country: data.country,
        region: data.region,
        producerCellar: data.producerCellar,
        producer: data.producer,
        classification: data.classification,
        category: data.category,
        type: data.type,
        alcoholContent: data.alcoholContent ? parseFloat(data.alcoholContent) : null,
        tempMin: data.tempMin ? parseFloat(data.tempMin) : null,
        tempMax: data.tempMax ? parseFloat(data.tempMax) : null,
        bottleType: data.bottleType || data._initialBottleType || null,
        notes: data.notes,
        photo: data.photo,
        photoBack: data.photoBack,
        movements: {
          create: (() => {
            const movs = [];
            if (data.movements?.filter(m => m.isNew || String(m.id).startsWith('temp-')).length > 0) {
              data.movements.filter(m => m.isNew || String(m.id).startsWith('temp-')).forEach(m => {
                movs.push({
                  date: new Date(m.date),
                  movementType: m.movementType,
                  quantity: m.quantity,
                  bottleType: m.bottleType,
                  reason: m.reason,
                  vendor: m.vendor,
                  price: m.price ? parseFloat(m.price) : null,
                  tempPrice: m.tempPrice ? parseFloat(m.tempPrice) : null,
                  locationId: parseInt(m.locationId || m.location?.id),
                  notes: m.notes || '',
                  user: m.user || currentUser || null
                });
              });
            }
            // Always log the creation of the wine record
            const locId = (data.movements && data.movements[0]?.locationId) ? parseInt(data.movements[0].locationId) : 1;
            movs.push({
              date: new Date(),
              movementType: 'Modifica',
              quantity: 0,
              reason: 'Nuova Scheda Vino',
              locationId: locId,
              notes: 'Nuova scheda vino aggiunta al gestionale',
              user: currentUser || null
            });
            return movs;
          })()
        },
        grapeVarieties: (data.grapeVarieties?.filter(g => g.name && g.name.trim() !== '').length > 0) ? {
          create: data.grapeVarieties.filter(g => g.name && g.name.trim() !== '').map(g => ({
            name: g.name,
            percentage: g.percentage ? parseFloat(g.percentage) : null
          }))
        } : undefined
      }
    });

    syncEventEmitter.emit('db_update');
    return NextResponse.json(newWine, { status: 201 });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to create wine" }, { status: 500 });
  }
}
