import { Elysia } from 'elysia'
import { z } from 'zod'
import { resultsQueue } from '@/structures/queue/results-queue'

export const lolResults = new Elysia().post(
  '/webhooks/results/lol',
  async req => {
    for (const data of req.body) {
      await resultsQueue.add(
        {
          ...data,
          game: 'lol',
          when: new Date(data.when)
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
        id: z.string(),
        teams: z.array(
          z.object({
            name: z.string(),
            score: z.string(),
            winner: z.boolean()
          })
        ),
        tournament: z.object({
          name: z.string(),
          full_name: z.string(),
          image: z.string()
        }),
        stage: z.string(),
        when: z.string()
      })
    )
  }
)
