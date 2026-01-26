import { prisma } from '@db'
import type { $Enums } from '@generated'
import t from '@i18n'
import type { valorantAgents } from '@sabinelab/utils'
import Bull from 'bull'
import {
  ActivityType,
  ButtonBuilder,
  ButtonStyle,
  type Collection,
  ContainerBuilder,
  type Message,
  MessageFlags,
  REST,
  Routes
} from 'discord.js'
import pLimit from 'p-limit'
import Service from '@/api'
import { env } from '@/env'
import Match from '@/simulator/arena/Match'
import type App from '@/structures/app/App'
import createListener from '@/structures/app/createListener'
import type { MatchesData } from '@/types'
import Logger from '@/util/Logger'

const rest = new REST().setToken(env.BOT_TOKEN)
const service = new Service(env.AUTH)

export type ArenaQueue = {
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
const arenaMatchQueue = new Bull<ArenaQueue>('arena', { redis: env.REDIS_URL })

const tournaments: { [key: string]: RegExp[] } = {
  'Valorant Champions Tour': [/valorant champions/, /valorant masters/, /vct \d{4}/],
  'Valorant Challengers League': [/challengers \d{4}/],
  'Valorant Game Changers': [/game changers \d{4}/]
}

const sendLimit = pLimit(25)
const delLimit = pLimit(10)
const dbLimit = pLimit(50)

const sendValorantMatches = async (app: App) => {
  const [res, res2] = await Promise.all([
    service.getMatches('valorant'),
    service.getResults('valorant')
  ])

  if (!res || !res.length) return

  let cursor: string | undefined

  while (true) {
    const guilds = await app.prisma.guild.findMany({
      take: 1000,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
      include: {
        events: {
          where: {
            type: 'valorant'
          }
        },
        key: true,
        tbdMatches: {
          where: {
            type: 'valorant'
          }
        }
      }
    })

    if (!guilds.length) break

    const bulkDeleteThunks: (() => Promise<unknown>)[] = []
    const updateGuildThunks: (() => Promise<unknown>)[] = []
    const sendMessageThunks: (() => Promise<unknown>)[] = []

    for (const guild of guilds) {
      const matches: {
        matchId: string
        guildId: string
        channel: string
        type: $Enums.EventType
      }[] = []

      if (
        guild.valorantMatches.length &&
        !res2.some(d => d.id === guild.valorantMatches[guild.valorantMatches.length - 1])
      )
        continue

      guild.valorantMatches = []

      let data: MatchesData[]

      if (guild.events.length > 5 && !guild.key) {
        if (
          !guild.events
            .slice()
            .reverse()
            .slice(0, 5)
            .some(e => Object.keys(tournaments).includes(e.name))
        ) {
          data = res.filter(d =>
            guild.events
              .slice()
              .reverse()
              .slice(0, 5)
              .some(e => e.name === d.tournament.name)
          )
        } else {
          data = res.filter(d => {
            const events1 = guild.events
              .slice()
              .reverse()
              .slice(0, 5)
              .some(e => e.name === d.tournament.name)

            if (events1) return true

            const events2 = guild.events
              .slice()
              .reverse()
              .slice(0, 5)
              .some(e => {
                const tour = tournaments[e.name]
                if (!tour) return false
                return tour.some(regex =>
                  regex.test(d.tournament.name.replace(/\s+/g, ' ').trim().toLowerCase())
                )
              })

            if (events2) return true

            return false
          })
        }
      } else {
        if (!guild.events.some(e => Object.keys(tournaments).includes(e.name))) {
          data = res.filter(d => guild.events.some(e => e.name === d.tournament.name))
        } else {
          data = res.filter(d => {
            const events1 = guild.events.some(e => e.name === d.tournament.name)

            if (events1) return true

            const events2 = guild.events.some(e => {
              const tour = tournaments[e.name]
              if (!tour) return false
              return tour.some(regex =>
                regex.test(d.tournament.name.replace(/\s+/g, ' ').trim().toLowerCase())
              )
            })

            if (events2) return true

            return false
          })
        }
      }

      if (!data.length) continue

      for (const e of guild.events.filter(e => e.type === 'valorant')) {
        const thunk = async () => {
          try {
            const messages = (await rest.get(Routes.channelMessages(e.channel1), {
              query: new URLSearchParams({ limit: '100' })
            })) as Collection<string, Message>

            const messagesIds = messages.filter(m => m.author.id === app.user?.id).map(m => m.id)

            if (messagesIds.length === 1) {
              await rest.delete(Routes.channelMessage(e.channel1, messagesIds[0]))
            } else if (messagesIds.length) {
              await rest.post(Routes.channelBulkDelete(e.channel1), {
                body: {
                  messages: messagesIds
                }
              })
            }
          } catch (e) {
            new Logger(app).error(e as Error)
          }
        }

        bulkDeleteThunks.push(thunk)
      }

      const channelBatches = new Map<string, any[]>()

      try {
        for (const d of data.map(body => ({
          ...body,
          when: new Date(body.when)
        }))) {
          if (new Date(d.when).getDate() !== new Date(data[0].when).getDate()) continue

          for (const e of guild.events) {
            if (
              e.name === d.tournament.name ||
              tournaments[e.name]?.some(regex =>
                regex.test(d.tournament.name.trim().replace(/\s+/g, ' ').toLowerCase())
              )
            ) {
              if (d.stage.toLowerCase().includes('showmatch')) continue

              const emoji1 =
                app.emoji.get(d.teams[0].name.toLowerCase()) ??
                app.emoji.get(app.emojiAliases.get(d.teams[0].name.toLowerCase()) ?? '') ??
                app.emoji.get('default')
              const emoji2 =
                app.emoji.get(d.teams[1].name.toLowerCase()) ??
                app.emoji.get(app.emojiAliases.get(d.teams[1].name.toLowerCase()) ?? '') ??
                app.emoji.get('default')

              const index = guild.valorantMatches.findIndex(m => m === d.id)

              if (index > -1) guild.valorantMatches.splice(index, 1)

              guild.valorantMatches.push(d.id!)

              if (d.teams[0].name !== 'TBD' && d.teams[1].name !== 'TBD') {
                if (!channelBatches.has(e.channel1)) {
                  channelBatches.set(e.channel1, [])
                }

                channelBatches.get(e.channel1)?.push({ d, e, emoji1, emoji2 })
              } else {
                if (!matches.some(m => m.matchId === d.id)) {
                  matches.push({
                    matchId: d.id!,
                    channel: e.channel1,
                    guildId: guild.id,
                    type: 'valorant'
                  })
                }
              }

              break
            }
          }
        }
      } catch (e) {
        new Logger(app).error(e as Error)
      }

      for (const [channelId, matches] of channelBatches.entries()) {
        const chunkSize = 5

        for (let i = 0; i < matches.length; i += chunkSize) {
          const chunk = matches.slice(i, i + chunkSize)

          const container = new ContainerBuilder().setAccentColor(6719296)

          for (const data of chunk) {
            const { d, emoji1, emoji2 } = data

            container
              .addTextDisplayComponents(text => {
                let content = `### ${d.tournament.name}\n`

                content += `**${emoji1} ${d.teams[0].name} <:versus:1349105624180330516> ${d.teams[1].name} ${emoji2}**\n`
                content += `<t:${d.when.getTime() / 1000}:F> | <t:${d.when.getTime() / 1000}:R>\n`
                content += `-# ${d.stage}`

                return text.setContent(content)
              })
              .addActionRowComponents(row =>
                row.setComponents(
                  new ButtonBuilder()
                    .setLabel(t(guild.lang, 'helper.predict'))
                    .setCustomId(`predict;valorant;${d.id}`)
                    .setStyle(ButtonStyle.Success),
                  new ButtonBuilder()
                    .setLabel(t(guild.lang, 'helper.bet'))
                    .setCustomId(`bet;valorant;${d.id}`)
                    .setStyle(ButtonStyle.Secondary),
                  new ButtonBuilder()
                    .setLabel(t(guild.lang, 'helper.stats'))
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://vlr.gg/${d.id}`)
                )
              )
              .addSeparatorComponents(separator => separator)
          }

          const thunk = async () => {
            if (container.components.length) {
              await rest.post(Routes.channelMessages(channelId), {
                body: {
                  components: [container.toJSON()],
                  flags: MessageFlags.IsComponentsV2
                }
              })
            }
          }

          sendMessageThunks.push(thunk)
        }
      }

      const thunk = async () => {
        await app.prisma.guild.update({
          where: {
            id: guild.id
          },
          data: {
            valorantMatches: guild.valorantMatches,
            tbdMatches: {
              deleteMany: {
                type: 'valorant'
              },
              create: matches.length
                ? matches.map(m => ({
                    type: m.type,
                    matchId: m.matchId,
                    channel: m.channel
                  }))
                : undefined
            },
            liveMessages: {
              deleteMany: {}
            }
          }
        })
      }

      updateGuildThunks.push(thunk)
    }

    await Promise.allSettled(bulkDeleteThunks.map(task => delLimit(task)))
    await Promise.allSettled([
      ...updateGuildThunks.map(task => dbLimit(task)),
      ...sendMessageThunks.map(task => sendLimit(task))
    ])

    cursor = guilds[guilds.length - 1].id
  }
}

const sendValorantTBDMatches = async (app: App) => {
  const res = await service.getMatches('valorant')

  if (!res || !res.length) return

  let cursor: string | undefined

  while (true) {
    const guilds = await app.prisma.guild.findMany({
      take: 1000,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
      include: {
        tbdMatches: {
          where: {
            type: 'valorant'
          }
        }
      }
    })

    if (!guilds.length) break

    const sendMessageThunks: (() => Promise<unknown>)[] = []
    const updateGuildThunks: (() => Promise<unknown>)[] = []

    for (const guild of guilds) {
      if (!guild.tbdMatches.length) continue

      const channelBatches = new Map<string, any[]>()

      for (const match of guild.tbdMatches) {
        const data = res
          .map(body => ({
            ...body,
            when: new Date(body.when)
          }))
          .find(d => d.id === match.id)

        if (!data) continue

        if (data.teams[0].name !== 'TBD' && data.teams[1].name !== 'TBD') {
          const emoji1 =
            app.emoji.get(data.teams[0].name.toLowerCase()) ??
            app.emoji.get(app.emojiAliases.get(data.teams[0].name.toLowerCase()) ?? '') ??
            app.emoji.get('default')
          const emoji2 =
            app.emoji.get(data.teams[1].name.toLowerCase()) ??
            app.emoji.get(app.emojiAliases.get(data.teams[1].name.toLowerCase()) ?? '') ??
            app.emoji.get('default')

          if (!channelBatches.has(match.channel)) {
            channelBatches.set(match.channel, [])
          }

          channelBatches.get(match.channel)?.push({ data, emoji1, emoji2, match })

          const m = guild.tbdMatches.filter(m => m.id === match.id)[0]

          const thunk = async () => {
            await app.prisma.guild.update({
              where: {
                id: guild.id
              },
              data: {
                tbdMatches: {
                  delete: {
                    id: m.id
                  }
                }
              }
            })
          }

          updateGuildThunks.push(thunk)
        }
      }

      for (const [channelId, matches] of channelBatches.entries()) {
        const chunkSize = 5

        for (let i = 0; i < matches.length; i += chunkSize) {
          const chunk = matches.slice(i, i + chunkSize)

          const container = new ContainerBuilder().setAccentColor(6719296)

          for (const item of chunk) {
            const { data, emoji1, emoji2, match } = item

            container
              .addTextDisplayComponents(text => {
                let content = `### ${data.tournament.name}\n`

                content += `**${emoji1} ${data.teams[0].name} <:versus:1349105624180330516> ${data.teams[1].name} ${emoji2}**\n`
                content += `<t:${data.when.getTime() / 1000}:F> | <t:${data.when.getTime() / 1000}:R>\n`
                content += `-# ${data.stage}`

                return text.setContent(content)
              })
              .addActionRowComponents(row =>
                row.setComponents(
                  new ButtonBuilder()
                    .setLabel(t(guild.lang, 'helper.predict'))
                    .setCustomId(`predict;valorant;${match.id}`)
                    .setStyle(ButtonStyle.Success),
                  new ButtonBuilder()
                    .setLabel(t(guild.lang, 'helper.bet'))
                    .setCustomId(`bet;valorant;${data.id}`)
                    .setStyle(ButtonStyle.Secondary),
                  new ButtonBuilder()
                    .setLabel(t(guild.lang, 'helper.stats'))
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://vlr.gg/${data.id}`)
                )
              )
              .addSeparatorComponents(separator => separator)
          }

          const thunk = async () => {
            if (container.components.length) {
              await rest.post(Routes.channelMessages(channelId), {
                body: {
                  components: [container.toJSON()],
                  flags: MessageFlags.IsComponentsV2
                }
              })
            }
          }

          sendMessageThunks.push(thunk)
        }
      }
    }

    await Promise.allSettled([
      ...updateGuildThunks.map(task => dbLimit(task)),
      ...sendMessageThunks.map(task => sendLimit(task))
    ])

    cursor = guilds[guilds.length - 1].id
  }
}

const sendLolMatches = async (app: App) => {
  const res = await service.getMatches('lol')
  const res2 = await service.getResults('lol')

  if (!res || !res.length) return

  let cursor: string | undefined

  while (true) {
    const guilds = await app.prisma.guild.findMany({
      take: 1000,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
      include: {
        events: {
          where: {
            type: 'lol'
          }
        },
        key: true,
        tbdMatches: {
          where: {
            type: 'lol'
          }
        }
      }
    })

    if (!guilds.length) break

    const bulkDeleteThunks: (() => Promise<unknown>)[] = []
    const updateGuildThunks: (() => Promise<unknown>)[] = []
    const sendMessageThunks: (() => Promise<unknown>)[] = []

    for (const guild of guilds) {
      const matches: {
        matchId: string
        guildId: string
        channel: string
        type: $Enums.EventType
      }[] = []

      if (
        guild.lolMatches.length &&
        !res2.some(d => d.id === guild.lolMatches[guild.lolMatches.length - 1])
      )
        continue

      guild.lolMatches = []

      let data: MatchesData[]

      if (guild.events.length > 5 && !guild.key) {
        data = res.filter(d =>
          guild.events
            .reverse()
            .slice(0, 5)
            .some(e => e.name === d.tournament.name)
        )
      } else data = res.filter(d => guild.events.some(e => e.name === d.tournament.name))

      for (const e of guild.events.filter(e => e.type === 'lol')) {
        const thunk = async () => {
          try {
            const messages = (await rest.get(Routes.channelMessages(e.channel1), {
              query: new URLSearchParams({ limit: '100' })
            })) as Collection<string, Message>

            const messagesIds = messages.filter(m => m.author.id === app.user?.id).map(m => m.id)

            if (messagesIds.length === 1) {
              await rest.delete(Routes.channelMessage(e.channel1, messagesIds[0]))
            } else if (messagesIds.length) {
              await rest.post(Routes.channelBulkDelete(e.channel1), {
                body: {
                  messages: messagesIds
                }
              })
            }
          } catch (e) {
            new Logger(app).error(e as Error)
          }
        }

        bulkDeleteThunks.push(thunk)
      }

      const channelBatches = new Map<string, any[]>()

      try {
        for (const d of data.map(body => ({
          ...body,
          when: new Date(body.when)
        }))) {
          if (new Date(d.when).getDate() !== new Date(data[0].when).getDate()) continue

          for (const e of guild.events) {
            if (e.name === d.tournament.name) {
              const emoji1 =
                app.emoji.get(d.teams[0].name.toLowerCase()) ??
                app.emoji.get(app.emojiAliases.get(d.teams[0].name.toLowerCase()) ?? '') ??
                app.emoji.get('default')
              const emoji2 =
                app.emoji.get(d.teams[1].name.toLowerCase()) ??
                app.emoji.get(app.emojiAliases.get(d.teams[1].name.toLowerCase()) ?? '') ??
                app.emoji.get('default')

              const index = guild.lolMatches.findIndex(m => m === d.id)

              if (index > -1) guild.lolMatches.splice(index, 1)

              if (!d.stage.toLowerCase().includes('showmatch')) guild.lolMatches.push(d.id!)

              if (d.stage.toLowerCase().includes('showmatch')) continue

              if (d.teams[0].name !== 'TBD' && d.teams[1].name !== 'TBD') {
                if (!channelBatches.has(e.channel1)) {
                  channelBatches.set(e.channel1, [])
                }

                channelBatches.get(e.channel1)?.push({ d, emoji1, emoji2 })
              } else {
                matches.push({
                  matchId: d.id!,
                  channel: e.channel1,
                  guildId: guild.id,
                  type: 'lol'
                })
              }

              break
            }
          }
        }
      } catch (e) {
        new Logger(app).error(e as Error)
      }

      for (const [channelId, matches] of channelBatches.entries()) {
        const chunkSize = 5

        for (let i = 0; i < matches.length; i += chunkSize) {
          const chunk = matches.slice(i, i + chunkSize)

          const container = new ContainerBuilder().setAccentColor(6719296)

          for (const data of chunk) {
            const { d, emoji1, emoji2 } = data

            container
              .addTextDisplayComponents(text => {
                let content = `### ${d.tournament.full_name}\n`

                content += `**${emoji1} ${d.teams[0].name} <:versus:1349105624180330516> ${d.teams[1].name} ${emoji2}**\n`
                content += `<t:${d.when.getTime() / 1000}:F> | <t:${d.when.getTime() / 1000}:R>\n`
                content += `-# ${d.stage}`

                return text.setContent(content)
              })
              .addActionRowComponents(row =>
                row.setComponents(
                  new ButtonBuilder()
                    .setLabel(t(guild.lang, 'helper.predict'))
                    .setCustomId(`predict;lol;${d.id}`)
                    .setStyle(ButtonStyle.Success),
                  new ButtonBuilder()
                    .setLabel(t(guild.lang, 'helper.bet'))
                    .setCustomId(`bet;lol;${d.id}`)
                    .setStyle(ButtonStyle.Secondary)
                )
              )
              .addSeparatorComponents(separator => separator)
          }

          const thunk = async () => {
            if (container.components.length) {
              await rest.post(Routes.channelMessages(channelId), {
                body: {
                  components: [container.toJSON()],
                  flags: MessageFlags.IsComponentsV2
                }
              })
            }
          }

          sendMessageThunks.push(thunk)
        }
      }

      const thunk = async () => {
        await app.prisma.guild.update({
          where: {
            id: guild.id
          },
          data: {
            lolMatches: guild.lolMatches,
            tbdMatches: {
              deleteMany: {
                type: 'lol'
              },
              create: matches.map(m => ({
                type: m.type,
                matchId: m.matchId,
                channel: m.channel
              }))
            },
            liveMessages: {
              deleteMany: {}
            }
          }
        })
      }

      updateGuildThunks.push(thunk)
    }

    await Promise.allSettled(bulkDeleteThunks.map(task => delLimit(task)))
    await Promise.allSettled([
      ...updateGuildThunks.map(task => dbLimit(task)),
      ...sendMessageThunks.map(task => sendLimit(task))
    ])

    cursor = guilds[guilds.length - 1].id
  }
}

const runTasks = async (app: App) => {
  const tasks = [sendValorantMatches, sendValorantTBDMatches, sendLolMatches]

  await Promise.allSettled(tasks.map(task => task(app).catch(e => Logger.error(e))))

  setTimeout(async () => await runTasks(app), env.INTERVAL ?? 5 * 60 * 1000)
}

export default createListener({
  name: 'clientReady',
  async run(app) {
    Logger.info(`${app.user?.tag} online on Shard ${app.shard?.ids}!`)

    if (app.user?.id !== '1235576817683922954') {
      app.user?.setStatus('dnd')
      app.user?.setActivity({
        name: `sabinebot.xyz | ${env.PREFIX}claim`,
        type: ActivityType.Playing
      })
    } else {
      app.user.setActivity({
        name: `sabinebot.xyz | ${env.PREFIX}claim`,
        type: ActivityType.Playing
      })
    }

    await app.postCommands()

    if (!app.shard || !app.shard.ids[0]) {
      arenaMatchQueue.process('arena', async job => {
        const [player1, player2] = await Promise.all([
          prisma.profile.findUnique({
            where: {
              userId_guildId: {
                userId: job.data.parsedData1.userId,
                guildId: job.data.parsedData1.guildId
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
                userId: job.data.parsedData2.userId,
                guildId: job.data.parsedData2.guildId
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

        const map = await app.redis.get('arena:map')

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

        if (job.data.parsedData1.channelId) {
          const score1 = match.rounds.filter(r => r.winning_team === 0).length
          const score2 = match.rounds.filter(r => r.winning_team === 1).length

          messages.push(
            rest.post(Routes.channelMessages(job.data.parsedData1.channelId), {
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

        if (job.data.parsedData2.channelId) {
          const score1 = match.rounds.filter(r => r.winning_team === 0).length
          const score2 = match.rounds.filter(r => r.winning_team === 1).length

          messages.push(
            rest.post(Routes.channelMessages(job.data.parsedData2.channelId), {
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
      })

      app.queue
        .process('reminder', async job => {
          const profile = await prisma.profile.findUnique({
            where: {
              userId_guildId: {
                userId: job.data.user,
                guildId: job.data.guild
              }
            },
            include: {
              user: {
                select: {
                  lang: true
                }
              }
            }
          })

          if (!profile) return

          if (!profile.remind || profile.reminded || !profile.remindIn) return

          await rest.post(Routes.channelMessages(profile.remindIn), {
            body: {
              content: t(profile.user.lang, 'helper.reminder', {
                user: `<@${profile.id}>`,
                cmd: `</claim:${app.commands.get('claim')?.id}>`
              })
            }
          })

          await prisma.profile.update({
            where: {
              userId_guildId: {
                userId: job.data.user,
                guildId: job.data.guild
              }
            },
            data: {
              reminded: true
            }
          })
        })
        .catch(e => new Logger(app).error(e))

      await runTasks(app)
    }
  }
})
