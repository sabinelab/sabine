import { Elysia } from 'elysia'
import { z } from 'zod'
import { resultsQueue } from '@/structures/queue/results-queue'

export const valorantResults = new Elysia().post(
  '/webhooks/results/valorant',
  async req => {
    for (const data of req.body) {
      await resultsQueue.add(
        {
          ...data,
          game: 'valorant',
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
        status: z.string(),
        stage: z.string(),
        when: z.string(),
        url: z.string(),
        teams: z.array(
          z.object({
            name: z.string(),
            score: z.string(),
            country: z.string(),
            winner: z.boolean()
          })
        ),
        tournament: z.object({
          name: z.string(),
          image: z.string()
        })
      })
    )
  }
)
