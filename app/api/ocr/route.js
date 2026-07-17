import { NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Run Tesseract
    console.log("Starting OCR processing...");
    const { data: { text } } = await Tesseract.recognize(
      buffer,
      'ita', // Language: Italian
      { logger: m => console.log(`[Tesseract] ${m.status}: ${Math.round(m.progress * 100)}%`) }
    );

    return NextResponse.json({ text });
  } catch (error) {
    console.error('OCR Error:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
