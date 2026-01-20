import { prisma } from '@db'
import type { FastifyInstance } from 'fastify'

export default function (fastify: FastifyInstance) {
  fastify.get('/events/lol', {}, async () => {
    return await prisma.lolEvent.findMany()
  })
}
