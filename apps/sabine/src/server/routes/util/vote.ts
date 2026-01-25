import { prisma } from '@db'
import { Elysia } from 'elysia'
import { z } from 'zod'

export const vote = new Elysia().post(
  '/vote',
  async ({ body, set }) => {
    const checkDate = (date1: Date, date2: Date | null | undefined) => {
      if (!date2) return false
      return Math.abs(date1.getTime() - date2.getTime()) <= 24 * 60 * 60 * 1000
    }

    const user = await prisma.user.findUnique({
      where: {
        id: body.user
      }
    })

    await prisma.user.update({
      where: {
        id: body.user
      },
      data: {
        collectedVoteReward: false,
        votes: {
          increment: 1
        },
        voteStreak: checkDate(new Date(), user?.lastVote)
          ? {
              increment: 1
            }
          : undefined
      }
    })

    set.status = 'OK'

    return { ok: true }
  },
  {
    body: z.object({
      bot: z.string(),
      user: z.string(),
      type: z.string(),
      isWeekend: z.optional(z.boolean()),
      query: z.optional(z.string()),
      admin: z.optional(z.boolean()),
      avatar: z.optional(z.string()),
      username: z.optional(z.string()),
      id: z.optional(z.string()),
      discriminator: z.optional(z.string()),
      promotable_bot: z.optional(z.string()),
      promotable_server: z.optional(
        z.object({
          icon: z.string(),
          id: z.string(),
          name: z.string()
        })
      ),
      roblox: z.optional(z.boolean()),
      stripe: z.optional(z.boolean())
    })
  }
)
