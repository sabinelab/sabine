import { env } from '@/env'
import type { preHandlerMetaHookHandler } from 'fastify/types/hooks.js'

export const auth: preHandlerMetaHookHandler = (req, res, done) => {
  if (env.NODE_ENV === 'dev') return done()

  if (req.headers.authorization !== env.AUTH) {
    return res.status(401).send({ error: 'Forbidden' })
  }

  return done()
}
