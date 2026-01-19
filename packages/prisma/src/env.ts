import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.string().startsWith('postgresql://')
})

export const env = schema.parse(Bun.env)
