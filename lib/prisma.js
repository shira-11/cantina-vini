import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const globalForPrisma = global;

function prepareVercelDatabase() {
  if (!process.env.VERCEL) return process.env.DATABASE_URL;

  const tmpDbPath = '/tmp/cantina.db';
  try {
    if (!fs.existsSync(tmpDbPath)) {
      const origDbPath = path.join(process.cwd(), 'prisma', 'cantina.db');
      if (fs.existsSync(origDbPath)) {
        fs.copyFileSync(origDbPath, tmpDbPath);
      }
    }
    return `file:${tmpDbPath}`;
  } catch (err) {
    console.error("Vercel DB copy error:", err);
    return process.env.DATABASE_URL;
  }
}

function createPrismaClient() {
  if (globalForPrisma.prismaV3) {
    return globalForPrisma.prismaV3;
  }

  const dbUrl = prepareVercelDatabase();

  const client = new PrismaClient({
    log: ['query'],
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {})
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prismaV3 = client;
  }

  return client;
}

export const prisma = createPrismaClient();
