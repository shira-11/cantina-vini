import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
