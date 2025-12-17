import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder
} from 'discord.js'
import createCommand from '../../structures/command/createCommand'
import SelectMenuBuilder from '../../structures/builders/SelectMenuBuilder'
import { valorant_agents } from '../../config'
import EmbedBuilder from '../../structures/builders/EmbedBuilder'
import { prisma } from '@db'

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
          }
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
      },
      options: [
        {
          type: ApplicationCommandOptionType.Integer,
          name: 'page',
          nameLocalizations: {
            'pt-BR': 'página'
          },
          description: 'Insert a page',
          descriptionLocalizations: {
            'pt-BR': 'Insira a página'
          }
        }
      ]
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
    const actions: { [key: string]: () => Promise<unknown> } = {
      join: async() => {
        const map = await ctx.app.redis.get('arena:map')

        if(!map) return

        if(
          !ctx.db.user.team_name
          || !ctx.db.user.arena_metadata
          || ctx.db.user.arena_metadata.lineup.length < 5
          || ctx.db.user.arena_metadata?.map !== map
        ) {
          return await ctx.reply('commands.arena.invalid_lineup', { map })
        }

        const isAlreadyInQueue = await ctx.app.redis.get(`arena:in_queue:${ctx.db.user.id}`)

        if(isAlreadyInQueue) {
          return await ctx.reply('commands.arena.is_already_in_queue')
        }

        const payload: {
          userId: string
          channelId?: string
        } = {
          userId: ctx.db.user.id
        }

        if(ctx.args[1]) {
          payload.channelId = ctx.interaction.channelId
        }

        await Promise.all([
          ctx.app.redis.set(`arena:in_queue:${ctx.db.user.id}`, JSON.stringify(payload), 'EX', 1800),
          ctx.app.redis.lpush('arena:queue', JSON.stringify(payload))
        ])

        await ctx.reply('commands.arena.joined')
      },
      leave: async() => {
        const payload = await ctx.app.redis.get(`arena:in_queue:${ctx.db.user.id}`)

        if(!payload) {
          return await ctx.reply('commands.arena.is_not_in_queue')
        }

        await Promise.all([
          ctx.app.redis.del(`arena:in_queue:${ctx.db.user.id}`),
          ctx.app.redis.lrem('arena:queue', 0, payload)
        ])

        await ctx.reply('commands.arena.left')
      },
      lineup: async() => {
        if(
          !ctx.db.user.active_players.length &&
          !ctx.db.user.reserve_players.length
        ) {
          return await ctx.reply('commands.arena.no_players')
        }

        const page = ctx.args[1] as number ?? 1

        const map = ctx.t('commands.arena.map', { map: await ctx.app.redis.get('arena:map') })

        const container = new ContainerBuilder()
          .setAccentColor(6719296)
          .addTextDisplayComponents(
            text => text.setContent(map)
          )
          .addTextDisplayComponents(
            text => text.setContent(ctx.t('commands.arena.your_players'))
          )

        const allPlayers = [
          ...ctx.db.user.active_players,
          ...ctx.db.user.reserve_players
        ]
        let players = [...new Set(allPlayers)]

        const pages = Math.ceil(players.length / 10)

        if(page === 1) {
          players = players.slice(0, 10)
        }
        else {
          players = players.slice(page * 10 - 10, page * 10)
        }

        let i = 0

        for(const p of players) {
          container.addSectionComponents(
            section => section
              .addTextDisplayComponents(
                text => {
                  const player = ctx.app.players.get(p)

                  if(!player) return text

                  let content: string

                  const playerInLineup = ctx.db.user.arena_metadata?.lineup
                    .find(line => line.player === p)

                  if(playerInLineup) {
                    const emoji = valorant_agents.find(a => a.name === playerInLineup.agent.name)?.emoji

                    content = `- ${emoji} ${player.name} (${Math.floor(player.ovr)}) — ${player.collection}`
                  }
                  else {
                    content = `- ${player.name} (${Math.floor(player.ovr)}) — ${player.collection}`
                  }

                  return text.setContent(content)
                }
              )
              .setButtonAccessory(
                button => {
                  const player = ctx.db.user.arena_metadata?.lineup
                    .find(line => line.player === p)

                  if(player) {
                    return button
                      .setCustomId(`arena;${ctx.db.user.id};remove;${p};${i}`)
                      .setLabel(ctx.t('commands.arena.remove'))
                      .setStyle(ButtonStyle.Danger)
                  }

                  return button
                    .setCustomId(`arena;${ctx.db.user.id};promote;${p};${i}`)
                    .setLabel(ctx.t('commands.arena.promote'))
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(
                      ctx.db.user.arena_metadata !== null &&
                      ctx.db.user.arena_metadata.lineup.length >= 5
                    )
                }
              )
          )

          i++
        }

        const previous = new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setEmoji('1404176223621611572')
          .setCustomId(`arena;${ctx.db.user.id};${page - 1 < 1 ? 1 : page - 1};previous`)

        const next = new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setEmoji('1404176291829121028')
          .setCustomId(`arena;${ctx.db.user.id};${page + 1 > pages ? pages : page + 1};next`)

        if(page <= 1) previous.setDisabled()
        if(page >= pages) next.setDisabled()

        const row = new ActionRowBuilder()
          .setComponents(previous, next)

        await ctx.reply({
          flags: 'IsComponentsV2',
          components: [container, row.toJSON()]
        })
      },
      info: async() => {
        const now = new Date()
        const when = new Date(now)
        const today = now.getDay()

        when.setDate(now.getDate() + (7 - today))
        when.setHours(0, 0, 0, 0)

        const embed = new EmbedBuilder()
          .setTitle(ctx.t('commands.arena.embed.title'))
          .setDesc(ctx.t('commands.arena.embed.desc', {
            when: `<t:${Math.floor(when.getTime() / 1000)}:R>`,
            map: await ctx.app.redis.get('arena:map')
          }))

        await ctx.reply(embed.build())
      }
    }

    if(!actions[ctx.args[0].toString()]) return

    await actions[ctx.args[0].toString()]()
  },
  async createMessageComponentInteraction({ ctx, t }) {
    if(ctx.args[2] === 'promote') {
      const player = ctx.app.players.get(ctx.args[3])

      ctx.setFlags(64)

      if(
        ctx.db.user.arena_metadata?.lineup
          .some(line => line.player === player?.id.toString())
      ) {
        ctx.setFlags(64)

        return await ctx.reply('commands.duel.duplicated_cards')
      }

      if(
        (
          !ctx.db.user.active_players.includes(ctx.args[3]) &&
          !ctx.db.user.reserve_players.includes(ctx.args[3])
        ) ||
        !player
      ) {
        return await ctx.reply('commands.sell.player_not_found')
      }

      const controllers = new SelectMenuBuilder()
        .setCustomId(`arena;${ctx.interaction.user.id};agent;${ctx.args[3]};controller`)
        .setPlaceholder(t('helper.controllers'))
        .setOptions(
          ...valorant_agents
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
        .setCustomId(`arena;${ctx.interaction.user.id};agent;${ctx.args[3]};duelist`)
        .setPlaceholder(t('helper.duelists'))
        .setOptions(
          ...valorant_agents
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
        .setCustomId(`arena;${ctx.interaction.user.id};agent;${ctx.args[3]};initiators`)
        .setPlaceholder(t('helper.initiators'))
        .setOptions(
          ...valorant_agents
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
        .setCustomId(`arena;${ctx.interaction.user.id};agent;${ctx.args[3]};sentinels`)
        .setPlaceholder(t('helper.sentinels'))
        .setOptions(
          ...valorant_agents
            .filter(a => a.role === 'sentinel')
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(agent => {
              return {
                label: agent.name,
                value: agent.name
              }
            })
        )

      const row1 = new ActionRowBuilder<SelectMenuBuilder>()
        .setComponents(controllers)

      const row2 = new ActionRowBuilder<SelectMenuBuilder>()
        .setComponents(duelists)

      const row3 = new ActionRowBuilder<SelectMenuBuilder>()
        .setComponents(initiators)

      const row4 = new ActionRowBuilder<SelectMenuBuilder>()
        .setComponents(sentinels)

      await Promise.allSettled([
        ctx.reply({
          content: t('commands.arena.select_agent', { player: player.name }),
          components: [row1, row2, row3, row4]
        }),
        ctx.app.redis.set(`lineup:select:${ctx.db.user.id}`, ctx.interaction.message.id, 'EX', 300)
      ])
    }
    else if(ctx.args[2] === 'remove') {
      ctx.setFlags(64)

      const player = ctx.app.players.get(ctx.args[3])

      if(
        !player ||
        !ctx.db.user.arena_metadata?.lineup
          .some(line => line.player === player.id.toString())
      ) {
        return await ctx.reply('commands.sell.player_not_found')
      }

      await prisma.$transaction(async(tx) => {
        const index = ctx.db.user.arena_metadata?.lineup
          .findIndex(line => line.player === player.id.toString())

        if(index === undefined) return

        ctx.db.user.arena_metadata?.lineup.splice(index, 1)

        await tx.user.update({
          where: {
            id: ctx.db.user.id
          },
          data: {
            arena_metadata: ctx.db.user.arena_metadata!
          }
        })
        await Bun.redis.del(`user:${ctx.db.user.id}`)
      })

      const page = 1

      const map = t('commands.arena.map', { map: await ctx.app.redis.get('arena:map') })

      const container = new ContainerBuilder()
        .setAccentColor(6719296)
        .addTextDisplayComponents(
          text => text.setContent(map)
        )
        .addTextDisplayComponents(
          text => text.setContent(t('commands.arena.your_players'))
        )

      const allPlayers = [
        ...ctx.db.user.active_players,
        ...ctx.db.user.reserve_players
      ]
      let players = [...new Set(allPlayers)]

      const pages = Math.ceil(players.length / 10)

      if(page === 1) {
        players = players.slice(0, 10)
      }
      else {
        players = players.slice(page * 10 - 10, page * 10)
      }

      let i = 0
      for(const p of players) {
        container.addSectionComponents(
          section => section
            .addTextDisplayComponents(
              text => {
                const player = ctx.app.players.get(p)

                if(!player) return text

                let content: string

                const playerInLineup = ctx.db.user.arena_metadata?.lineup
                  .find(line => line.player === p)

                if(playerInLineup) {
                  const emoji = valorant_agents.find(a => a.name === playerInLineup.agent.name)?.emoji

                  content = `- ${emoji} ${player.name} (${Math.floor(player.ovr)}) — ${player.collection}`
                }
                else {
                  content = `- ${player.name} (${Math.floor(player.ovr)}) — ${player.collection}`
                }

                return text.setContent(content)
              }
            )
            .setButtonAccessory(
              button => {
                const player = ctx.db.user.arena_metadata?.lineup
                  .find(line => line.player === p)
                if(player) {
                  return button
                    .setCustomId(`arena;${ctx.db.user.id};remove;${p};${i}`)
                    .setLabel(t('commands.arena.remove'))
                    .setStyle(ButtonStyle.Danger)
                }

                return button
                  .setCustomId(`arena;${ctx.db.user.id};promote;${p};${i}`)
                  .setLabel(t('commands.arena.promote'))
                  .setStyle(ButtonStyle.Success)
                  .setDisabled(
                    ctx.db.user.arena_metadata !== null &&
                    ctx.db.user.arena_metadata.lineup.length >= 5
                  )
              }
            )
        )

        i++
      }

      const previous = new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setEmoji('1404176223621611572')
        .setCustomId(`arena;${ctx.db.user.id};${page - 1};previous`)

      const next = new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setEmoji('1404176291829121028')
        .setCustomId(`arena;${ctx.db.user.id};${page + 1};next`)

      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(previous, next)

      if(page <= 1) previous.setDisabled()
      if(page >= pages) next.setDisabled()

      await Promise.allSettled([
        ctx.interaction.message.edit({
          flags: 'IsComponentsV2',
          components: [container, row]
        }),
        ctx.reply('commands.remove.player_removed', {
          p: player.name
        })
      ])
    }
    else if(ctx.args[2] === 'agent') {
      if(!ctx.interaction.isStringSelectMenu()) return

      const value = ctx.interaction.values[0]
      const agent = valorant_agents.find(a => a.name === value)
      const player = ctx.app.players.get(ctx.args[3])

      if(!agent || !player) return

      if(
        ctx.db.user.arena_metadata?.lineup
          .some(line => line.agent.name === agent.name)
      ) {
        ctx.setFlags(64)

        return await ctx.reply('commands.duel.duplicated_agent')
      }

      await prisma.$transaction(async(tx) => {
        if(
          !ctx.db.user.arena_metadata ||
          !ctx.db.user.arena_metadata.lineup.length
        ) {
          ctx.db.user.arena_metadata = {
            map: (await ctx.app.redis.get('arena:map'))!,
            lineup: [
              {
                player: ctx.args[3],
                agent: {
                  name: agent.name,
                  role: agent.role
                }
              }
            ]
          }
        }
        else {
          ctx.db.user.arena_metadata.lineup.push({
            player: ctx.args[3],
            agent: {
              name: agent.name,
              role: agent.role
            }
          })
          ctx.db.user.arena_metadata.map = (await ctx.app.redis.get('arena:map'))!
        }

        await tx.user.update({
          where: {
            id: ctx.db.user.id
          },
          data: {
            arena_metadata: ctx.db.user.arena_metadata
          }
        })
        await Bun.redis.del(`user:${ctx.db.user.id}`)
      })

      const page = 1

      const map = t('commands.arena.map', { map: await ctx.app.redis.get('arena:map') })

      const container = new ContainerBuilder()
        .setAccentColor(6719296)
        .addTextDisplayComponents(
          text => text.setContent(map)
        )
        .addTextDisplayComponents(
          text => text.setContent(t('commands.arena.your_players'))
        )

      const allPlayers = [
        ...ctx.db.user.active_players,
        ...ctx.db.user.reserve_players
      ]
      let players = [...new Set(allPlayers)]

      const pages = Math.ceil(players.length / 10)

      if(page === 1) {
        players = players.slice(0, 10)
      }
      else {
        players = players.slice(page * 10 - 10, page * 10)
      }

      let i = 0
      for(const p of players) {
        container.addSectionComponents(
          section => section
            .addTextDisplayComponents(
              text => {
                const player = ctx.app.players.get(p)

                if(!player) return text

                let content: string

                const playerInLineup = ctx.db.user.arena_metadata?.lineup
                  .find(line => line.player === p)

                if(playerInLineup) {
                  const emoji = valorant_agents.find(a => a.name === playerInLineup.agent.name)?.emoji

                  content = `- ${emoji} ${player.name} (${Math.floor(player.ovr)}) — ${player.collection}`
                }
                else {
                  content = `- ${player.name} (${Math.floor(player.ovr)}) — ${player.collection}`
                }

                return text.setContent(content)
              }
            )
            .setButtonAccessory(
              button => {
                const player = ctx.db.user.arena_metadata?.lineup
                  .find(line => line.player === p)
                if(player) {
                  return button
                    .setCustomId(`arena;${ctx.db.user.id};remove;${p};${i}`)
                    .setLabel(t('commands.arena.remove'))
                    .setStyle(ButtonStyle.Danger)
                }

                return button
                  .setCustomId(`arena;${ctx.db.user.id};promote;${p};${i}`)
                  .setLabel(t('commands.arena.promote'))
                  .setStyle(ButtonStyle.Success)
                  .setDisabled(
                    ctx.db.user.arena_metadata !== null &&
                    ctx.db.user.arena_metadata.lineup.length >= 5
                  )
              }
            )
        )

        i++
      }

      const previous = new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setEmoji('1404176223621611572')
        .setCustomId(`arena;${ctx.db.user.id};${page - 1};previous`)

      const next = new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setEmoji('1404176291829121028')
        .setCustomId(`arena;${ctx.db.user.id};${page + 1};next`)

      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(previous, next)

      if(page <= 1) previous.setDisabled()
      if(page >= pages) next.setDisabled()

      const messageId = await ctx.app.redis.get(`lineup:select:${ctx.db.user.id}`)

      if(!messageId) return

      const message = ctx.interaction.channel!.messages.cache.get(messageId)

      if(!message) return

      await Promise.allSettled([
        message.edit({
          flags: 'IsComponentsV2',
          components: [container, row]
        }),
        ctx.edit('commands.arena.agent_selected', {
          p: player.name,
          agent: agent.name
        }),
        ctx.app.redis.del(`lineup:select:${ctx.db.user.id}`)
      ])
    }
    else {
      if(
        !ctx.db.user.active_players.length &&
        !ctx.db.user.reserve_players.length
      ) {
        return await ctx.reply('commands.arena.no_players')
      }

      const page = Number(ctx.args[2])

      const map = t('commands.arena.map', { map: await ctx.app.redis.get('arena:map') })

      const container = new ContainerBuilder()
        .setAccentColor(6719296)
        .addTextDisplayComponents(
          text => text.setContent(map)
        )
        .addTextDisplayComponents(
          text => text.setContent(t('commands.arena.your_players'))
        )

      const allPlayers = [
        ...ctx.db.user.active_players,
        ...ctx.db.user.reserve_players
      ]
      let players = [...new Set(allPlayers)]

      const pages = Math.ceil(players.length / 10)

      if(page === 1) {
        players = players.slice(0, 10)
      }
      else {
        players = players.slice(page * 10 - 10, page * 10)
      }

      let i = 0
      for(const p of players) {
        container.addSectionComponents(
          section => section
            .addTextDisplayComponents(
              text => {
                const player = ctx.app.players.get(p)

                if(!player) return text

                let content: string

                const playerInLineup = ctx.db.user.arena_metadata?.lineup
                  .find(line => line.player === p)

                if(playerInLineup) {
                  const emoji = valorant_agents.find(a => a.name === playerInLineup.agent.name)?.emoji

                  content = `- ${emoji} ${player.name} (${Math.floor(player.ovr)}) — ${player.collection}`
                }
                else {
                  content = `- ${player.name} (${Math.floor(player.ovr)}) — ${player.collection}`
                }

                return text.setContent(content)
              }
            )
            .setButtonAccessory(
              button => {
                const player = ctx.db.user.arena_metadata?.lineup
                  .find(line => line.player === p)

                if(player) {
                  return button
                    .setCustomId(`arena;${ctx.db.user.id};remove;${p};${i}`)
                    .setLabel(t('commands.arena.remove'))
                    .setStyle(ButtonStyle.Danger)
                }

                return button
                  .setCustomId(`arena;${ctx.db.user.id};promote;${p};${i}`)
                  .setLabel(t('commands.arena.promote'))
                  .setStyle(ButtonStyle.Success)
                  .setDisabled(
                    ctx.db.user.arena_metadata !== null &&
                    ctx.db.user.arena_metadata.lineup.length >= 5
                  )
              }
            )
        )

        i++
      }

      const previous = new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setEmoji('1404176223621611572')
        .setCustomId(`arena;${ctx.db.user.id};${page - 1};previous`)

      const next = new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setEmoji('1404176291829121028')
        .setCustomId(`arena;${ctx.db.user.id};${page + 1};next`)

      if(page <= 1) previous.setDisabled()
      if(page >= pages) next.setDisabled()

      await ctx.edit({
        flags: 'IsComponentsV2',
        components: [
          container,
          {
            type: 1,
            components: [previous, next]
          }
        ]
      })
    }
  }
})