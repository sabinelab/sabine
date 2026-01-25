import type { $Enums } from '@generated'
import Bull from 'bull'
import { env } from '@/env'
import type { ResultsData } from '@/types'

export type ResultsPayload = ResultsData & {
  game: $Enums.Game
}
export const resultsQueue = new Bull<ResultsPayload>('results', {
  redis: env.REDIS_URL
})
