import type { ResultsData } from '@types'
import { env } from '@/env'

export default class ResultsService {
  public static async get(auth: string) {
    const data = await (await fetch(env.API_URL + '/results/valorant', {
      headers: {
        authorization: auth
      }
    })).json()

    return data as ResultsData[]
  }
}