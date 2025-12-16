import { PrismaClient } from '@generated'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.POSTGRES_URI })

export const prisma = new PrismaClient({ adapter })
export * from './Guild'
export * from './User'