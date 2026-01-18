import { prisma } from '@db'
import type { $Enums } from '@generated'
import {
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ContainerBuilder,
  MessageFlags,
  type TextChannel
} from 'discord.js'
import { voidCatch } from '@/database/update-cache'
import { env } from '@/env'
import Service from '../../api'
import EmbedBuilder from '../../structures/builders/EmbedBuilder'
import createCommand from '../../structures/command/createCommand'
import type { MatchesData } from '../../types'
import Logger from '../../util/Logger'

const service = new Service(env.AUTH)

const tournaments: { [key: string]: RegExp[] } = {
  'Valorant Champions Tour': [/valorant champions/, /valorant masters/, /vct \d{4}/],
  'Valorant Challengers League': [/challengers \d{4}/, /vct \d{4}: ascension/],
  'Valorant Game Changers': [/game changers \d{4}/]
}

export default createCommand({
  name: 'admin',
  category: 'admin',
  description: 'See the dashboard and change the bot language',
  descriptionLocalizations: {
    'pt-BR': 'Veja o painel de controle e mude o idioma do bot'
  },
  options: [
    {
      type: 1,
      name: 'dashboard',
      nameLocalizations: {
        'pt-BR': 'painel'
      },
      description: 'Shows the dashboard',
      descriptionLocalizations: {
        'pt-BR': 'Mostra o painel de controle'
      }
    },
    {
      type: 1,
      name: 'language',
      nameLocalizations: {
        'pt-BR': 'idioma'
      },
      description: 'Change the languague that I interact on this server',
      descriptionLocalizations: {
        'pt-BR': 'Altera o idioma que eu interajo neste servidor'
      },
      options: [
        {
          type: 3,
          name: 'lang',
          description: 'Choose the language',
          descriptionLocalizations: {
            'pt-BR': 'Escolha o idioma'
          },
          choices: [
            {
              name: 'pt-BR',
              value: 'pt'
            },
            {
              name: 'en-US',
              value: 'en'
            },
            {
              name: 'es-MX',
              value: 'es'
            }
          ],
          required: true
        }
      ]
    },
    {
      type: 1,
      name: 'premium',
      description: 'Shows information about server premium',
      descriptionLocalizations: {
        'pt-BR': 'Mostra informações sobre o premium do servidor'
      }
    }
  ],
  permissions: ['ManageGuild', 'ManageChannels'],
  botPermissions: ['ManageMessages', 'SendMessages'],
  syntaxes: ['admin dashboard', 'adming language [lang]'],
  examples: ['admin dashboard', 'admin language pt-BR', 'admin language en-US'],
  messageComponentInteractionTime: 5 * 60 * 1000,
  async run({ ctx, t, id, app }) {
    if (ctx.args[0] === 'dashboard') {
      const guild = await app.prisma.guild.findUnique({
        where: {
          id: ctx.db.guild.id
        },
        select: {
          events: true
        }
      })

      const embed = new EmbedBuilder().setTitle(t('commands.admin.dashboard')).setDesc(
        t('commands.admin.desc', {
          lang: ctx.db.guild.lang.replace('en', 'English').replace('pt', 'Português'),
          limit:
            ctx.db.guild.tournamentsLength === Infinity
              ? '`Infinity`'
              : `${guild?.events.length ?? 0}/${ctx.db.guild.tournamentsLength}`,
          id,
          vlr_news: !ctx.db.guild.valorantNewsChannel
            ? '`undefined`'
            : `<#${ctx.db.guild.valorantNewsChannel}>`,
          vlr_live: !ctx.db.guild.valorantLiveFeedChannel
            ? '`undefined`'
            : `<#${ctx.db.guild.valorantLiveFeedChannel}>`,
          lol_news: !ctx.db.guild.lolNewsChannel
            ? '`undefined`'
            : `<#${ctx.db.guild.lolNewsChannel}>`,
          lol_live: !ctx.db.guild.lolLiveFeedChannel
            ? '`undefined`'
            : `<#${ctx.db.guild.lolLiveFeedChannel}>`
        })
      )

      await ctx.reply(
        embed.build({
          components: [
            {
              type: 1,
              components: [
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Primary)
                  .setLabel(t('commands.admin.vlr_esports_coverage'))
                  .setCustomId(`admin;${ctx.interaction.user.id};vlr`),
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Primary)
                  .setLabel(t('commands.admin.lol_esports_coverage'))
                  .setCustomId(`admin;${ctx.interaction.user.id};lol`)
              ]
            },
            {
              type: 1,
              components: [
                new ButtonBuilder()
                  .setLabel(t('commands.admin.resend', { game: 'VALORANT' }))
                  .setStyle(ButtonStyle.Danger)
                  .setCustomId(`admin;${ctx.interaction.user.id};resend;vlr`),
                new ButtonBuilder()
                  .setLabel(t('commands.admin.resend', { game: 'League of Legends' }))
                  .setStyle(ButtonStyle.Danger)
                  .setCustomId(`admin;${ctx.interaction.user.id};resend;lol`)
              ]
            }
          ]
        })
      )
    } else if (ctx.args[0] === 'language') {
      const options = {
        en: async () => {
          await prisma.guild.upsert({
            where: {
              id: ctx.db.guild.id
            },
            create: {
              id: ctx.guild.id
            },
            update: {
              lang: 'en'
            }
          })

          await ctx.reply('Now I will interact in English on this server!')
        },
        pt: async () => {
          await prisma.guild.upsert({
            where: {
              id: ctx.db.guild.id
            },
            create: {
              id: ctx.guild.id,
              lang: 'pt'
            },
            update: {
              lang: 'pt'
            }
          })

          await ctx.reply('Agora eu irei interagir em português neste servidor!')
        },
        es: async () => {
          await prisma.guild.upsert({
            where: {
              id: ctx.db.guild.id
            },
            create: {
              id: ctx.guild.id,
              lang: 'es'
            },
            update: {
              lang: 'es'
            }
          })

          await ctx.reply('¡Ahora voy a interactuar en español en este servidor!')
        }
      }

      await options[ctx.args[1] as 'pt' | 'en']()
    } else if (ctx.args[0] === 'premium') {
      if (!ctx.db.guild) {
        return await ctx.reply('commands.admin.no_premium')
      }

      const key = await app.prisma.guildKey.findUnique({
        where: {
          guildId: ctx.db.guild.id
        },
        include: {
          key: true
        }
      })

      if (!key || !key.key.expiresAt) {
        return await ctx.reply('commands.admin.no_premium')
      }

      const embed = new EmbedBuilder().setTitle('Premium').setDesc(
        t('commands.admin.premium', {
          key: key.key.type,
          expiresAt: `<t:${(key.key.expiresAt.getTime() / 1000).toFixed(0)}:R>`
        })
      )

      await ctx.reply(embed.build())
    }
  },
  async createMessageComponentInteraction({ ctx, t, app }) {
    if (ctx.args[2] === 'vlr') {
      ctx.setFlags(64)

      const guild = await app.prisma.guild.findUnique({
        where: {
          id: ctx.db.guild.id
        },
        include: {
          events: {
            where: {
              type: 'valorant'
            }
          }
        }
      })

      if (!guild) return

      const embed = new EmbedBuilder().setDesc(
        t('commands.admin.tournaments', { game: 'VALORANT' })
      )

      for (const event of guild.events) {
        embed.addField(
          event.name,
          t('commands.admin.event_channels', {
            ch1: `<#${event.channel1}>`,
            ch2: `<#${event.channel2}>`
          }),
          true
        )
      }

      await ctx.reply(embed.build())
    } else if (ctx.args[2] === 'lol') {
      ctx.setFlags(64)

      const guild = await app.prisma.guild.findUnique({
        where: {
          id: ctx.db.guild.id
        },
        include: {
          events: {
            where: {
              type: 'lol'
            }
          }
        }
      })

      if (!guild) return

      const embed = new EmbedBuilder().setDesc(
        t('commands.admin.tournaments', { game: 'League of Legends' })
      )

      for (const event of guild.events) {
        embed.addField(
          event.name,
          t('commands.admin.event_channels', {
            ch1: `<#${event.channel1}>`,
            ch2: `<#${event.channel2}>`
          }),
          true
        )
      }

      await ctx.reply(embed.build())
    } else if (ctx.args[2] === 'resend' && ctx.args[3] === 'vlr') {
      ctx.setFlags(64)

      if (ctx.db.guild.valorantResendTime && ctx.db.guild.valorantResendTime > new Date()) {
        return await ctx.reply('commands.admin.resend_time', {
          t: `<t:${(ctx.db.guild.valorantResendTime.getTime() / 1000).toFixed(0)}:R>`
        })
      }

      const button = new ButtonBuilder()
        .setLabel(t('commands.admin.continue'))
        .setStyle(ButtonStyle.Danger)
        .setCustomId(`admin;${ctx.interaction.user.id};continue;vlr`)

      await ctx.reply({
        content: t('commands.admin.confirm'),
        components: [
          {
            type: 1,
            components: [button.toJSON()]
          }
        ]
      })
    } else if (ctx.args[2] === 'resend' && ctx.args[3] === 'lol') {
      ctx.setFlags(64)

      if (ctx.db.guild.lolResendTime && ctx.db.guild.lolResendTime > new Date()) {
        return await ctx.reply('commands.admin.resend_time', {
          t: `<t:${(ctx.db.guild.lolResendTime.getTime() / 1000).toFixed(0)}:R>`
        })
      }

      const button = new ButtonBuilder()
        .setLabel(t('commands.admin.continue'))
        .setStyle(ButtonStyle.Danger)
        .setCustomId(`admin;${ctx.interaction.user.id};continue;lol`)

      await ctx.reply({
        content: t('commands.admin.confirm'),
        components: [
          {
            type: 1,
            components: [button.toJSON()]
          }
        ]
      })
    } else if (ctx.args[2] === 'continue' && ctx.args[3] === 'vlr') {
      if (ctx.db.guild.valorantResendTime && ctx.db.guild.valorantResendTime > new Date()) {
        return await ctx.edit('commands.admin.resend_time', {
          t: `<t:${(ctx.db.guild.valorantResendTime.getTime() / 1000).toFixed(0)}:R>`
        })
      }

      const guild = await app.prisma.guild.findUnique({
        where: {
          id: ctx.db.guild.id
        },
        include: {
          events: {
            where: {
              type: 'valorant'
            }
          },
          tbdMatches: {
            where: {
              type: 'valorant'
            }
          },
          key: true
        }
      })

      if (!guild) return

      guild.valorantMatches = []
      guild.valorantResendTime = new Date(Date.now() + 3600000)

      await ctx.edit('commands.admin.resending')

      const res = await service.getMatches('valorant')

      if (!res || !res.length) return

      const res2 = await service.getResults('valorant')
      if (
        guild.valorantMatches.length &&
        !res2.some(d => d.id === guild.valorantMatches[guild.valorantMatches.length - 1])
      )
        return

      const matches: {
        matchId: string
        guildId: string
        channel: string
        type: $Enums.EventType
      }[] = []

      let data: MatchesData[]

      if (guild.events.length > 5 && !guild.key) {
        if (
          guild.events
            .slice()
            .reverse()
            .slice(0, 5)
            .some(e => Object.keys(tournaments).includes(e.name))
        ) {
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
        } else
          data = res.filter(d =>
            guild.events
              .reverse()
              .slice(0, 5)
              .some(e => e.name === d.tournament.name)
          )
      } else {
        if (
          guild.events
            .slice()
            .reverse()
            .slice(0, 5)
            .some(e => Object.keys(tournaments).includes(e.name))
        ) {
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
        } else data = res.filter(d => guild.events.some(e => e.name === d.tournament.name))
      }

      for (const e of guild.events.filter(e => e.type === 'valorant')) {
        const channel = await app.channels.fetch(e.channel1)
        if (!channel || channel.type !== ChannelType.GuildText) continue

        try {
          const messages = await channel.messages.fetch({ limit: 100 })
          const messagesIds = messages.filter(m => m.author.id === app.user?.id).map(m => m.id)

          if (messagesIds.length === 1) {
            await channel.messages.delete(messagesIds[0])
          } else if (messagesIds.length) {
            await channel.bulkDelete(messagesIds)
          }
        } catch (e) {
          new Logger(app).error(e as Error)
        }
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

      for (const [channelId, matchesChunk] of channelBatches.entries()) {
        const chunkSize = 5

        for (let i = 0; i < matchesChunk.length; i += chunkSize) {
          const chunk = matchesChunk.slice(i, i + chunkSize)

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
                    .setLabel(t('helper.predict'))
                    .setCustomId(`predict;valorant;${d.id}`)
                    .setStyle(ButtonStyle.Success),
                  new ButtonBuilder()
                    .setLabel(t('helper.bet'))
                    .setCustomId(`bet;valorant;${d.id}`)
                    .setStyle(ButtonStyle.Secondary),
                  new ButtonBuilder()
                    .setLabel(t('helper.stats'))
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://vlr.gg/${d.id}`)
                )
              )
              .addSeparatorComponents(separator => separator)
          }

          const channel = ctx.app.channels.cache.get(channelId) as TextChannel

          if (!channel) continue

          if (container.components.length) {
            await channel
              .send({
                components: [container.toJSON()],
                flags: MessageFlags.IsComponentsV2
              })
              .catch(voidCatch)
          }
        }
      }

      await app.prisma.guild.update({
        where: {
          id: ctx.interaction.guildId!
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
          valorantResendTime: guild.valorantResendTime
        }
      })

      await ctx.edit('commands.admin.resent')
    } else if (ctx.args[2] === 'continue' && ctx.args[3] === 'lol') {
      if (ctx.db.guild.lolResendTime && ctx.db.guild.lolResendTime > new Date()) {
        return await ctx.edit('commands.admin.resend_time', {
          t: `<t:${(ctx.db.guild.lolResendTime.getTime() / 1000).toFixed(0)}:R>`
        })
      }

      const guild = await app.prisma.guild.findUnique({
        where: {
          id: ctx.db.guild.id
        },
        include: {
          events: {
            where: {
              type: 'lol'
            }
          },
          tbdMatches: {
            where: {
              type: 'lol'
            }
          },
          key: true
        }
      })

      if (!guild) return

      guild.lolMatches = []
      guild.tbdMatches = []
      guild.lolResendTime = new Date(Date.now() + 3600000)

      await ctx.edit('commands.admin.resending')

      const res = await service.getMatches('lol')

      if (!res || !res.length) return

      const res2 = await service.getResults('lol')

      if (
        guild.lolMatches.length &&
        !res2.some(d => d.id === guild.lolMatches[guild.lolMatches.length - 1])
      )
        return

      const matches: {
        matchId: string
        guildId: string
        channel: string
        type: $Enums.EventType
      }[] = []

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
        const channel = await app.channels.fetch(e.channel1)
        if (!channel || channel.type !== ChannelType.GuildText) continue

        try {
          const messages = await channel.messages.fetch({ limit: 100 })
          const messagesIds = messages.filter(m => m.author.id === app.user?.id).map(m => m.id)

          if (messagesIds.length === 1) {
            await channel.messages.delete(messagesIds[0])
          } else if (messagesIds.length) {
            await channel.bulkDelete(messagesIds)
          }
        } catch (e) {
          new Logger(app).error(e as Error)
        }
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
              if (d.stage.toLowerCase().includes('showmatch')) continue

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

              guild.lolMatches.push(d.id!)

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

      for (const [channelId, matchesChunk] of channelBatches.entries()) {
        const chunkSize = 5

        for (let i = 0; i < matchesChunk.length; i += chunkSize) {
          const chunk = matchesChunk.slice(i, i + chunkSize)

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
                    .setLabel(t('helper.predict'))
                    .setCustomId(`predict;lol;${d.id}`)
                    .setStyle(ButtonStyle.Success),
                  new ButtonBuilder()
                    .setLabel(t('helper.bet'))
                    .setCustomId(`bet;lol;${d.id}`)
                    .setStyle(ButtonStyle.Secondary)
                )
              )
              .addSeparatorComponents(separator => separator)
          }

          const channel = ctx.app.channels.cache.get(channelId) as TextChannel
          if (!channel) continue

          if (container.components.length) {
            await channel
              .send({
                components: [container.toJSON()],
                flags: MessageFlags.IsComponentsV2
              })
              .catch(voidCatch)
          }
        }
      }

      await app.prisma.guild.update({
        where: {
          id: ctx.interaction.guildId!
        },
        data: {
          lolMatches: guild.lolMatches,
          tbdMatches: {
            create: guild.tbdMatches
          },
          lolResendTime: guild.lolResendTime
        }
      })

      await ctx.edit('commands.admin.resent')
    }
  }
})
