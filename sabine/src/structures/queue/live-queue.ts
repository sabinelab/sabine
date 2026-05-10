import { prisma } from '@db'
import type { $Enums, Prisma } from '@generated'
import t from '@i18n'
import { Queue } from 'bullmq'
import {
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  REST,
  Routes,
  type RESTPostAPIChannelMessageResult
} from 'discord.js'
import pLimit from 'p-limit'
import { tournaments } from '@/config'
import { env } from '@/env'
import type App from '@/structures/app/App'
import type { LiveFeed } from '@/types'

export type LivePayload = {
  game: $Enums.Game
  matches: LiveFeed[]
}

export const liveQueue = new Queue<LivePayload>('live', {
  connection: {
    url: env.REDIS_URL
  }
})

const rest = new REST().setToken(env.BOT_TOKEN)
const limit = pLimit(25)

export async function renderLiveChannel(
  app: App,
  options: {
    guildId: string
    lang: $Enums.Language
    channelId: string
    game: $Enums.Game
  }
) {
  const liveMatches = await prisma.liveMatch.findMany({
    where: {
      guildId: options.guildId,
      game: options.game,
      channelId: options.channelId
    },
    include: {
      teams: true
    },
    orderBy: {
      index: 'asc'
    }
  })

  if (!liveMatches.length) {
    const liveMessages = await prisma.liveMessage.findMany({
      where: {
        guildId: options.guildId,
        game: options.game,
        channelId: options.channelId
      }
    })

    await Promise.allSettled(
      liveMessages.map((liveMessage) =>
        limit(async () => {
          await rest
            .delete(Routes.channelMessage(liveMessage.channelId, liveMessage.messageId))
            .catch(() => null)
        })
      )
    )

    await prisma.liveMessage.deleteMany({
      where: {
        guildId: options.guildId,
        game: options.game,
        channelId: options.channelId
      }
    })
  } else {
    const shouldReorder = liveMatches.some((liveMatch, index) => liveMatch.index !== index)

    if (shouldReorder) {
      await prisma.$transaction(
        liveMatches.map((liveMatch, index) =>
          prisma.liveMatch.update({
            where: {
              id: liveMatch.id
            },
            data: {
              index
            }
          })
        )
      )

      liveMatches.forEach((liveMatch, index) => {
        liveMatch.index = index
      })
    }

    const chunkSize = 5

    for (let i = 0; i < liveMatches.length; i += chunkSize) {
      const messageIndex = i / chunkSize
      const chunk = liveMatches.slice(i, i + chunkSize)

      const container = new ContainerBuilder()
        .setAccentColor(6719296)
        .addTextDisplayComponents((text) =>
          text.setContent(`## ${t(options.lang, 'helper.live_now')}`)
        )
        .addSeparatorComponents((separator) => separator)

      for (const liveMatch of chunk) {
        if (liveMatch.teams.length < 2) continue

        const team1 = liveMatch.teams[0]
        const team2 = liveMatch.teams[1]

        const emoji1 =
          app.emoji.get(team1.name.toLowerCase()) ??
          app.emoji.get(app.emojiAliases.get(team1.name.toLowerCase()) ?? '') ??
          app.emoji.get('default')

        const emoji2 =
          app.emoji.get(team2.name.toLowerCase()) ??
          app.emoji.get(app.emojiAliases.get(team2.name.toLowerCase()) ?? '') ??
          app.emoji.get('default')

        container.addTextDisplayComponents((text) => {
          let content = `### ${liveMatch.tournamentName}\n`

          content += `**${emoji1} ${team1.name} \`${team1.score}\` <:versus:1349105624180330516> \`${team2.score}\` ${team2.name} ${emoji2}**\n`

          if (options.game === 'valorant' && liveMatch.currentMap) {
            content += t(options.lang, 'helper.live_feed_value', {
              map: liveMatch.currentMap,
              score: `${team1.mapScore ?? '0'}-${team2.mapScore ?? '0'}`
            })
          } else if (liveMatch.stage) {
            content += liveMatch.stage
          }

          return text.setContent(content)
        })

        if (options.game === 'valorant' && liveMatch.url) {
          container.addActionRowComponents((row) =>
            row.setComponents(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel(t(options.lang, 'helper.stats'))
                .setURL(liveMatch.url!)
            )
          )
        } else if (options.game === 'lol') {
          container.addActionRowComponents((row) =>
            row.setComponents(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Primary)
                .setLabel(t(options.lang, 'helper.streams'))
                .setCustomId(`stream;lol;${liveMatch.matchId}`)
            )
          )
        }

        container.addSeparatorComponents((separator) => separator)
      }

      const liveMessage = await prisma.liveMessage.findUnique({
        where: {
          guildId_game_channelId_index: {
            guildId: options.guildId,
            game: options.game,
            channelId: options.channelId,
            index: messageIndex
          }
        }
      })
      if (!liveMessage) {
        const message = (await rest.post(Routes.channelMessages(options.channelId), {
          body: {
            components: [container.toJSON()],
            flags: MessageFlags.IsComponentsV2
          }
        })) as RESTPostAPIChannelMessageResult

        await prisma.liveMessage.create({
          data: {
            guildId: options.guildId,
            game: options.game,
            channelId: options.channelId,
            messageId: message.id,
            index: messageIndex
          }
        })
      } else {
        try {
          await rest.patch(Routes.channelMessage(options.channelId, liveMessage.messageId), {
            body: {
              components: [container.toJSON()],
              flags: MessageFlags.IsComponentsV2
            }
          })
        } catch (error) {
          const status = error instanceof Error && 'status' in error ? error.status : null
          if (status !== 404) throw error

          const message = (await rest.post(Routes.channelMessages(options.channelId), {
            body: {
              components: [container.toJSON()],
              flags: MessageFlags.IsComponentsV2
            }
          })) as RESTPostAPIChannelMessageResult

          await prisma.liveMessage.update({
            where: {
              id: liveMessage.id
            },
            data: {
              messageId: message.id
            }
          })
        }
      }
    }

    const chunksLength = Math.ceil(liveMatches.length / chunkSize)

    const staleMessages = await prisma.liveMessage.findMany({
      where: {
        guildId: options.guildId,
        game: options.game,
        channelId: options.channelId,
        index: {
          gte: chunksLength
        }
      }
    })

    await Promise.allSettled(
      staleMessages.map((liveMessage) =>
        limit(async () => {
          await rest
            .delete(Routes.channelMessage(liveMessage.channelId, liveMessage.messageId))
            .catch(() => null)

          await prisma.liveMessage.delete({
            where: {
              id: liveMessage.id
            }
          })
        })
      )
    )
  }
}

export async function processLive(app: App, data: LivePayload) {
  const matchedEventNames = new Set<string>()

  for (const match of data.matches) {
    for (const key of Object.keys(tournaments)) {
      const name = match.tournament.name.trim().replace(/\s+/g, ' ').toLowerCase()
      if (key.toLowerCase() === name || tournaments[key].some((regex) => regex.test(name))) {
        matchedEventNames.add(key)
      }
    }

    matchedEventNames.add(match.tournament.name)

    if (match.tournament.full_name) {
      matchedEventNames.add(match.tournament.full_name)
    }
  }

  const matchedEventNamesArray = [...matchedEventNames]
  const where: Prisma.GuildWhereInput = {
    OR: [
      ...(matchedEventNamesArray.length
        ? [
            {
              events: {
                some: {
                  type: data.game,
                  name: {
                    in: matchedEventNamesArray
                  }
                }
              }
            }
          ]
        : []),
      {
        liveMessages: {
          some: {
            game: data.game
          }
        }
      }
    ]
  }

  let cursor: string | undefined

  while (true) {
    const guilds = await prisma.guild.findMany({
      take: 1000,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
      where,
      include: {
        events: {
          where: {
            type: data.game,
            name: {
              in: matchedEventNamesArray
            }
          }
        },
        liveMessages: {
          where: {
            game: data.game
          }
        }
      }
    })

    if (!guilds.length) break

    const channelGroups = new Map<
      string,
      {
        guildId: string
        lang: $Enums.Language
        channelId: string
        matches: {
          match: LiveFeed
          matchId: string
        }[]
      }
    >()

    for (const guild of guilds) {
      for (const match of data.matches) {
        if (match.teams.length < 2) continue

        const event = guild.events.find((event) => {
          const tournamentName = match.tournament.name.trim().replace(/\s+/g, ' ').toLowerCase()
          const eventName = event.name.trim().replace(/\s+/g, ' ').toLowerCase()
          if (eventName === tournamentName) return true

          if (match.tournament.full_name) {
            const fullName = match.tournament.full_name.trim().replace(/\s+/g, ' ').toLowerCase()
            if (eventName === fullName) return true
          }

          return tournaments[event.name]?.some((regex) => regex.test(tournamentName)) ?? false
        })
        if (!event) continue

        const key = `${guild.id}:${event.channel1}`

        if (!channelGroups.has(key)) {
          channelGroups.set(key, {
            guildId: guild.id,
            lang: guild.lang,
            channelId: event.channel1,
            matches: []
          })
        }

        channelGroups.get(key)?.matches.push({
          match,
          matchId: match.id.toString()
        })
      }
    }

    const affectedChannels = new Map<
      string,
      {
        guildId: string
        lang: $Enums.Language
        channelId: string
      }
    >()

    await Promise.allSettled(
      [...channelGroups.entries()].map(([key, group]) =>
        (async () => {
          const existingLiveMatches = await prisma.liveMatch.findMany({
            where: {
              guildId: group.guildId,
              game: data.game,
              channelId: group.channelId
            },
            orderBy: {
              index: 'asc'
            },
            select: {
              matchId: true,
              index: true
            }
          })

          const existingIndexes = new Map(
            existingLiveMatches.map((liveMatch) => [liveMatch.matchId, liveMatch.index])
          )
          const matches = new Map(group.matches.map((item) => [item.matchId, item]))
          let nextIndex = existingLiveMatches.at(-1)?.index ?? -1

          await Promise.allSettled(
            [...matches.values()].map(({ match, matchId }) => {
              const index = existingIndexes.get(matchId) ?? ++nextIndex

              return prisma.liveMatch.upsert({
                where: {
                  guildId_game_channelId_matchId: {
                    guildId: group.guildId,
                    game: data.game,
                    channelId: group.channelId,
                    matchId
                  }
                },
                create: {
                  guildId: group.guildId,
                  game: data.game,
                  channelId: group.channelId,
                  matchId,
                  index,
                  tournamentName: match.tournament.full_name ?? match.tournament.name,
                  currentMap: match.currentMap,
                  url: match.url,
                  stage: match.stage,
                  teams: {
                    create: match.teams.slice(0, 2).map((team, index) => ({
                      name: team.name,
                      score: team.score?.toString() ?? '0',
                      mapScore: index === 0 ? match.score1 : match.score2
                    }))
                  }
                },
                update: {
                  tournamentName: match.tournament.full_name ?? match.tournament.name,
                  currentMap: match.currentMap,
                  url: match.url,
                  stage: match.stage,
                  teams: {
                    deleteMany: {},
                    create: match.teams.slice(0, 2).map((team, index) => ({
                      name: team.name,
                      score: team.score?.toString() ?? '0',
                      mapScore: index === 0 ? match.score1 : match.score2
                    }))
                  }
                }
              })
            })
          )

          affectedChannels.set(key, {
            guildId: group.guildId,
            lang: group.lang,
            channelId: group.channelId
          })
        })()
      )
    )

    await Promise.allSettled(
      [...affectedChannels.values()].map((channel) =>
        limit(() =>
          renderLiveChannel(app, {
            ...channel,
            game: data.game
          })
        )
      )
    )
    cursor = guilds[guilds.length - 1].id
  }
}
