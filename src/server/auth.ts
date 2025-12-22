import { Elysia } from 'elysia'
import { env } from '@/env'

export const auth = new Elysia()
  .onBeforeHandle({ as: 'scoped' }, ({ headers, set }) => {
    if(
      headers.authorization !== env.AUTH &&
      headers.Authorization !== env.AUTH
    ) {
      set.status = 'Unauthorized'

      return { message: 'Unauthorized' }
    }
  })