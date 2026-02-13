import type Bull from 'bull'
import { Elysia } from 'elysia'
import { z } from 'zod'
import { type LivePayload, liveQueue } from '@/structures/queue/live-queue'

export const lolLive = new Elysia().post(
  '/webhooks/live/lol',
  async req => {
    const promises: Promise<Bull.Job<LivePayload>>[] = []
    for (const data of req.body) {
      promises.push(
        liveQueue.add(
          {
            ...data,
            game: 'lol'
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
        id: z.string(),
        tournament: z.object({
          name: z.string(),
          full_name: z.string(),
          image: z.string()
        }),
        teams: z.union([
          z.array(z.never()),
          z.array(
            z.object({
              name: z.string(),
              score: z.string()
            })
          )
        ]),
        stage: z.optional(z.string()),
        streams: z.array(
          z.object({
            main: z.boolean(),
            language: z.string(),
            embed_url: z.string(),
            official: z.boolean(),
            raw_url: z.string()
          })
        ).optional()
      })
    )
  }
)
