import { prisma } from '@db'
import type { FastifyInstance } from 'fastify'

export default function (fastify: FastifyInstance) {
  fastify.get('/live/valorant', {}, async () => {
    const matches = await prisma.valLiveMatch.findMany({
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
