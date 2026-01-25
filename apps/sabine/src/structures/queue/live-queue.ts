import type { $Enums } from '@generated'
import Bull from 'bull'
import { env } from '@/env'
import type { LiveFeed } from '@/types'

export type LivePayload = LiveFeed & {
  game: $Enums.Game
}

export const liveQueue = new Bull<LivePayload>('live', {
  redis: env.REDIS_URL
})
