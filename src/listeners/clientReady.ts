import { prisma } from '@db'
import type { $Enums } from '@generated'
import t from '@i18n'
import Bull from 'bull'
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Collection,
  ContainerBuilder,
  type Message,
  MessageFlags,
  REST,
  Routes
} from 'discord.js'
import Service from '@/api'
import type { valorant_agents } from '@/config'
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
    channelId?: string
    guildId: string
  }
  parsedData2: {
    userId: string
    channelId?: string
    guildId: string
  }
}
const arenaMatchQueue = new Bull<ArenaQueue>('arena', { redis: env.REDIS_URL })

const tournaments: { [key: string]: RegExp[] } = {
  'Valorant Champions Tour': [/valorant champions/, /valorant masters/, /vct \d{4}/],
  'Valorant Challengers League': [/challengers \d{4}/],
  'Valorant Game Changers': [/game changers \d{4}/]
}

const sendValorantMatches = async (app: App) => {
  const [res, res2] = await Promise.all([
    service.getMatches('valorant'),
    service.getResults('valorant')
  ])

  if (!res || !res.length) return

  const guilds = await app.prisma.guild.findMany({
    include: {
      events: {
        where: {
          type: 'valorant'
        }
      },
      key: true,
      tbd_matches: {
        where: {
          type: 'valorant'
        }
      }
    }
  })

  if (!guilds.length) return

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
      guild.valorant_matches.length &&
      !res2.some(d => d.id === guild.valorant_matches[guild.valorant_matches.length - 1])
    )
      continue

    guild.valorant_matches = []

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

    for (const e of guild.events) {
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

            const index = guild.valorant_matches.findIndex(m => m === d.id)

            if (index > -1) guild.valorant_matches.splice(index, 1)

            guild.valorant_matches.push(d.id!)

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
      const chunkSize = 10

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
            const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
              new ButtonBuilder()
                .setLabel(t(guild.lang, 'helper.pickem.label'))
                .setStyle(ButtonStyle.Primary)
                .setCustomId('pickem')
            )

            await rest.post(Routes.channelMessages(channelId), {
              body: {
                components: [container.toJSON(), row.toJSON()],
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
          valorant_matches: guild.valorant_matches,
          tbd_matches: {
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
          live_messages: {
            deleteMany: {}
          }
        }
      })
    }

    updateGuildThunks.push(thunk)
  }

  await Promise.allSettled(bulkDeleteThunks.map(task => task()))
  await Promise.allSettled(updateGuildThunks.map(task => task()))
  await Promise.allSettled(sendMessageThunks.map(task => task()))
}

const sendValorantTBDMatches = async (app: App) => {
  const res = await service.getMatches('valorant')

  if (!res || !res.length) return

  const guilds = await app.prisma.guild.findMany({
    include: {
      tbd_matches: {
        where: {
          type: 'valorant'
        }
      }
    }
  })

  if (!guilds.length) return

  const sendMessageThunks: (() => Promise<unknown>)[] = []
  const updateGuildThunks: (() => Promise<unknown>)[] = []

  for (const guild of guilds) {
    if (!guild.tbd_matches.length) continue

    const channelBatches = new Map<string, any[]>()

    for (const match of guild.tbd_matches) {
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

        const m = guild.tbd_matches.filter(m => m.id === match.id)[0]

        const thunk = async () => {
          await app.prisma.guild.update({
            where: {
              id: guild.id
            },
            data: {
              tbd_matches: {
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
      const chunkSize = 10

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
            const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
              new ButtonBuilder()
                .setLabel(t(guild.lang, 'helper.pickem.label'))
                .setStyle(ButtonStyle.Primary)
                .setCustomId('pickem')
            )

            await rest.post(Routes.channelMessages(channelId), {
              body: {
                components: [container.toJSON(), row.toJSON()],
                flags: MessageFlags.IsComponentsV2
              }
            })
          }
        }

        sendMessageThunks.push(thunk)
      }
    }
  }

  await Promise.allSettled(updateGuildThunks.map(task => task()))
  await Promise.allSettled(sendMessageThunks.map(task => task()))
}

const sendLolMatches = async (app: App) => {
  const res = await service.getMatches('lol')
  const res2 = await service.getResults('lol')

  if (!res || !res.length) return

  const guilds = await app.prisma.guild.findMany({
    include: {
      events: {
        where: {
          type: 'lol'
        }
      },
      key: true,
      tbd_matches: {
        where: {
          type: 'lol'
        }
      }
    }
  })

  if (!guilds.length) return

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
      guild.lol_matches.length &&
      !res2.some(d => d.id === guild.lol_matches[guild.lol_matches.length - 1])
    )
      continue

    guild.lol_matches = []

    let data: MatchesData[]

    if (guild.events.length > 5 && !guild.key) {
      data = res.filter(d =>
        guild.events
          .reverse()
          .slice(0, 5)
          .some(e => e.name === d.tournament.name)
      )
    } else data = res.filter(d => guild.events.some(e => e.name === d.tournament.name))

    for (const e of guild.events) {
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

            const index = guild.lol_matches.findIndex(m => m === d.id)

            if (index > -1) guild.lol_matches.splice(index, 1)

            if (!d.stage.toLowerCase().includes('showmatch')) guild.lol_matches.push(d.id!)

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
      const chunkSize = 10

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
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setLabel(t(guild.lang, 'helper.pickem.label'))
                  .setStyle(ButtonStyle.Primary)
                  .setCustomId('pickem')
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
          lol_matches: guild.lol_matches,
          tbd_matches: {
            deleteMany: {
              type: 'lol'
            },
            create: matches.map(m => ({
              type: m.type,
              matchId: m.matchId,
              channel: m.channel
            }))
          },
          live_messages: {
            deleteMany: {}
          }
        }
      })
    }

    updateGuildThunks.push(thunk)
  }

  await Promise.allSettled(bulkDeleteThunks.map(task => task()))
  await Promise.allSettled(updateGuildThunks.map(task => task()))
  await Promise.allSettled(sendMessageThunks.map(task => task()))
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
    } else {
      app.user.setActivity({
        name: 'status',
        state: `[Shard ${app.shard?.ids}] Join support server! Link on about me`,
        type: 4
      })
    }

    if (!app.shard || !app.shard.ids[0]) {
      await app.postCommands()

      arenaMatchQueue.process('arena', async job => {
        // const player1 = await ProfileSchema.fetch(
        //   job.data.parsedData1.userId,
        //   job.data.parsedData1.guildId
        // )
        const player1 = await prisma.profile.findUnique({
          where: {
            userId_guildId: {
              userId: job.data.parsedData1.userId,
              guildId: job.data.parsedData1.guildId
            }
          },
          include: {
            cards: {
              where: {
                arena_roster: true,
                arena_agent_name: {
                  not: null
                },
                arena_agent_role: {
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
        const player2 = await prisma.profile.findUnique({
          where: {
            userId_guildId: {
              userId: job.data.parsedData2.userId,
              guildId: job.data.parsedData2.guildId
            }
          },
          include: {
            cards: {
              where: {
                arena_roster: true,
                arena_agent_name: {
                  not: null
                },
                arena_agent_role: {
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
        // const player2 = await ProfileSchema.fetch(
        //   job.data.parsedData2.userId,
        //   job.data.parsedData2.guildId
        // )

        // if (!player1 || !player1.arena_metadata || !player2 || !player2.arena_metadata) return
        if (!player1 || !player2 || !player1.cards.length || !player2.cards.length) return

        if (player1.cards.length < 5 && player2.cards.length === 5) {
          player1.rank_rating -= 15
          if (player1.rank_rating < 0) player1.rank_rating = 0

          await prisma.$transaction([
            prisma.profile.update({
              where: {
                userId_guildId: {
                  userId: player1.userId,
                  guildId: player1.guildId
                }
              },
              data: {
                rank_rating: player1.rank_rating
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
                rank_rating: {
                  increment: 10
                }
              }
            })
          ])
        } else if (player1.cards.length === 5 && player2.cards.length < 5) {
          player2.rank_rating -= 10
          if (player2.rank_rating < 0) player2.rank_rating = 0

          await prisma.$transaction([
            prisma.profile.update({
              where: {
                userId_guildId: {
                  userId: player1.userId,
                  guildId: player1.guildId
                }
              },
              data: {
                rank_rating: {
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
                rank_rating: player2.rank_rating
              }
            })
          ])
        } else if (player1.cards.length < 5 && player2.cards.length < 5) {
          player1.rank_rating -= 15
          player2.rank_rating -= 15

          if (player1.rank_rating < 0) player1.rank_rating = 0
          if (player2.rank_rating < 0) player2.rank_rating = 0

          await prisma.$transaction([
            prisma.profile.update({
              where: {
                userId_guildId: {
                  userId: player1.userId,
                  guildId: player1.guildId
                }
              },
              data: {
                rank_rating: player1.rank_rating
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
                rank_rating: player2.rank_rating
              }
            })
          ])
        }

        const map = await app.redis.get('arena:map')

        if (!map) return

        let match = new Match({
          teams: [
            {
              roster: player1.cards.map(c => {
                const player = app.players.get(c.playerId)!

                return {
                  ...player,
                  agent: {
                    name: c.arena_agent_name!,
                    role: c.arena_agent_role as (typeof valorant_agents)[number]['role']
                  },
                  credits: 800,
                  life: 100
                }
              }),
              name: player1.team_name!,
              tag: player1.team_tag!,
              user: player1.userId,
              guildId: player1.guildId
            },
            {
              roster: player2.cards.map(c => {
                const player = app.players.get(c.playerId)!

                return {
                  ...player,
                  agent: {
                    name: c.arena_agent_name!,
                    role: c.arena_agent_role as (typeof valorant_agents)[number]['role']
                  },
                  credits: 800,
                  life: 100
                }
              }),
              name: player2.team_name!,
              tag: player2.team_tag!,
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

        console.log(match.teams.find(t => t.user === '441932495693414410')?.roster)

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

          if (!profile.remind || profile.reminded || !profile.remind_in) return

          await rest.post(Routes.channelMessages(profile.remind_in), {
            body: {
              content: t(profile.user.lang, 'helper.reminder', { user: `<@${profile.id}>` })
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
