import { PrismaClient } from '@/lib/generated/prisma/client'
import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const url = process.env.DATABASE_URL ?? 'file:./dev.db'

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: async () => new PrismaBetterSQLite3({ url }),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
