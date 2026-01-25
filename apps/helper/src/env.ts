import { z } from 'zod'

const schema = z.object({
  BOT_TOKEN: z.string(),
  DATABASE_URL: z.string().startsWith('postgresql://'),
  PREFIX: z.string(),
  MOD_LOG: z.string(),
  SABINE_TOKEN: z.string(),
  MP_TOKEN: z.string(),
  MP_WEBHOOK_URL: z.url(),
  STRIPE_WEBHOOK_URL: z.url(),
  ERROR_LOG: z.string(),
  USERS_LOG: z.string(),
  PREMIUM_LOG: z.string(),
  INTERVAL: z.coerce.number(),
  API_URL: z.url(),
  STRIPE_TOKEN: z.string(),
  STRIPE_SECRET_WEBHOOK: z.string(),
  REDIS_URL: z.string(),
  STATUS_CHANNEL: z.string()
})

export const env = schema.parse(Bun.env)
