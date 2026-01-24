import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import { prisma } from '@db'
import type { Prisma } from '@generated'
import fastify from 'fastify'
import { env } from '@/env'
import type { LiveFeed } from '../types/index.d'
import lolEvents from './services/lol/events'
import lolLiveFeed from './services/lol/livefeed'
import lolMatches from './services/lol/matches'
import lolResults from './services/lol/results'
import events from './services/valorant/events'
import livefeed from './services/valorant/livefeed'
import matches from './services/valorant/matches'
import news from './services/valorant/news'
import results from './services/valorant/results'
import { auth } from './utils/auth'
import { error, info } from './utils/logger'
import sendWebhook from './utils/sendWebhook'

const setData = async () => {
  const lol = {
    events: await lolEvents.get(),
    matches: (await lolMatches.get()).map(({ tournament, teams, ...m }) => ({
      ...m,
      tournamentName: tournament.name,
      tournamentFullName: tournament.full_name,
      tournamentImage: tournament.image,
      teams: {
        createMany: {
          data: teams
        }
      }
    })),
    results: (await lolResults.get()).map(({ tournament, teams, ...m }) => ({
      ...m,
      tournamentName: tournament.name,
      tournamentFullName: tournament.full_name,
      tournamentImage: tournament.image,
      teams: {
        createMany: {
          data: teams
        }
      }
    }))
  } as const

  const val = {
    events: await events.get(),
    matches: (await matches.get())
      .map(({ tournament, teams, ...m }) => ({
        ...m,
        tournamentName: tournament.name,
        tournamentFullName: tournament.full_name,
        tournamentImage: tournament.image,
        teams: {
          createMany: {
            data: teams
          }
        }
      }))
      .filter(match => !Number.isNaN(match.when.getTime())),
    results: (await results.get()).map(({ tournament, teams, ...m }) => ({
      ...m,
      tournamentName: tournament.name,
      tournamentFullName: tournament.full_name,
      tournamentImage: tournament.image,
      teams: {
        createMany: {
          data: teams
        }
      }
    })),
    news: await news.get()
  } as const

  const transactions: Prisma.PrismaPromise<any>[] = []

  await prisma.$transaction([
    prisma.news.deleteMany(),
    prisma.valEvent.deleteMany(),
    prisma.valMatch.deleteMany(),
    prisma.lolEvent.deleteMany(),
    prisma.lolMatch.deleteMany()
  ])

  for (const event of lol.events) {
    transactions.push(prisma.lolEvent.create({ data: event }))
  }

  for (const match of lol.matches) {
    transactions.push(prisma.lolMatch.create({ data: match }))
  }

  for (const match of lol.results) {
    transactions.push(prisma.lolResult.create({ data: match }))
  }

  for (const event of val.events) {
    transactions.push(prisma.valEvent.create({ data: event }))
  }

  for (const match of val.matches) {
    transactions.push(prisma.valMatch.create({ data: match }))
  }

  for (const match of val.results) {
    transactions.push(prisma.valResult.create({ data: match }))
  }

  for (const news of val.news) {
    transactions.push(prisma.news.create({ data: news }))
  }

  await prisma.$transaction(transactions)
}

const updateDb = async () => {
  try {
    const lol = {
      events: await lolEvents.get(),
      matches: (await lolMatches.get()).map(({ tournament, teams, ...m }) => ({
        ...m,
        tournamentName: tournament.name,
        tournamentFullName: tournament.full_name,
        tournamentImage: tournament.image,
        teams: {
          createMany: {
            data: teams
          }
        }
      }))
    } as const

    const val = {
      events: await events.get(),
      matches: (await matches.get())
        .map(({ tournament, teams, ...m }) => ({
          ...m,
          tournamentName: tournament.name,
          tournamentFullName: tournament.full_name,
          tournamentImage: tournament.image,
          teams: {
            createMany: {
              data: teams
            }
          }
        }))
        .filter(match => !Number.isNaN(match.when.getTime()))
    } as const

    await prisma.$transaction([
      prisma.lolEvent.deleteMany(),
      prisma.valEvent.deleteMany(),
      prisma.valMatch.deleteMany(),
      prisma.lolMatch.deleteMany(),
      prisma.lolEvent.createMany({ data: lol.events }),
      prisma.valEvent.createMany({ data: val.events })
    ])

    const transactions: Prisma.PrismaPromise<any>[] = []

    for (const match of lol.matches) {
      transactions.push(prisma.lolMatch.create({ data: match }))
    }

    for (const match of val.matches) {
      transactions.push(prisma.valMatch.create({ data: match }))
    }

    await prisma.$transaction(transactions)
  } catch (e) {
    error(e as Error)
  } finally {
    setTimeout(updateDb, env.INTERVAL ?? 300000)
  }
}

await setData()

try {
  await prisma.$transaction([
    prisma.lolStream.deleteMany(),
    prisma.valStream.deleteMany(),
    prisma.lolResultTeam.deleteMany({
      where: {
        liveMatchId: { not: null }
      }
    }),
    prisma.valResultTeam.deleteMany({
      where: {
        liveMatchId: { not: null }
      }
    }),
    prisma.lolLiveMatch.deleteMany(),
    prisma.valLiveMatch.deleteMany()
  ])
} catch (e) {
  error(e as Error)
}

const server = fastify()

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

for (const folder of fs.readdirSync(path.resolve(__dirname, './routes'))) {
  for (const file of fs.readdirSync(path.resolve(__dirname, `./routes/${folder}`))) {
    const route = await import(`./routes/${folder}/${file}`)

    await server.register(route)
  }
}

server.addHook('preHandler', auth)

server.listen({ host: '0.0.0.0', port: 4000 }).then(() => info('HTTP server running at 4000'))

const sendNews = async () => {
  try {
    const val = {
      news: await news.get()
    } as const

    const oldNews = await prisma.news.findMany()
    const arrayNews = val.news.filter(nn => !oldNews.some(on => nn.id === on.id))

    if (arrayNews.length) {
      await sendWebhook(arrayNews, '/webhooks/news/valorant')

      await prisma.$transaction([
        prisma.news.deleteMany(),
        prisma.news.createMany({ data: val.news })
      ])
    }
  } catch (e) {
    error(e as Error)
  } finally {
    setTimeout(sendNews, env.INTERVAL ?? 300000)
  }
}

const sendLiveAndResults = async () => {
  try {
    const lol = {
      results: (await lolResults.get()).map(({ tournament, teams, ...m }) => ({
        ...m,
        tournamentName: tournament.name,
        tournamentFullName: tournament.full_name,
        tournamentImage: tournament.image,
        teams: {
          createMany: {
            data: teams
          }
        }
      })),
      liveMatches: await lolLiveFeed.get()
    } as const

    const val = {
      results: (await results.get()).map(({ tournament, teams, ...m }) => ({
        ...m,
        tournamentName: tournament.name,
        tournamentFullName: tournament.full_name,
        tournamentImage: tournament.image,
        teams: {
          createMany: {
            data: teams
          }
        },
        when: m.when.toISOString()
      })),
      liveMatches: (await matches.get()).filter(m => m.status === 'LIVE')
    } as const

    const vlrLiveMatches: LiveFeed[] = []
    const lolLiveMatches: LiveFeed[] = []

    for (const m of val.liveMatches) {
      const match = await livefeed.get(m.id)

      vlrLiveMatches.push(match)
    }

    for (const m of lol.liveMatches) {
      lolLiveMatches.push(m)
    }

    const vlrOldLiveMatches = (
      await prisma.valLiveMatch.findMany({
        include: {
          teams: true
        }
      })
    ).map(({ tournamentFullName, tournamentImage, tournamentName, ...m }) => ({
      // eslint-disable-line
      ...m,
      tournament: {
        name: tournamentName,
        image: tournamentImage
      }
    }))

    const lolOldLiveMatches = (
      await prisma.lolLiveMatch.findMany({
        include: {
          teams: true
        }
      })
    ).map(({ tournamentFullName, tournamentImage, tournamentName, ...m }) => ({
      // eslint-disable-line
      ...m,
      tournament: {
        name: tournamentName,
        image: tournamentImage
      }
    }))

    const vlrOldResults = (
      await prisma.valResult.findMany({
        include: {
          teams: true
        }
      })
    ).map(({ tournamentFullName, tournamentImage, tournamentName, ...m }) => ({
      // eslint-disable-line
      ...m,
      tournament: {
        name: tournamentName,
        image: tournamentImage
      }
    }))
    const lolOldResults = (
      await prisma.lolResult.findMany({
        include: {
          teams: true
        }
      })
    ).map(({ tournamentFullName, tournamentImage, tournamentName, ...m }) => ({
      ...m,
      tournament: {
        name: tournamentName,
        image: tournamentImage,
        full_name: tournamentFullName
      }
    }))

    const vlrResultsArray = val.results
      .map(r => ({
        ...r,
        teams: r.teams.createMany.data
      }))
      .filter(
        r =>
          !vlrOldResults.some(
            or =>
              or.id === r.id &&
              or.teams[0].score === r.teams[0].score &&
              or.teams[1].score === r.teams[1].score
          )
      )
      .map(({ tournamentFullName, tournamentImage, tournamentName, ...m }) => ({
        // eslint-disable-line
        ...m,
        tournament: {
          name: tournamentName,
          image: tournamentImage
        }
      }))

    const lolResultsArray = lol.results
      .map(r => ({
        ...r,
        teams: r.teams.createMany.data
      }))
      .filter(
        r =>
          !lolOldResults.some(
            or =>
              or.id === r.id &&
              or.teams[0].score === r.teams[0].score &&
              or.teams[1].score === r.teams[1].score
          )
      )
      .map(({ tournamentFullName, tournamentImage, tournamentName, ...m }) => ({
        ...m,
        tournament: {
          name: tournamentName,
          image: tournamentImage,
          full_name: tournamentFullName
        }
      }))

    const liveVlrArray = vlrLiveMatches.filter(
      m =>
        !vlrOldLiveMatches.some(
          om => om.id === m.id.toString() && om.score1 === m.score1 && om.score2 === m.score2
        )
    )
    const liveLolArray = lolLiveMatches.filter(
      m =>
        !lolOldLiveMatches.some(
          om =>
            om.id === m.id.toString() &&
            om.teams[0].score === m.teams[0].score &&
            om.teams[1].score === m.teams[1].score
        )
    )

    if (liveVlrArray.length) {
      await prisma.$transaction([
        prisma.valStream.deleteMany(),
        prisma.valResultTeam.deleteMany({
          where: {
            liveMatchId: { not: null }
          }
        }),
        prisma.valLiveMatch.deleteMany()
      ])

      for (const match of vlrLiveMatches) {
        const { streams, tournament, ...m } = match // eslint-disable-line

        await prisma.valLiveMatch.create({
          data: {
            ...m,
            currentMap: m.currentMap ?? '',
            id: m.id.toString(),
            tournamentName: tournament.name,
            tournamentImage: tournament.image,
            teams: {
              createMany: {
                data: m.teams.map(t => ({
                  ...t,
                  score: t.score as string
                }))
              }
            }
          }
        })
      }

      await sendWebhook(liveVlrArray, '/webhooks/live/valorant')
    }

    if (vlrResultsArray.length) {
      await prisma.valResult.deleteMany()

      for (const m of val.results) {
        await prisma.valResult.create({ data: m })
      }

      await sendWebhook(vlrResultsArray, '/webhooks/results/valorant')
    }

    if (lolResultsArray.length) {
      await prisma.lolResult.deleteMany()

      for (const m of lol.results) {
        await prisma.lolResult.create({ data: m })
      }

      await sendWebhook(lolResultsArray, '/webhooks/results/lol')
    }

    if (liveLolArray.length) {
      await prisma.$transaction([
        prisma.lolStream.deleteMany(),
        prisma.lolResultTeam.deleteMany({
          where: {
            liveMatchId: { not: null }
          }
        }),
        prisma.lolLiveMatch.deleteMany()
      ])

      for (const match of lolLiveMatches) {
        const { streams, tournament, ...m } = match

        await prisma.lolLiveMatch.create({
          data: {
            ...m,
            id: m.id.toString(),
            tournamentName: tournament.name,
            tournamentImage: tournament.image,
            tournamentFullName: tournament.full_name,
            teams: {
              createMany: {
                data: m.teams.map(t => ({
                  ...t,
                  score: t.score!
                }))
              }
            },
            streams: {
              createMany: !streams
                ? undefined
                : {
                    data: streams
                  }
            }
          }
        })
      }

      await sendWebhook(liveLolArray, '/webhooks/live/lol')
    }
  } catch (e) {
    error(e as Error)
  } finally {
    setTimeout(sendLiveAndResults, env.INTERVAL ?? 30000)
  }
}

updateDb()
sendNews()
sendLiveAndResults()
