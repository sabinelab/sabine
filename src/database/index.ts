import { PrismaClient } from '@generated'
import { PrismaPg } from '@prisma/adapter-pg'
import { voidCatch } from '@/database/update-cache'
import { env } from '@/env'

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })

export const prisma = new PrismaClient({ adapter }).$extends({
  query: {
    user: {
      async update({ args, query }) {
        const user = await query(args)
        Bun.redis.del(`user:${user.id}`).catch(voidCatch)

        return user
      },
      async upsert({ args, query }) {
        const user = await query(args)
        Bun.redis.del(`user:${user.id}`).catch(voidCatch)

        return user
      },
      async create({ args, query }) {
        const user = await query(args)
        Bun.redis.del(`user:${user.id}`).catch(voidCatch)

        return user
      },
      async delete({ args, query }) {
        const user = await query(args)
        Bun.redis.del(`user:${user.id}`).catch(voidCatch)

        return user
      }
    },
    guild: {
      async update({ args, query }) {
        const guild = await query(args)
        Bun.redis.del(`guild:${guild.id}`).catch(voidCatch)

        return guild
      },
      async upsert({ args, query }) {
        const guild = await query(args)
        Bun.redis.del(`guild:${guild.id}`).catch(voidCatch)

        return guild
      },
      async create({ args, query }) {
        const guild = await query(args)
        Bun.redis.del(`guild:${guild.id}`).catch(voidCatch)

        return guild
      },
      async delete({ args, query }) {
        const guild = await query(args)
        Bun.redis.del(`guild:${guild.id}`).catch(voidCatch)

        return guild
      }
    },
    profile: {
      async update({ args, query }) {
        const profile = await query(args)
        Bun.redis.del(`profile:${profile.guildId}:${profile.userId}`).catch(voidCatch)

        return profile
      },
      async upsert({ args, query }) {
        const profile = await query(args)
        Bun.redis.del(`profile:${profile.guildId}:${profile.userId}`).catch(voidCatch)

        return profile
      },
      async create({ args, query }) {
        const profile = await query(args)
        Bun.redis.del(`profile:${profile.guildId}:${profile.userId}`).catch(voidCatch)

        return profile
      },
      async delete({ args, query }) {
        const profile = await query(args)
        Bun.redis.del(`profile:${profile.guildId}:${profile.userId}`).catch(voidCatch)

        return profile
      }
    }
  }
})
export * from './schemas/GuildSchema'
export * from './schemas/ProfileSchema'
export * from './schemas/UserSchema'
