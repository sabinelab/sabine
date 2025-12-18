import type { MatchesData } from '@types'
import { env } from '@/env'

export default class MatchesService {
  public static async get(auth: string) {
    const data = await (await fetch(env.API_URL + '/matches/lol', {
      headers: {
        authorization: auth
      }
    })).json()

    return data as MatchesData[]
  }
}