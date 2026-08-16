import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

export const prisma =
  globalForPrisma.prismaV3 ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaV3 = prisma;
