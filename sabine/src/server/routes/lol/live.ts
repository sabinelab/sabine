import { Elysia } from 'elysia'
import { z } from 'zod'
import { liveQueue } from '@/structures/queue/live-queue'

export const lolLive = new Elysia().post(
  '/webhooks/live/lol',
  async (req) => {
    await liveQueue.add(
      'live',
      {
        game: 'lol',
        matches: req.body
      },
      {
        removeOnComplete: true,
        removeOnFail: true
      }
    )

    req.set.status = 'OK'
    return { ok: true }
  },
  {
    body: z.array(
      z.object({
        id: z.string(),
        tournament: z.object({
          name: z.string(),
          full_name: z.string().nullable().optional(),
          image: z.string().nullable().optional()
        }),
        teams: z.union([
          z.array(z.never()),
          z.array(
            z.object({
              name: z.string(),
              score: z.string().optional()
            })
          )
        ]),
        stage: z.optional(z.string()),
        streams: z
          .array(
            z.object({
              main: z.boolean(),
              language: z.string(),
              embed_url: z.string(),
              official: z.boolean(),
              raw_url: z.string()
            })
          )
          .optional()
      })
    )
  }
)