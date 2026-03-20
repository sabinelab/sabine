import { prisma } from '@db'
import type { FastifyInstance } from 'fastify'

export default function (fastify: FastifyInstance) {
  fastify.get('/live/lol', {}, async () => {
    const matches = await prisma.lolLiveMatch.findMany({
      include: {
        teams: true,
        streams: true
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
