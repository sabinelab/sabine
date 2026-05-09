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

type LiveMatchData = {
  data: LiveFeed
  emoji1: string | undefined
  emoji2: string | undefined
}

export const liveQueue = new Queue<LivePayload>('live', {
  connection: {
    url: env.REDIS_URL
  }
})

const rest = new REST().setToken(env.BOT_TOKEN)
const limit = pLimit(25)

export const processLive = async (app: App, data: LivePayload) => {
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

    const promises: Promise<unknown>[] = []

    for (const guild of guilds) {
      const channelBatches = new Map<string, LiveMatchData[]>()

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

        const emoji1 =
          app.emoji.get(match.teams[0].name.toLowerCase()) ??
          app.emoji.get(app.emojiAliases.get(match.teams[0].name.toLowerCase()) ?? '') ??
          app.emoji.get('default')
        const emoji2 =
          app.emoji.get(match.teams[1].name.toLowerCase()) ??
          app.emoji.get(app.emojiAliases.get(match.teams[1].name.toLowerCase()) ?? '') ??
          app.emoji.get('default')

        if (!channelBatches.has(event.channel1)) {
          channelBatches.set(event.channel1, [])
        }

        channelBatches.get(event.channel1)?.push({
          data: match,
          emoji1,
          emoji2
        })
      }

      for (const [channelId, matches] of channelBatches.entries()) {
        const chunkSize = 5

        for (let i = 0; i < matches.length; i += chunkSize) {
          const index = i / chunkSize
          const chunk = matches.slice(i, i + chunkSize)

          const container = new ContainerBuilder()
            .setAccentColor(6719296)
            .addTextDisplayComponents((text) => text.setContent(`## ${t(guild.lang, 'helper.live_now')}`))
            .addSeparatorComponents((separator) => separator)

          for (const match of chunk) {
            const team1 = match.data.teams[0]
            const team2 = match.data.teams[1]

            container
              .addTextDisplayComponents((text) => {
                let content = `### ${match.data.tournament.full_name ?? match.data.tournament.name}\n`

                content += `**${match.emoji1} ${team1.name} \`${team1.score ?? '0'}\` <:versus:1349105624180330516> \`${team2.score ?? '0'}\` ${team2.name} ${match.emoji2}**\n`

                if (data.game === 'valorant' && match.data.currentMap) {
                  content += t(guild.lang, 'helper.live_feed_value', {
                    map: match.data.currentMap,
                    score: `${match.data.score1 ?? '0'}-${match.data.score2 ?? '0'}`
                  })
                } else if (match.data.stage) {
                  content += `${match.data.stage}`
                }

                return text.setContent(content)
              })
              .addActionRowComponents((row) => {
                const button = new ButtonBuilder()

                if (data.game === 'valorant') {
                  button.setStyle(ButtonStyle.Link).setLabel(t(guild.lang, 'helper.stats')).setURL(match.data.url!)
                } else {
                  button
                    .setStyle(ButtonStyle.Primary)
                    .setLabel(t(guild.lang, 'helper.streams'))
                    .setCustomId(`stream;lol;${match.data.id}`)
                }

                return row.setComponents(button)
              })
              .addSeparatorComponents((separator) => separator)
          }

          promises.push(
            limit(async () => {
              const liveMessage = await prisma.liveMessage.findUnique({
                where: {
                  guildId_game_channelId_index: {
                    guildId: guild.id,
                    game: data.game,
                    channelId,
                    index
                  }
                }
              })
              if (!liveMessage) {
                const message = (await rest.post(Routes.channelMessages(channelId), {
                  body: {
                    components: [container.toJSON()],
                    flags: MessageFlags.IsComponentsV2
                  }
                })) as RESTPostAPIChannelMessageResult

                await prisma.liveMessage.create({
                  data: {
                    guildId: guild.id,
                    game: data.game,
                    channelId,
                    messageId: message.id,
                    index
                  }
                })
              } else {
                try {
                  await rest.patch(Routes.channelMessage(channelId, liveMessage.messageId), {
                    body: {
                      components: [container.toJSON()],
                      flags: MessageFlags.IsComponentsV2
                    }
                  })
                } catch (error) {
                  const status = error instanceof Error && 'status' in error ? error.status : null
                  if (status !== 404) throw error

                  const message = (await rest.post(Routes.channelMessages(channelId), {
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
            })
          )
        }

        const chunksLength = Math.ceil(matches.length / chunkSize)

        const staleMessages = await prisma.liveMessage.findMany({
          where: {
            guildId: guild.id,
            game: data.game,
            channelId,
            index: {
              gte: chunksLength
            }
          }
        })

        for (const stale of staleMessages) {
          promises.push(
            limit(async () => {
              await rest.delete(Routes.channelMessage(stale.channelId, stale.messageId)).catch(() => null)
              await prisma.liveMessage.delete({
                where: {
                  id: stale.id
                }
              })
            })
          )
        }
      }

      const activeChannelIds = new Set(channelBatches.keys())

      for (const stale of guild.liveMessages.filter((liveMessage) => !activeChannelIds.has(liveMessage.channelId))) {
        promises.push(
          limit(async () => {
            await rest.delete(Routes.channelMessage(stale.channelId, stale.messageId)).catch(() => null)
            await prisma.liveMessage.delete({
              where: {
                id: stale.id
              }
            })
          })
        )
      }
    }

    await Promise.allSettled(promises)
    cursor = guilds[guilds.length - 1].id
  }
}