import { prisma } from '@db'
import type { FastifyInstance } from 'fastify'

export default function (fastify: FastifyInstance) {
  fastify.get('/matches/valorant', {}, async () => {
    const matches = await prisma.valMatch.findMany({
      include: {
        teams: true
      }
    })

    return matches.map(({ tournamentFullName, tournamentImage, tournamentName, ...m }) => ({
      // eslint-disable-line
      ...m,
      tournament: {
        name: tournamentName,
        image: tournamentImage
      }
    }))
  })
}
