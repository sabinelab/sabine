import type { ResultsData } from '@types'
import { env } from '@/env'

export const valorantResults = {
  async get() {
    const response = await fetch(env.API_URL + '/results/valorant', {
      headers: {
        authorization: env.AUTH
      }
    })
    const data: ResultsData[] = await response.json()

    return data
  }
}