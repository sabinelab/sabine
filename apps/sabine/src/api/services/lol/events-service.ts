import type { EventsData } from '@types'
import { env } from '@/env'

export const lolEvents = {
  async get() {
    const response = await fetch(env.API_URL + '/events/lol', {
      headers: {
        authorization: env.AUTH
      }
    })
    const data: EventsData[] = await response.json()

    return data
  }
}