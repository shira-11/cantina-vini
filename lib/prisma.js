import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const globalForPrisma = global;

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  if (process.env.VERCEL) {
    const tmpDbPath = '/tmp/cantina.db';
    if (!fs.existsSync(tmpDbPath)) {
      const origDbPath = path.join(process.cwd(), 'prisma', 'cantina.db');
      if (fs.existsSync(origDbPath)) {
        try {
          fs.copyFileSync(origDbPath, tmpDbPath);
        } catch (e) {
          console.error("Failed to copy database to /tmp:", e);
        }
      }
    }
    return `file:${tmpDbPath}`;
  }

  return undefined;
}

const dbUrl = getDatabaseUrl();

export const prisma =
  globalForPrisma.prismaV3 ||
  new PrismaClient({
    log: ['query'],
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {})
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaV3 = prisma;
