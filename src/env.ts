import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.string(),
  BOT_TOKEN: z.string(),
  ERROR_LOG: z.string(),
  COMMAND_LOG: z.string(),
  GUILDS_LOG: z.string(),
  SHARD_LOG: z.string(),
  INTERVAL: z.optional( z.number()),
  USERS_LOG: z.string(),
  AUTH: z.string(),
  API_URL: z.string(),
  CDN_URL: z.string(),
  DEVS: z.string(),
  REDIS_URL: z.optional(z.string()),
  NODE_ENV: z.optional(z.enum(['production', 'development']))
})

export const env = schema.parse({
  ...Bun.env,
  INTERVAL: Number(Bun.env.INTERVAL)
})