import type { LiveFeed } from '@types'
import { env } from '@/env'

export default class LiveMatchesService {
  public static async get(auth: string) {
    const data = await (
      await fetch(env.API_URL + '/live/lol', {
        headers: {
          authorization: auth
        }
      })
    ).json()

    return data as LiveFeed[]
  }
}
