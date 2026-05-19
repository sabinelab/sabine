import { prisma } from '@db'
import type { FastifyInstance } from 'fastify'

export default function (fastify: FastifyInstance) {
  fastify.get('/matches/valorant', {}, async () => {
    const matches = await prisma.valMatch.findMany({
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