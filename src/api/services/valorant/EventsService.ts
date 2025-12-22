import type { EventsData } from '@types'
import { env } from '@/env'

export default class EventsService {
  public static async get(auth: string) {
    const data = await (
      await fetch(env.API_URL + '/events/valorant', {
        headers: {
          authorization: auth
        }
      })
    ).json()

    return data as EventsData[]
  }
}
