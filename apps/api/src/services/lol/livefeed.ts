import { env } from '@/env'
import type { LiveFeed } from '../../../types/index.d'

export default {
  get: async () => {
    const res = await fetch(
      'https://api.pandascore.co/lol/matches/running?per_page=100&sort=begin_at',
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

    const matches: LiveFeed[] = data.map((e: any) => {
      return {
        id: e.id.toString(),
        tournament: {
          name: e.league.name,
          full_name: `${e.league.name} ${e.serie.full_name}`,
          image: e.league.image_url
        },
        teams: [
          {
            name: e.opponents[0].opponent.name,
            score: e.results[0].score.toString()
          },
          {
            name: e.opponents[1].opponent.name,
            score: e.results[1].score.toString()
          }
        ],
        stage: e.tournament.name,
        streams: e.streams_list
      }
    })

    return matches
  }
}
