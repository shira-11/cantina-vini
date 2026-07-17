import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || '';

    if (!name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Find the first wine that has the same name and has some photo or metadata
    const wine = await prisma.wine.findFirst({
      where: {
        name: {
          equals: name.trim() // case insensitive in SQLite by default for equals? wait, sqlite equals is case sensitive for non-ascii but generally Prisma handles it or we can just use equals. 
        }
      },
      orderBy: {
        id: 'desc' // get the most recently created one
      },
      include: {
        grapeVarieties: true
      }
    });

    if (!wine) {
      // Let's also try a case-insensitive search if strict equals fails
      const wineSearch = await prisma.wine.findFirst({
        where: {
           name: {
             contains: name.trim()
           }
        },
        orderBy: {
          id: 'desc'
        },
        include: {
          grapeVarieties: true
        }
      });
      if (!wineSearch || wineSearch.name.toLowerCase() !== name.trim().toLowerCase()) {
         return NextResponse.json(null);
      }
      return NextResponse.json(wineSearch);
    }

    return NextResponse.json(wine);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to fetch wine metadata" }, { status: 500 });
  }
}
