import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/',
  datasource: {
    url: env('PUSH_DATABASE_URL')
  }
})
