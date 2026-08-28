import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = global;

function createPrismaClient() {
  if (globalForPrisma.prismaV3) {
    return globalForPrisma.prismaV3;
  }

  let client;
  // Se l'applicazione è in esecuzione su Vercel (Produzione Online), usa Turso Cloud DB
  if (process.env.VERCEL) {
    const TURSO_URL = process.env.TURSO_DATABASE_URL || 'libsql://cantina-vini-shira-11.aws-eu-west-1.turso.io';
    const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODcwOTA3ODEsImlkIjoiMDFhMDE2ZTQtZGQwMS03ZTUxLWIyMmEtMWJhNDQ3MjE5NWIxIiwia2lkIjoiSHc3R0dMbmtHd1YwdUs1OW9ZSGc2QnhHvZqWWkya0ZHQzU0UTlkRW9ycyIsInJpZCI6ImNkNGE5YWVlLTQ0MDAtNDFkYS05YWZhLWY0MjNhYzlmNzEwMiJ9.P2tjJLvzc_P9p-c66kaixjFxeiWQaApSMV6t3uDOYLxkEoFJtTc9nIBNfbDJ2_0o4yn7aQNUd-JQ94p1zBP9Dw';

    const libsql = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN,
    });
    // Garanzia auto-migrazione colonne su Turso Cloud
    libsql.execute(`ALTER TABLE User ADD COLUMN allowedLocations TEXT DEFAULT 'ALL';`).catch(() => {});
    libsql.execute(`ALTER TABLE User ADD COLUMN maxDevices INTEGER DEFAULT 2;`).catch(() => {});
    libsql.execute(`ALTER TABLE User ADD COLUMN canAccessInventory BOOLEAN DEFAULT 1;`).catch(() => {});

    const adapter = new PrismaLibSQL(libsql);
    client = new PrismaClient({ adapter });
  } else {
    // In ambiente Locale (localhost), usa esclusivamente il database locale SQLite cantina.db
    client = new PrismaClient();
  }

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prismaV3 = client;
  }

  return client;
}

export const prisma = createPrismaClient();
