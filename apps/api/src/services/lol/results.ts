import { env } from '@/env'
import type { ResultsData } from '../../../types/index'

export default {
  get: async () => {
    const res = await fetch(
      'https://api.pandascore.co/lol/matches/past?per_page=100&sort=-end_at&filter[status]=finished',
      {
        headers: {
          accept: 'application/json',
          authorization: env.PANDA_TOKEN
        },
        cache: 'no-store'
      }
    )

    if (!res.ok) return []

    const data = await res.json()

    if (!data.length) return []

    const matches: ResultsData[] = data.map((e: any) => {
      const winnerScore = Math.max(e.results[0]?.score, e.results[1]?.score)

      return {
        id: e.id.toString(),
        teams: [
          {
            name: e.opponents[0]?.opponent.name,
            score: e.results[0]?.score.toString(),
            winner: e.results[0]?.score === winnerScore
          },
          {
            name: e.opponents[1]?.opponent.name,
            score: e.results[1]?.score.toString(),
            winner: e.results[1]?.score === winnerScore
          }
        ],
        tournament: {
          name: e.league.name,
          full_name: `${e.league.name} ${e.serie.full_name}`,
          image: e.league.image_url
        },
        stage: e.tournament.name,
        when: new Date(e.scheduled_at),
        status: e.status
      }
    })

    return matches
  }
}
