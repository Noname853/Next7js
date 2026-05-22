import { PrismaClient } from '@/lib/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const url = process.env.DATABASE_URL ?? 'file:./dev.db'

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: async () => new PrismaLibSql({ url }),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
