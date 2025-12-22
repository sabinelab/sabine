import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'
import Logger from '../util/Logger'
import { auth } from './auth'
import { lolLive } from './routes/lol/live'
import { lolResults } from './routes/lol/results'
import { commands } from './routes/util/commands'
import { players } from './routes/util/players'
import { updates } from './routes/util/updates'
import { vote } from './routes/util/vote'
import { valorantLive } from './routes/valorant/live'
import { news } from './routes/valorant/news'
import { valorantResults } from './routes/valorant/results'

new Elysia()
  .onRequest(({ request }) => {
    const url = new URL(request.url)
    if (url.pathname.includes('/vote')) {
      Logger.info(`🔌 CONNECTION RECEIVED: ${request.method} ${request.url}`)
    }
  })
  .use(
    cors({
      origin: true,
      methods: ['POST', 'GET', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-dbl-signature']
    })
  )
  .use(auth)
  .use(lolLive)
  .use(lolResults)
  .use(valorantLive)
  .use(news)
  .use(valorantResults)
  .use(commands)
  .use(players)
  .use(updates)
  .use(vote)
  .listen(3001)

Logger.info('HTTP server running at 3001')
