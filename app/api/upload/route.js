import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const role = request.headers.get('x-user-role');
    if (role === 'viewer') {
      return NextResponse.json({ error: "Forbidden: Viewer cannot perform this action" }, { status: 403 });
    }
    const formData = await request.formData();
    const file = formData.get('file');
    const wineName = formData.get('wineName') || 'Sconosciuto';
    const vintage = formData.get('vintage') || '';
    const type = formData.get('type') || 'front';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/foto_bottiglie directory
    const uploadDir = path.join(process.cwd(), 'public', 'foto_bottiglie');
    
    // Ensure directory exists
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    // Create unique filename based on wine name
    const safeName = wineName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const safeVintage = vintage.replace(/[^0-9]/g, '');
    const extension = path.extname(file.name) || '.jpg';
    
    const timestamp = Date.now();
    const savedFilename = `${safeName}${safeVintage ? '_' + safeVintage : ''}_${type}_${timestamp}${extension}`;
    const filePath = path.join(uploadDir, savedFilename);

    await fs.writeFile(filePath, buffer);

    // Esegui la pulizia (cleanup) delle vecchie foto archiviate
    try {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const oldPhotos = await prisma.winePhoto.findMany({
        where: { createdAt: { lt: sixtyDaysAgo } }
      });

      for (const oldPhoto of oldPhotos) {
        if (oldPhoto.url) {
          try {
            const filename = oldPhoto.url.split('/').pop();
            const oldFilePath = path.join(uploadDir, filename);
            await fs.unlink(oldFilePath);
          } catch (err) {
            console.error('Failed to delete old physical file:', err);
          }
        }
      }

      if (oldPhotos.length > 0) {
        await prisma.winePhoto.deleteMany({
          where: { createdAt: { lt: sixtyDaysAgo } }
        });
        console.log(`Cleaned up ${oldPhotos.length} old photos from archive.`);
      }
    } catch (cleanupError) {
      console.error('Error during photo cleanup:', cleanupError);
    }

    return NextResponse.json({ url: `/foto_bottiglie/${savedFilename}` }, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
  }
}
