import { PrismaClient } from '@generated'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const adapter = new PrismaLibSql({ url: 'file:prisma/database.db' })
export const prisma = new PrismaClient({ adapter })
