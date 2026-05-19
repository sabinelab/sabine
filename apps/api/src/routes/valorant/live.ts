import { prisma } from '@db'
import type { FastifyInstance } from 'fastify'

export default function (fastify: FastifyInstance) {
  fastify.get('/live/valorant', {}, async () => {
    const matches = await prisma.valLiveMatch.findMany({
      include: {
        teams: true
      }
    })

    return matches.map(
      ({ tournamentFullName: _tournamentFullName, tournamentImage, tournamentName, ...m }) =>
        Object.assign(m, {
          tournament: {
            name: tournamentName,
            image: tournamentImage
          }
        })
    )
  })
}