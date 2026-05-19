import type { ResultsData } from '@types'
import { env } from '@/env'

export const lolResults = {
  async get() {
    const response = await fetch(env.API_URL + '/results/lol', {
      headers: {
        authorization: env.AUTH
      }
    })
    const data: ResultsData[] = await response.json()

    return data
  }
}