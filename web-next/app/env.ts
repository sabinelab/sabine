import { z } from 'zod'

const schema = z.object({
  NUXT_AUTH: z.string(),
  NUXT_API_URL: z.url(),
  NUXT_PUBLIC_INVITE: z.url(),
  NUXT_PUBLIC_SUPPORT_SERVER: z.url(),
  NUXT_PUBLIC_CDN_URL: z.url()
})

export const env = schema.parse(import.meta.env)