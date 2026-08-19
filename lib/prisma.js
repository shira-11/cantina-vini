import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = global;

const TURSO_URL = process.env.TURSO_DATABASE_URL || 'libsql://cantina-vini-shira-11.aws-eu-west-1.turso.io';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODcwOTA3ODEsImlkIjoiMDFhMDE2ZTQtZGQwMS03ZTUxLWIyMmEtMWJhNDQ3MjE5NWIxIiwia2lkIjoiSHc3R0dMbmtHd1YwdUs1OW9ZSGc2QnhHdlZqWWkya0ZHQzU0UTlkRW9ycyIsInJpZCI6ImNkNGE5YWVlLTQ0MDAtNDFkYS05YWZhLWY0MjNhYzlmNzEwMiJ9.P2tjJLvzc_P9p-c66kaixjFxeiWQaApSMV6t3uDOYLxkEoFJtTc9nIBNfbDJ2_0o4yn7aQNUd-JQ94p1zBP9Dw';

function createPrismaClient() {
  if (globalForPrisma.prismaV3) {
    return globalForPrisma.prismaV3;
  }

  let client;
  if (process.env.VERCEL) {
    const libsql = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN,
    });
    const adapter = new PrismaLibSql(libsql);
    client = new PrismaClient({ adapter });
  } else {
    client = new PrismaClient({ log: ['query'] });
  }

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prismaV3 = client;
  }

  return client;
}

export const prisma = createPrismaClient();
