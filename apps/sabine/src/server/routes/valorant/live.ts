import type Bull from 'bull'
import { Elysia } from 'elysia'
import { z } from 'zod'
import { type LivePayload, liveQueue } from '@/structures/queue/live-queue'

export const valorantLive = new Elysia().post(
  '/webhooks/live/valorant',
  async req => {
    const promises: Promise<Bull.Job<LivePayload>>[] = []
    for (const data of req.body) {
      promises.push(
        liveQueue.add(
          {
            ...data,
            game: 'valorant'
          },
          {
            removeOnComplete: true,
            removeOnFail: true
          }
        )
      )
    }

    await Promise.allSettled(promises)

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
