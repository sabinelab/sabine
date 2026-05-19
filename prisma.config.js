import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'packages/prisma/src/schemas/',
  datasource: {
    url: env('DATABASE_URL')
  }
})