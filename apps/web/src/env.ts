import { z } from 'zod'

const schema = z.object({
  AUTH: z.string(),
  API_URL: z.string(),
  INVITE: z.string(),
  SUPPORT: z.string(),
  CDN_URL: z.string()
})

export const env = schema.parse(process.env)
