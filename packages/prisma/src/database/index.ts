import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../../../prisma/generated/client'
import { env } from '../env'
import { voidCatch } from './update-cache'

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })

const deleteProfileCache = async (pattern: string | undefined) => {
  if (!pattern) return

  let cursor = '0'

  do {
    const [next, keys] = await Bun.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)

    if (keys.length) {
      await Bun.redis.unlink(...keys)
    }
    cursor = next
  } while (cursor !== '0')
}

export const prisma = new PrismaClient({ adapter }).$extends({
  query: {
    user: {
      async update({ args, query }) {
        const user = await query(args)
        Bun.redis.unlink(`user:${user.id}`).catch(voidCatch)
        deleteProfileCache(`profile:*:${user.id}`).catch(voidCatch)

        return user
      },
      async upsert({ args, query }) {
        const user = await query(args)
        Bun.redis.unlink(`user:${user.id}`).catch(voidCatch)
        deleteProfileCache(`profile:*:${user.id}`).catch(voidCatch)

        return user
      },
      async create({ args, query }) {
        const user = await query(args)
        Bun.redis.unlink(`user:${user.id}`).catch(voidCatch)
        deleteProfileCache(`profile:*:${user.id}`).catch(voidCatch)

        return user
      },
      async delete({ args, query }) {
        const user = await query(args)
        Bun.redis.unlink(`user:${user.id}`).catch(voidCatch)
        deleteProfileCache(`profile:*:${user.id}`).catch(voidCatch)

        return user
      }
    },
    guild: {
      async update({ args, query }) {
        const guild = await query(args)
        Bun.redis.unlink(`guild:${guild.id}`).catch(voidCatch)

        return guild
      },
      async upsert({ args, query }) {
        const guild = await query(args)
        Bun.redis.unlink(`guild:${guild.id}`).catch(voidCatch)

        return guild
      },
      async create({ args, query }) {
        const guild = await query(args)
        Bun.redis.unlink(`guild:${guild.id}`).catch(voidCatch)

        return guild
      },
      async delete({ args, query }) {
        const guild = await query(args)
        Bun.redis.unlink(`guild:${guild.id}`).catch(voidCatch)

        return guild
      }
    },
    profile: {
      async update({ args, query }) {
        const profile = await query(args)
        Bun.redis.unlink(`profile:${profile.guildId}:${profile.userId}`).catch(voidCatch)

        return profile
      },
      async upsert({ args, query }) {
        const profile = await query(args)
        Bun.redis.unlink(`profile:${profile.guildId}:${profile.userId}`).catch(voidCatch)

        return profile
      },
      async create({ args, query }) {
        const profile = await query(args)
        Bun.redis.unlink(`profile:${profile.guildId}:${profile.userId}`).catch(voidCatch)

        return profile
      },
      async delete({ args, query }) {
        const profile = await query(args)
        Bun.redis.unlink(`profile:${profile.guildId}:${profile.userId}`).catch(voidCatch)

        return profile
      }
    }
  }
})

export * from './hydrate-data'
export * from './update-cache'
