import type { $Enums } from '@generated'
import type { NewsData } from '@types'
import Bull from 'bull'
import { env } from '@/env'

export type NewsPayload = NewsData & {
  game: $Enums.Game
}

export const newsQueue = new Bull<NewsPayload>('live', {
  redis: env.REDIS_URL
})
