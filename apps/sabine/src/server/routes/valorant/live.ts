import { Elysia } from 'elysia'
import { z } from 'zod'
import { liveQueue } from '@/structures/queue/live-queue'

export const valorantLive = new Elysia().post(
  '/webhooks/live/valorant',
  async req => {
    for (const data of req.body) {
      await liveQueue.add(
        {
          ...data,
          game: 'valorant'
        },
        {
          removeOnComplete: true,
          removeOnFail: true
        }
      )
    }

    req.set.status = 'OK'
    return { ok: true }
  },
  {
    body: z.array(
      z.object({
        teams: z.array(
          z.object({
            name: z.string(),
            score: z.string()
          })
        ),
        currentMap: z.string(),
        score1: z.string(),
        score2: z.string(),
        id: z.string(),
        url: z.string(),
        stage: z.string(),
        tournament: z.object({
          name: z.string(),
          image: z.string()
        })
      })
    )
  }
)
