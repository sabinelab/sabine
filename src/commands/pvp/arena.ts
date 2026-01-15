import { prisma } from '@db'
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder
} from 'discord.js'
import { valorantAgents } from '../../config'
import EmbedBuilder from '../../structures/builders/EmbedBuilder'
import SelectMenuBuilder from '../../structures/builders/SelectMenuBuilder'
import createCommand from '../../structures/command/createCommand'

export default createCommand({
  name: 'arena',
  description: 'Join the Arena queue, see the leaderboard, and more',
  descriptionLocalizations: {
    'pt-BR': 'Entre na fila da Arena, veja a tabela, e mais'
  },
  category: 'pvp',
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'join',
      nameLocalizations: {
        'pt-BR': 'entrar'
      },
      description: 'Join the Arena queue',
      descriptionLocalizations: {
        'pt-BR': 'Entre na fila da Arena'
      },
      options: [
        {
          type: ApplicationCommandOptionType.Boolean,
          name: 'notify',
          nameLocalizations: {
            'pt-BR': 'notificar'
          },
          description: 'Notify when finished',
          descriptionLocalizations: {
            'pt-BR': 'Notificar quando acabar'
          },
          required: true
        }
      ]
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'leave',
      nameLocalizations: {
        'pt-BR': 'sair'
      },
      description: 'Leave the Arena queue',
      descriptionLocalizations: {
        'pt-BR': 'Saia da fila da Arena'
      }
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'lineup',
      description: 'Change your lineup for Arena',
      descriptionLocalizations: {
        'pt-BR': 'Altere sua lineup para a Arena'
      }
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'info',
      description: 'View information about the Arena',
      descriptionLocalizations: {
        'pt-BR': 'Veja informações sobre a Arena'
      }
    }
  ],
  messageComponentInteractionTime: 5 * 60 * 1000,
  async run({ ctx }) {
    const cards = await prisma.card.findMany({
      where: {
        profileId: ctx.db.profile.id,
        arenaRoster: true
      }
    })

    const actions: { [key: string]: () => Promise<unknown> } = {
      join: async () => {
        const map = await ctx.app.redis.get('arena:map')

        if (!map) {
          return await ctx.reply('commands.arena.null_map')
        }

        if (
          !ctx.db.profile.teamName ||
          cards.filter(c => c.arenaAgentName && c.arenaRoster && c.arenaAgentRole).length < 5
        ) {
          return await ctx.reply('commands.arena.invalid_lineup', {
            map,
            cmd: `</arena lineup:${ctx.app.commands.get('arena')?.id}>`
          })
        }

        const counts: { [key: string]: number } = {}
        const duplicates = Object.values(counts).filter(count => count > 1).length

        for (const c of cards) {
          counts[c.playerId] = (counts[c.playerId] || 0) + 1
        }

        if (duplicates) {
          return await ctx.reply('commands.duel.duplicated_cards')
        }

        const isAlreadyInQueue = await ctx.app.redis.exists(
          `arena:in_queue:${ctx.db.profile.userId}`
        )

        if (isAlreadyInQueue) {
          return await ctx.reply('commands.arena.is_already_in_queue')
        }

        const payload: {
          userId: string
          channelId?: string
          guildId: string
        } = {
          userId: ctx.db.profile.userId,
          guildId: ctx.db.guild.id
        }

        if (ctx.args[1]) {
          payload.channelId = ctx.interaction.channelId
        }

        await Promise.all([
          ctx.app.redis.set(`arena:in_queue:${ctx.db.profile.userId}`, JSON.stringify(payload)),
          ctx.app.redis.lpush('arena:queue', JSON.stringify(payload))
        ])

        await ctx.reply('commands.arena.joined')
      },
      leave: async () => {
        const payload = await ctx.app.redis.get(`arena:in_queue:${ctx.db.profile.userId}`)

        if (!payload) {
          return await ctx.reply('commands.arena.is_not_in_queue')
        }

        await Promise.all([
          ctx.app.redis.unlink(`arena:in_queue:${ctx.db.profile.userId}`),
          ctx.app.redis.lrem('arena:queue', 0, payload)
        ])

        await ctx.reply('commands.arena.left')
      },
      lineup: async () => {
        if (!cards.length) {
          return await ctx.reply('commands.arena.no_players', {
            cmd: `</roster:${ctx.app.commands.get('roster')?.id}>`
          })
        }

        const map = ctx.t('commands.arena.map', {
          map: await ctx.app.redis.get('arena:map'),
          cmd: `</roster:${ctx.app.commands.get('roster')?.id}>`
        })

        const container = new ContainerBuilder()
          .setAccentColor(6719296)
          .addTextDisplayComponents(text => text.setContent(map))
          .addTextDisplayComponents(text => text.setContent(ctx.t('commands.arena.your_players')))

        for (const c of cards) {
          container
            .addTextDisplayComponents(text => {
              const player = ctx.app.players.get(c.playerId)

              if (!player) return text

              let content: string

              if (c.arenaAgentName && c.arenaAgentRole) {
                const emoji = valorantAgents.find(a => a.name === c.arenaAgentName)?.emoji

                content = `- ${emoji} ${player.name} (${Math.floor(c.overall)}) — ${player.collection}`
              } else {
                content = `- ${player.name} (${Math.floor(c.overall)}) — ${player.collection}`
              }

              return text.setContent(content)
            })
            .addActionRowComponents(row =>
              row.setComponents(
                new ButtonBuilder()
                  .setCustomId(`arena;${ctx.db.profile.userId};remove;${c.id}`)
                  .setLabel(ctx.t('commands.arena.remove'))
                  .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                  .setCustomId(`arena;${ctx.db.profile.userId};promote;${c.id}`)
                  .setLabel(ctx.t('commands.arena.promote'))
                  .setStyle(ButtonStyle.Primary)
              )
            )
        }

        await ctx.reply({
          flags: 'IsComponentsV2',
          components: [container]
        })
      },
      info: async () => {
        const now = new Date()
        const when = new Date(now)
        const today = now.getDay()

        when.setDate(now.getDate() + (7 - today))
        when.setHours(0, 0, 0, 0)

        const embed = new EmbedBuilder().setTitle(ctx.t('commands.arena.embed.title')).setDesc(
          ctx.t('commands.arena.embed.desc', {
            when: `<t:${Math.floor(when.getTime() / 1000)}:R>`,
            map: await ctx.app.redis.get('arena:map'),
            queueLength: await Bun.redis.llen('arena:queue')
          })
        )

        await ctx.reply(embed.build())
      }
    }

    if (!actions[ctx.args[0].toString()]) return

    await actions[ctx.args[0].toString()]()
  },
  async createMessageComponentInteraction({ ctx, t }) {
    if (ctx.args[2] === 'promote') {
      const card = await prisma.card.findFirst({
        where: {
          id: BigInt(ctx.args[3]),
          profileId: ctx.db.profile.id
        }
      })
      const player = ctx.app.players.get(card?.playerId ?? '')

      ctx.setFlags(64)

      if (!player || !card) {
        return await ctx.reply('commands.sell.player_not_found')
      }

      const controllers = new SelectMenuBuilder()
        .setCustomId(`arena;${ctx.interaction.user.id};agent;${card.id};controller`)
        .setPlaceholder(t('helper.controllers'))
        .setOptions(
          ...valorantAgents
            .filter(a => a.role === 'controller')
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(agent => {
              return {
                label: agent.name,
                value: agent.name
              }
            })
        )

      const duelists = new SelectMenuBuilder()
        .setCustomId(`arena;${ctx.interaction.user.id};agent;${card.id};duelist`)
        .setPlaceholder(t('helper.duelists'))
        .setOptions(
          ...valorantAgents
            .filter(a => a.role === 'duelist')
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(agent => {
              return {
                label: agent.name,
                value: agent.name
              }
            })
        )

      const initiators = new SelectMenuBuilder()
        .setCustomId(`arena;${ctx.interaction.user.id};agent;${card.id};initiators`)
        .setPlaceholder(t('helper.initiators'))
        .setOptions(
          ...valorantAgents
            .filter(a => a.role === 'initiator')
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(agent => {
              return {
                label: agent.name,
                value: agent.name
              }
            })
        )

      const sentinels = new SelectMenuBuilder()
        .setCustomId(`arena;${ctx.interaction.user.id};agent;${card.id};sentinels`)
        .setPlaceholder(t('helper.sentinels'))
        .setOptions(
          ...valorantAgents
            .filter(a => a.role === 'sentinel')
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(agent => {
              return {
                label: agent.name,
                value: agent.name
              }
            })
        )

      const row1 = new ActionRowBuilder<SelectMenuBuilder>().setComponents(controllers)

      const row2 = new ActionRowBuilder<SelectMenuBuilder>().setComponents(duelists)

      const row3 = new ActionRowBuilder<SelectMenuBuilder>().setComponents(initiators)

      const row4 = new ActionRowBuilder<SelectMenuBuilder>().setComponents(sentinels)

      await Promise.all([
        ctx.reply({
          content: t('commands.arena.select_agent', { player: player.name }),
          components: [row1, row2, row3, row4]
        }),
        ctx.app.redis.set(
          `lineup:select:${ctx.db.guild.id}:${ctx.db.profile.userId}`,
          ctx.interaction.message.id,
          'EX',
          300
        )
      ])
    } else if (ctx.args[2] === 'remove') {
      ctx.setFlags(64)

      const card = await prisma.card.findFirst({
        where: {
          id: BigInt(ctx.args[3]),
          profileId: ctx.db.profile.id
        }
      })
      const player = ctx.app.players.get(card?.playerId ?? '')

      if (!player || !card) {
        return await ctx.reply('commands.sell.player_not_found')
      }

      await prisma.card.update({
        where: {
          id: card.id
        },
        data: {
          arenaAgentName: null,
          arenaAgentRole: null,
          arenaRoster: false
        }
      })

      const map = t('commands.arena.map', {
        map: await ctx.app.redis.get('arena:map'),
        cmd: `</roster:${ctx.app.commands.get('roster')?.id}>`
      })
      const cards = await prisma.card.findMany({
        where: {
          profileId: ctx.db.profile.id,
          arenaRoster: true
        }
      })

      const container = new ContainerBuilder()
        .setAccentColor(6719296)
        .addTextDisplayComponents(text => text.setContent(map))
        .addTextDisplayComponents(text => text.setContent(ctx.t('commands.arena.your_players')))

      for (const c of cards) {
        container
          .addTextDisplayComponents(text => {
            const player = ctx.app.players.get(c.playerId)

            if (!player) return text

            let content: string

            if (c.arenaAgentName && c.arenaAgentRole) {
              const emoji = valorantAgents.find(a => a.name === c.arenaAgentName)?.emoji

              content = `- ${emoji} ${player.name} (${Math.floor(c.overall)}) — ${player.collection}`
            } else {
              content = `- ${player.name} (${Math.floor(c.overall)}) — ${player.collection}`
            }

            return text.setContent(content)
          })
          .addActionRowComponents(row =>
            row.setComponents(
              new ButtonBuilder()
                .setCustomId(`arena;${ctx.db.profile.userId};remove;${c.id}`)
                .setLabel(ctx.t('commands.arena.remove'))
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId(`arena;${ctx.db.profile.userId};promote;${c.id}`)
                .setLabel(ctx.t('commands.arena.promote'))
                .setStyle(ButtonStyle.Primary)
            )
          )
      }

      await Promise.allSettled([
        ctx.interaction.message.edit({
          flags: 'IsComponentsV2',
          components: [container]
        }),
        ctx.reply('commands.remove.player_removed', {
          p: player.name
        })
      ])
    } else if (ctx.args[2] === 'agent') {
      if (!ctx.interaction.isStringSelectMenu()) return

      let cards = await prisma.card.findMany({
        where: {
          profileId: ctx.db.profile.id,
          arenaRoster: true
        }
      })

      const value = ctx.interaction.values[0]
      const agent = valorantAgents.find(a => a.name === value)
      const card = await prisma.card.findFirst({
        where: {
          arenaRoster: true,
          profileId: ctx.db.profile.id,
          id: BigInt(ctx.args[3])
        }
      })
      const player = ctx.app.players.get(card?.playerId ?? '')

      if (!agent || !player || !card) return

      if (cards.some(c => c.arenaAgentName === agent.name)) {
        ctx.setFlags(64)

        return await ctx.reply('commands.duel.duplicated_agent')
      }

      await prisma.card.update({
        where: {
          id: card.id
        },
        data: {
          arenaAgentName: agent.name,
          arenaAgentRole: agent.role
        }
      })

      const map = t('commands.arena.map', {
        map: await ctx.app.redis.get('arena:map'),
        cmd: `</roster:${ctx.app.commands.get('roster')?.id}>`
      })
      cards = await prisma.card.findMany({
        where: {
          profileId: ctx.db.profile.id,
          arenaRoster: true
        }
      })

      const container = new ContainerBuilder()
        .setAccentColor(6719296)
        .addTextDisplayComponents(text => text.setContent(map))
        .addTextDisplayComponents(text => text.setContent(ctx.t('commands.arena.your_players')))

      for (const c of cards) {
        container
          .addTextDisplayComponents(text => {
            const player = ctx.app.players.get(c.playerId)

            if (!player) return text

            let content: string

            if (c.arenaAgentName && c.arenaAgentRole) {
              const emoji = valorantAgents.find(a => a.name === c.arenaAgentName)?.emoji

              content = `- ${emoji} ${player.name} (${Math.floor(c.overall)}) — ${player.collection}`
            } else {
              content = `- ${player.name} (${Math.floor(c.overall)}) — ${player.collection}`
            }

            return text.setContent(content)
          })
          .addActionRowComponents(row =>
            row.setComponents(
              new ButtonBuilder()
                .setCustomId(`arena;${ctx.db.profile.userId};remove;${c.id}`)
                .setLabel(ctx.t('commands.arena.remove'))
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId(`arena;${ctx.db.profile.userId};promote;${c.id}`)
                .setLabel(ctx.t('commands.arena.promote'))
                .setStyle(ButtonStyle.Primary)
            )
          )
      }

      const messageId = await ctx.app.redis.get(
        `lineup:select:${ctx.db.guild.id}:${ctx.db.profile.userId}`
      )
      if (!messageId) return

      const message = ctx.interaction.channel?.messages.cache.get(messageId)
      if (!message) return

      await Promise.allSettled([
        message.edit({
          flags: 'IsComponentsV2',
          components: [container]
        }),
        ctx.edit('commands.arena.agent_selected', {
          p: player.name,
          agent: agent.name
        }),
        ctx.app.redis.unlink(`lineup:select:${ctx.db.guild.id}:${ctx.db.profile.userId}`)
      ])
    }
  }
})
