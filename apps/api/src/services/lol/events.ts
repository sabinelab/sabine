import { env } from '@/env'
import type { EventsData } from '../../../types/index.d'

export default {
  get: async () => {
    const res = await fetch('https://api.pandascore.co/lol/leagues?per_page=100', {
      headers: {
        accept: 'application/json',
        authorization: env.PANDA_TOKEN
      },
      cache: 'no-store'
    })

    if (!res.ok) return []

    const data = await res.json()

    if (!data.length) return []

    let events: EventsData[] = data.map((d: any) => ({
      name: d.name,
      id: d.id.toString(),
      image: d.image_url
    }))

    const seen = new Set<string>()

    events = events.filter(i => {
      if (seen.has(i.name)) return false

      seen.add(i.name)

      return true
    })

    return events
  }
}
