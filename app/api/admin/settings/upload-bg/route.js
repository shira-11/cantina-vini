import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'Nessun file fornito' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Salva il file come login-bg.png nella cartella public
    const publicDir = path.join(process.cwd(), 'public');
    const filePath = path.join(publicDir, 'login-bg.png');
    
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ success: true, message: 'Immagine di sfondo caricata con successo' });
  } catch (error) {
    console.error('Errore durante il caricamento dello sfondo:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
