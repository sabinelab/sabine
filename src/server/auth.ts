import { Elysia } from 'elysia'
import { env } from '@/env'

export const auth = new Elysia()
  .onBeforeHandle({ as: 'scoped' }, ({ headers, set, request }) => {
    const url = new URL(request.url)
    if(url.pathname.includes('/vote')) {
      console.log('\n🔍 --- NEW VOTE REQUEST ---')
      console.log(`📍 URL: ${request.method} ${url.pathname}`)
      console.log('📨 Received headers:')
      console.log(headers)
    }
    
    if(
      headers.authorization !== env.AUTH &&
      headers.Authorization !== env.AUTH
    ) {
      set.status = 'Unauthorized'

      return { message: 'Unauthorized' }
    }
  })