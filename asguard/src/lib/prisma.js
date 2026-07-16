import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl.startsWith('"')) dbUrl = dbUrl.slice(1, -1);
if (dbUrl.startsWith("'")) dbUrl = dbUrl.slice(1, -1);

const prismaClientSingleton = () => {
  const adapter = new PrismaNeon({ connectionString: dbUrl })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
