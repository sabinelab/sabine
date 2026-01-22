import type Bull from 'bull'
import { Elysia } from 'elysia'
import { z } from 'zod'
import { type NewsPayload, newsQueue } from '@/structures/queue/news-queue'

export const news = new Elysia().post(
  '/webhooks/news/valorant',
  async req => {
    const promises: Promise<Bull.Job<NewsPayload>>[] = []
    for (const data of req.body) {
      promises.push(
        newsQueue.add(
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
        title: z.string(),
        description: z.string(),
        url: z.string(),
        id: z.string()
      })
    )
  }
)
