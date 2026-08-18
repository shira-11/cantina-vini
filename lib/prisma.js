import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const globalForPrisma = global;

function getDatabaseUrl() {
  if (process.env.VERCEL) {
    const tmpDbPath = '/tmp/cantina.db';
    if (!fs.existsSync(tmpDbPath)) {
      const candidates = [
        path.join(process.cwd(), 'prisma', 'cantina.db'),
        path.join(process.cwd(), 'cantina.db'),
        path.join(__dirname, '..', 'prisma', 'cantina.db')
      ];
      for (const origPath of candidates) {
        if (fs.existsSync(origPath)) {
          try {
            fs.copyFileSync(origPath, tmpDbPath);
            break;
          } catch (e) {
            console.error("Failed to copy db from", origPath, e);
          }
        }
      }
    }
    return `file:${tmpDbPath}`;
  }

  return process.env.DATABASE_URL;
}

const dbUrl = getDatabaseUrl();

export const prisma =
  globalForPrisma.prismaV3 ||
  new PrismaClient({
    log: ['query'],
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {})
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaV3 = prisma;
