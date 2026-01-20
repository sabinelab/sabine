import { z } from 'zod'

const schema = z.object({
  INTERVAL: z.number().optional(),
  WEBHOOK_URL: z.string(),
  AUTH: z.string(),
  PANDA_TOKEN: z.string(),
  NODE_ENV: z.enum(['dev', 'prod']).optional()
})

export const env = schema.parse(Bun.env)