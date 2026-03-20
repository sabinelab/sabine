import { prisma } from '@db'
import type { FastifyInstance } from 'fastify'

export default function (fastify: FastifyInstance) {
  fastify.get('/events/valorant', {}, async () => {
    return await prisma.valEvent.findMany()
  })
}
