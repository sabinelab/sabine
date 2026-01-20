import { prisma } from '@db'
import type { FastifyInstance } from 'fastify'

export default function (fastify: FastifyInstance) {
  fastify.get('/news/valorant', {}, async () => {
    return await prisma.news.findMany()
  })
}
