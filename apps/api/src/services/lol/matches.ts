import { env } from '@/env'
import type { MatchesData } from '../../../types/index'

export default {
  get: async () => {
    const res = await fetch(
      'https://api.pandascore.co/lol/matches/upcoming?per_page=100&sort=begin_at',
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

    const matches: MatchesData[] = data.map((e: any) => {
      return {
        id: e.id.toString(),
        teams: [
          {
            name: e.opponents[0]?.opponent.name
          },
          {
            name: e.opponents[1]?.opponent.name
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

    return matches.filter(m => m && m.status !== 'completed')
  }
}
