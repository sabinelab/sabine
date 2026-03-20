import { prisma } from '@db'
import t from '@i18n'
import type { valorantAgents } from '@sabinelab/utils'
import { Queue } from 'bullmq'
import { REST, Routes } from 'discord.js'
import { env } from '@/env'
import Match from '@/simulator/arena/Match'
import type App from '@/structures/app/App'
import Logger from '@/util/Logger'

export type ArenaQueuePayload = {
  parsedData1: {
    userId: string
    channelId: string
    guildId: string
  }
  parsedData2: {
    userId: string
    channelId: string
    guildId: string
  }
}

export const arenaQueue = new Queue<ArenaQueuePayload>('arena', {
  connection: {
    url: env.REDIS_URL
  }
})

const rest = new REST().setToken(env.BOT_TOKEN)

export const processMatch = async () => {
  try {
    while (true) {
      const queueLength = await Bun.redis.llen('arena:queue')

      if (queueLength < 2) break

      const payload1 = await Bun.redis.rpop('arena:queue')
      const payload2 = await Bun.redis.rpop('arena:queue')

      if (!payload1 || !payload2) {
        if (payload1) {
          await Bun.redis.lpush('arena:queue', payload1)
        }
        break
      }

      const parsedData1 = JSON.parse(payload1)
      const parsedData2 = JSON.parse(payload2)

      const p1InQueue = await Bun.redis.get(`arena:in_queue:${parsedData1.userId}`)
      const p2InQueue = await Bun.redis.get(`arena:in_queue:${parsedData2.userId}`)

      if (!p1InQueue) {
        if (p2InQueue) {
          await Bun.redis.lpush('arena:queue', payload2)
        }

        await Bun.redis.unlink(`arena:in_queue:${parsedData1.userId}`)
        break
      }

      if (!p2InQueue) {
        if (p1InQueue) {
          await Bun.redis.lpush('arena:queue', payload1)
        }

        await Bun.redis.unlink(`arena:in_queue:${parsedData2.userId}`)
        break
      }

      await Bun.redis.unlink(
        `arena:in_queue:${parsedData1.userId}`,
        `arena:in_queue:${parsedData2.userId}`
      )

      await arenaQueue.add(
        'arena',
        { parsedData1, parsedData2 },
        {
          removeOnComplete: true,
          removeOnFail: true
        }
      )
    }
  } catch (e) {
    Logger.error(e as Error)
  }
}

export const processArenaQueue = async (app: App, data: ArenaQueuePayload) => {
  const [player1, player2] = await Promise.all([
    prisma.profile.findUnique({
      where: {
        userId_guildId: {
          userId: data.parsedData1.userId,
          guildId: data.parsedData1.guildId
        }
      },
      include: {
        cards: {
          where: {
            arenaRoster: true,
            arenaAgentName: {
              not: null
            },
            arenaAgentRole: {
              not: null
            }
          }
        },
        user: {
          select: {
            lang: true
          }
        }
      }
    }),
    prisma.profile.findUnique({
      where: {
        userId_guildId: {
          userId: data.parsedData2.userId,
          guildId: data.parsedData2.guildId
        }
      },
      include: {
        cards: {
          where: {
            arenaRoster: true,
            arenaAgentName: {
              not: null
            },
            arenaAgentRole: {
              not: null
            }
          }
        },
        user: {
          select: {
            lang: true
          }
        }
      }
    })
  ])

  if (!player1 || !player2 || !player1.cards.length || !player2.cards.length) return

  if (player1.cards.length < 5 && player2.cards.length === 5) {
    player1.rankRating -= 15
    if (player1.rankRating < 0) player1.rankRating = 0

    await prisma.$transaction([
      prisma.profile.update({
        where: {
          userId_guildId: {
            userId: player1.userId,
            guildId: player1.guildId
          }
        },
        data: {
          rankRating: player1.rankRating
        }
      }),
      prisma.profile.update({
        where: {
          userId_guildId: {
            userId: player2.userId,
            guildId: player2.guildId
          }
        },
        data: {
          rankRating: {
            increment: 10
          }
        }
      })
    ])
  } else if (player1.cards.length === 5 && player2.cards.length < 5) {
    player2.rankRating -= 10
    if (player2.rankRating < 0) player2.rankRating = 0

    await prisma.$transaction([
      prisma.profile.update({
        where: {
          userId_guildId: {
            userId: player1.userId,
            guildId: player1.guildId
          }
        },
        data: {
          rankRating: {
            increment: 10
          }
        }
      }),
      prisma.profile.update({
        where: {
          userId_guildId: {
            userId: player2.userId,
            guildId: player2.guildId
          }
        },
        data: {
          rankRating: player2.rankRating
        }
      })
    ])
  } else if (player1.cards.length < 5 && player2.cards.length < 5) {
    player1.rankRating -= 15
    player2.rankRating -= 15

    if (player1.rankRating < 0) player1.rankRating = 0
    if (player2.rankRating < 0) player2.rankRating = 0

    await prisma.$transaction([
      prisma.profile.update({
        where: {
          userId_guildId: {
            userId: player1.userId,
            guildId: player1.guildId
          }
        },
        data: {
          rankRating: player1.rankRating
        }
      }),
      prisma.profile.update({
        where: {
          userId_guildId: {
            userId: player2.userId,
            guildId: player2.guildId
          }
        },
        data: {
          rankRating: player2.rankRating
        }
      })
    ])
  }

  const map = await Bun.redis.get('arena:map')

  if (!map) return

  let match = new Match({
    teams: [
      {
        roster: player1.cards.map(card => {
          const player = app.players.get(card.playerId)!

          return {
            ...player,
            aim: card.aim,
            acs: card.acs,
            aggression: card.aggression,
            gamesense: card.gamesense,
            hs: card.hs,
            movement: card.movement,
            ovr: card.overall,
            agent: {
              name: card.arenaAgentName!,
              role: card.arenaAgentRole as (typeof valorantAgents)[number]['role']
            },
            credits: 800,
            life: 100
          }
        }),
        name: player1.teamName!,
        tag: player1.teamTag!,
        user: player1.userId,
        guildId: player1.guildId
      },
      {
        roster: player2.cards.map(card => {
          const player = app.players.get(card.playerId)!

          return {
            ...player,
            aim: card.aim,
            acs: card.acs,
            aggression: card.aggression,
            gamesense: card.gamesense,
            hs: card.hs,
            movement: card.movement,
            ovr: card.overall,
            agent: {
              name: card.arenaAgentName!,
              role: card.arenaAgentRole as (typeof valorantAgents)[number]['role']
            },
            credits: 800,
            life: 100
          }
        }),
        name: player2.teamName!,
        tag: player2.teamTag!,
        user: player2.userId,
        guildId: player2.guildId
      }
    ],
    map,
    mode: 'arena'
  })

  while (!match.finished) {
    match = await match.start()
  }

  const messages: Promise<unknown>[] = []

  if (data.parsedData1.channelId) {
    const score1 = match.rounds.filter(r => r.winning_team === 0).length
    const score2 = match.rounds.filter(r => r.winning_team === 1).length

    messages.push(
      rest.post(Routes.channelMessages(data.parsedData1.channelId), {
        body: {
          content: t(player1.user.lang, 'simulator.send_message', {
            p1: `<@${player1.userId}>`,
            p2: `<@${player2.userId}>`,
            score: `${score1}-${score2}`,
            user: `<@${player1.userId}>`
          })
        }
      })
    )
  }

  if (data.parsedData2.channelId) {
    const score1 = match.rounds.filter(r => r.winning_team === 0).length
    const score2 = match.rounds.filter(r => r.winning_team === 1).length

    messages.push(
      rest.post(Routes.channelMessages(data.parsedData2.channelId), {
        body: {
          content: t(player2.user.lang, 'simulator.send_message', {
            p1: `<@${player1.userId}>`,
            p2: `<@${player2.userId}>`,
            score: `${score1}-${score2}`,
            user: `<@${player2.userId}>`
          })
        }
      })
    )
  }

  await Promise.allSettled(messages)
}
