import type Bull from 'bull'
import { Elysia } from 'elysia'
import { z } from 'zod'
import { type ResultsPayload, resultsQueue } from '@/structures/queue/results-queue'

export const lolResults = new Elysia().post(
  '/webhooks/results/lol',
  async req => {
    const promises: Promise<Bull.Job<ResultsPayload>>[] = []
    for (const data of req.body) {
      promises.push(
        resultsQueue.add(
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
