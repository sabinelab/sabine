import { SabineUser } from '@db'
import { Elysia } from 'elysia'
import { z } from 'zod'

export type Pack =
  | 'IRON' // 59-
  | 'BRONZE' // 60-66
  | 'SILVER' // 67-72
  | 'GOLD' // 73-77
  | 'PLATINUM' // 78-82
  | 'DIAMOND' // 83-86
  | 'ASCENDANT' // 87-90
  | 'IMMORTAL' // 91-94
  | 'RADIANT' // 95+

export const vote = new Elysia().post(
  '/vote',
  async ({ body, set }) => {
    const random = Math.random() * 100
    const pack: Pack =
      random < 0.5
        ? 'RADIANT'
        : random < 2.0
          ? 'IMMORTAL'
          : random < 5.0
            ? 'ASCENDANT'
            : random < 20.0
              ? 'DIAMOND'
              : random < 50.0
                ? 'PLATINUM'
                : random < 70.0
                  ? 'GOLD'
                  : random < 85.0
                    ? 'SILVER'
                    : random < 95.0
                      ? 'BRONZE'
                      : 'IRON'

    const user = (await SabineUser.fetch(body.user)) ?? new SabineUser(body.user)

    await user.addPack(pack, true)

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
