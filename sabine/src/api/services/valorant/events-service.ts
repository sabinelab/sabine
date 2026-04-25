import type { EventsData } from '@types'
import { env } from '@/env'

export const valorantEvents = {
  async get() {
    const response = await fetch(env.API_URL + '/events/valorant', {
      headers: {
        authorization: env.AUTH
      }
    })
    const data: EventsData[] = await response.json()

    return data
  }
}