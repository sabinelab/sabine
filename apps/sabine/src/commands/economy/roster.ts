import { prisma } from '@db'
import { calcPlayerOvr, calcPlayerPrice } from '@sabinelab/players'
import {
  ActionRowBuilder,
  type APISelectMenuOption,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder
} from 'discord.js'
import SelectMenuBuilder from '@/structures/builders/SelectMenuBuilder'
import createCommand from '@/structures/command/createCommand'
import { createProgressBar } from '@/util/createProgressBar'
import { formatNumber } from '@/util/formatNumber'
import { getBuff } from '@/util/getBuff'

const getUpgradeCost = (level: number) => {
  const base = 25_000
  const multiplier = 1.45

  return Math.floor(base * multiplier ** (level - 1))
}

export default createCommand({
  name: 'roster',
  category: 'economy',
  nameLocalizations: {
    'pt-BR': 'elenco'
  },
  description: 'Check your roster',
  descriptionLocalizations: {
    'pt-BR': 'Veja seu elenco'
  },
  args: {
    page: {
      type: ApplicationCommandOptionType.Integer,
      name: 'page',
      nameLocalizations: {
        'pt-BR': 'página'
      },
      description: 'Provide a page',
      descriptionLocalizations: {
        'pt-BR': 'Informe uma página'
      }
    }
  },
  messageComponentInteractionTime: 5 * 60 * 1000,
  async run({ ctx }) {
    const page = Number(ctx.args.page) || 1

    if (page <= 1) {
      const [cards, hasNextPage] = await Promise.all([
        prisma.card.findMany({
          where: {
            profileId: ctx.db.profile.id,
            activeRoster: true
          },
          orderBy: {
            id: 'desc'
          },
          skip: Math.max(0, (page - 1) * 5),
          take: 5
        }),
        prisma.card.findFirst({
          where: {
            profileId: ctx.db.profile.id,
            activeRoster: false
          },
          select: {
            id: true
          }
        })
      ])

      let value = 0
      let ovr = 0

      for (const card of cards) {
        const player = ctx.app.players.get(card.playerId)

        if (!player) continue

        ovr += card.overall
        value += calcPlayerPrice({
          ...player,
          acs: card.acs,
          gamesense: card.gamesense,
          movement: card.movement,
          aggression: card.aggression,
          hs: card.hs,
          aim: card.aim
        })
      }

      const container = new ContainerBuilder()
        .setAccentColor(6719296)
        .addTextDisplayComponents(text =>
          text.setContent(
            ctx.t('commands.roster.container.title') +
              '\n' +
              ctx.t('commands.roster.container.desc', {
                value: Math.floor(value).toLocaleString(),
                ovr: Math.floor(ovr / cards.length),
                name: ctx.db.profile.teamName
                  ? `${ctx.db.profile.teamName} (${ctx.db.profile.teamTag})`
                  : '`undefined`'
              })
          )
        )
        .addActionRowComponents(row =>
          row.setComponents(
            new ButtonBuilder()
              .setLabel(ctx.t('commands.roster.change_team'))
              .setCustomId(`roster;${ctx.author.id};team`)
              .setStyle(ButtonStyle.Primary)
          )
        )
        .addSeparatorComponents(separator => separator)

      if (cards.length) {
        container.addTextDisplayComponents(text =>
          text.setContent(
            ctx.t('commands.roster.container.active_players', { total: cards.length })
          )
        )

        for (const card of cards) {
          container
            .addTextDisplayComponents(text => {
              const player = ctx.app.players.get(card.playerId)

              if (!player) return text

              const emoji = ctx.app.emoji.get(player.role)

              return text.setContent(
                ctx.t('commands.roster.container.card_content', {
                  card: `**${emoji} ${player.name} (${Math.floor(card.overall)}) — ${player.collection}**`,
                  level: card.level,
                  xp: `${card.xp}/${card.requiredXp}`,
                  progress: createProgressBar(card.xp / card.requiredXp)
                })
              )
            })
            .addActionRowComponents(row =>
              row.setComponents(
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Danger)
                  .setLabel(ctx.t('commands.roster.container.button.remove'))
                  .setCustomId(`roster;${ctx.db.profile.userId};remove;${card.id}`),
                new ButtonBuilder()
                  .setLabel(ctx.t('commands.roster.container.button.promote_arena'))
                  .setCustomId(`roster;${ctx.author.id};promote-arena;${card.id}`)
                  .setStyle(ButtonStyle.Primary)
                  .setDisabled(card.arenaRoster),
                new ButtonBuilder()
                  .setLabel(ctx.t('commands.roster.practice'))
                  .setCustomId(`roster;${ctx.author.id};practice;${card.id}`)
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(card.requiredXp <= card.xp),
                new ButtonBuilder()
                  .setLabel(
                    ctx.t('commands.roster.upgrade', {
                      cost: formatNumber(getUpgradeCost(card.level))
                    })
                  )
                  .setCustomId(`roster;${ctx.author.id};upgrade;${card.id}`)
                  .setStyle(ButtonStyle.Success)
                  .setDisabled(card.requiredXp > card.xp)
              )
            )
        }
      }

      const previous = new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setEmoji('1404176223621611572')
        .setCustomId(`roster;${ctx.db.profile.userId};previous;${page - 1}`)

      const next = new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setEmoji('1404176291829121028')
        .setCustomId(`roster;${ctx.db.profile.userId};next;${page + 1}`)

      if (page <= 1) {
        previous.setDisabled()
      }
      if (!hasNextPage) {
        next.setDisabled()
      }

      const row = new ActionRowBuilder<ButtonBuilder>().setComponents(previous, next)

      await ctx.reply({
        flags: 'IsComponentsV2',
        components: [container, row.toJSON()]
      })
    } else {
      const [cards, cardsCount] = await Promise.all([
        prisma.card.findMany({
          where: {
            profileId: ctx.db.profile.id,
            activeRoster: false
          },
          orderBy: {
            id: 'desc'
          },
          skip: Math.max(0, (page - 2) * 5),
          take: 6
        }),
        prisma.card.count({
          where: {
            profileId: ctx.db.profile.id,
            activeRoster: false
          }
        })
      ])

      const container = new ContainerBuilder().setAccentColor(6719296)

      if (cards.length) {
        container.addTextDisplayComponents(text =>
          text.setContent(ctx.t('commands.roster.container.reserve_players', { total: cardsCount }))
        )

        for (const card of cards.slice(0, 5)) {
          container
            .addTextDisplayComponents(text => {
              const player = ctx.app.players.get(card.playerId)

              if (!player) return text

              const emoji = ctx.app.emoji.get(player.role)

              return text.setContent(
                ctx.t('commands.roster.container.card_content', {
                  card: `**${emoji} ${player.name} (${Math.floor(card.overall)}) — ${player.collection}**`,
                  level: card.level,
                  xp: `${card.xp}/${card.requiredXp}`,
                  progress: createProgressBar(card.xp / card.requiredXp)
                })
              )
            })
            .addActionRowComponents(row =>
              row.setComponents(
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Success)
                  .setLabel(ctx.t('commands.roster.container.button.promote'))
                  .setCustomId(`roster;${ctx.db.profile.userId};promote;${card.id}`),
                new ButtonBuilder()
                  .setLabel(ctx.t('commands.roster.container.button.promote_arena'))
                  .setCustomId(`roster;${ctx.author.id};promote-arena;${card.id}`)
                  .setStyle(ButtonStyle.Primary)
                  .setDisabled(card.arenaRoster),
                new ButtonBuilder()
                  .setLabel(ctx.t('commands.roster.practice'))
                  .setCustomId(`roster;${ctx.author.id};practice;${card.id}`)
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(card.requiredXp <= card.xp),
                new ButtonBuilder()
                  .setLabel(
                    ctx.t('commands.roster.upgrade', {
                      cost: formatNumber(getUpgradeCost(card.level))
                    })
                  )
                  .setCustomId(`roster;${ctx.author.id};upgrade;${card.id}`)
                  .setStyle(ButtonStyle.Success)
                  .setDisabled(card.requiredXp > card.xp)
              )
            )
        }
      }

      const previous = new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setEmoji('1404176223621611572')
        .setCustomId(`roster;${ctx.db.profile.userId};previous;${page - 1}`)

      const next = new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setEmoji('1404176291829121028')
        .setCustomId(`roster;${ctx.db.profile.userId};next;${page + 1}`)

      if (page <= 1) {
        previous.setDisabled()
      }
      if (cards.length <= 5) {
        next.setDisabled()
      }

      const row = new ActionRowBuilder<ButtonBuilder>().setComponents(previous, next)

      await ctx.reply({
        flags: 'IsComponentsV2',
        components: [container, row.toJSON()]
      })
    }
  },
  async createMessageComponentInteraction({ ctx, i, t }) {
    ctx.setFlags(64)

    if (ctx.args[2] === 'team') {
      await i.showModal({
        customId: `roster;${ctx.db.profile.userId};team`,
        title: t('commands.roster.modal.title'),
        components: [
          {
            type: 1,
            components: [
              {
                type: 4,
                customId: `roster;${i.user.id};team;response-1`,
                label: t('commands.roster.modal.team_name'),
                style: 1,
                minLength: 2,
                maxLength: 20,
                required: true,
                value: ctx.db.profile.teamName ?? undefined
              }
            ]
          },
          {
            type: 1,
            components: [
              {
                type: 4,
                customId: `roster;${i.user.id};team;response-2`,
                label: t('commands.roster.modal.team_tag'),
                style: 1,
                minLength: 2,
                maxLength: 4,
                required: true,
                value: ctx.db.profile.teamTag ?? undefined
              }
            ]
          }
        ]
      })
    } else if (ctx.args[2] === 'promote') {
      const cards = await prisma.card.findMany({
        where: {
          profileId: ctx.db.profile.id,
          activeRoster: false
        }
      })
      const card = cards.find(c => c.id === BigInt(ctx.args[3]))
      if (!card || card.activeRoster) {
        return await ctx.reply('commands.roster.already_promoted')
      }

      const player = ctx.app.players.get(card.playerId)
      if (!player) {
        return await ctx.reply('commands.promote.player_not_found')
      }

      if (cards.filter(c => c.activeRoster).length < 5) {
        await prisma.card.update({
          where: {
            id: BigInt(ctx.args[3])
          },
          data: {
            activeRoster: true
          }
        })

        return await ctx.reply('commands.promote.player_promoted', { p: player.name })
      }

      const options: APISelectMenuOption[] = []

      for (const c of cards.filter(c => c.activeRoster)) {
        const player = ctx.app.players.get(c.playerId)

        if (!player) break

        options.push({
          label: `${player.name} (${Math.floor(c.overall)})`,
          description: player.role,
          value: c.id.toString()
        })
      }

      const menu = new SelectMenuBuilder()
        .setCustomId(`roster;${ctx.db.profile.userId};promote2;${card.id}`)
        .setOptions(options)

      await ctx.reply(menu.build(t('commands.promote.select_player')))
    } else if (ctx.args[2] === 'remove') {
      const card = await prisma.card.findFirst({
        where: {
          profileId: ctx.db.profile.id,
          id: BigInt(ctx.args[3])
        }
      })
      if (!card) {
        return await ctx.reply('commands.remove.player_not_found')
      }

      const p = ctx.app.players.get(card.playerId)
      if (!p) {
        return await ctx.reply('commands.remove.player_not_found')
      }

      await prisma.card.update({
        where: {
          id: card.id
        },
        data: {
          activeRoster: false
        }
      })

      await ctx.reply('commands.remove.player_removed', {
        p: p.name
      })
    } else if (ctx.args[2] === 'promote2') {
      if (!ctx.interaction.isStringSelectMenu()) return

      const idActive = ctx.interaction.values[0].split(';')[0]
      const idSub = ctx.args[3]

      const [card] = await prisma.$transaction([
        prisma.card.update({
          where: {
            id: BigInt(idSub)
          },
          data: {
            activeRoster: true
          }
        }),
        prisma.card.update({
          where: {
            id: BigInt(idActive)
          },
          data: {
            activeRoster: false
          }
        })
      ])

      const p = ctx.app.players.get(card.playerId)

      await ctx.edit('commands.promote.player_promoted', { p: p?.name })
    } else if (ctx.args[2] === 'practice') {
      const card = await prisma.card.findFirst({
        where: {
          id: BigInt(ctx.args[3]),
          profileId: ctx.db.profile.id
        }
      })
      if (!card) {
        return await ctx.reply('commands.promote.player_not_found')
      }
      if (!ctx.app.players.get(card.playerId)) {
        return await ctx.reply('commands.promote.player_not_found')
      }
      if (card.level >= 15) {
        return await ctx.reply('commands.roster.max_level_reached')
      }

      await i.showModal({
        customId: `roster;${ctx.db.profile.userId};practice;${card.id}`,
        title: ctx.t('commands.roster.modal.practice.title'),
        components: [
          {
            type: 1,
            components: [
              {
                type: 4,
                customId: `roster;${ctx.db.profile.userId};practice;${ctx.args[3]};response`,
                label: ctx.t('commands.roster.modal.practice.description'),
                style: 1,
                minLength: 1,
                required: true,
                placeholder: ctx.t('commands.roster.modal.practice.max', {
                  max: card.requiredXp - card.xp
                }),
                value: (card.requiredXp - card.xp).toString()
              }
            ]
          }
        ]
      })
    } else if (ctx.args[2] === 'promote-arena') {
      const cards = await prisma.card.findMany({
        where: {
          profileId: ctx.db.profile.id
        }
      })
      const card = cards.find(c => c.id === BigInt(ctx.args[3]))

      if (!card || card.arenaRoster) {
        return await ctx.reply('commands.roster.already_promoted')
      }

      const player = ctx.app.players.get(card.playerId)
      if (!player) {
        return await ctx.reply('commands.promote.player_not_found')
      }

      if (cards.filter(c => c.arenaRoster).length < 5) {
        await prisma.card.update({
          where: {
            id: BigInt(ctx.args[3])
          },
          data: {
            arenaRoster: true
          }
        })

        return await ctx.reply('commands.promote.player_promoted', {
          p: player.name
        })
      }

      const options: APISelectMenuOption[] = []

      for (const c of cards.filter(c => c.arenaRoster)) {
        const player = ctx.app.players.get(c.playerId)

        if (!player) break

        options.push({
          label: `${player.name} (${Math.floor(c.overall)})`,
          description: player.role,
          value: c.id.toString()
        })
      }

      const menu = new SelectMenuBuilder()
        .setCustomId(`roster;${ctx.db.profile.userId};promote-arena2;${card.id}`)
        .setOptions(options)

      await ctx.reply(menu.build(t('commands.promote.select_player')))
    } else if (ctx.args[2] === 'promote-arena2') {
      if (!ctx.interaction.isStringSelectMenu()) return

      const idActive = ctx.interaction.values[0].split(';')[0]
      const idSub = ctx.args[3]

      const [card] = await prisma.$transaction([
        prisma.card.update({
          where: {
            id: BigInt(idSub)
          },
          data: {
            arenaRoster: true,
            arenaAgentName: null,
            arenaAgentRole: null
          }
        }),
        prisma.card.update({
          where: {
            id: BigInt(idActive)
          },
          data: {
            arenaRoster: false,
            arenaAgentName: null,
            arenaAgentRole: null
          }
        })
      ])

      const p = ctx.app.players.get(card.playerId)

      await ctx.edit('commands.promote.player_promoted', { p: p?.name })
    } else if (ctx.args[2] === 'upgrade') {
      const card = await prisma.card.findFirst({
        where: {
          id: BigInt(ctx.args[3]),
          profileId: ctx.db.profile.id
        }
      })
      if (!card) {
        return await ctx.reply('commands.promote.player_not_found')
      }

      const p = ctx.app.players.get(card.playerId)
      if (!p) {
        return await ctx.reply('commands.promote.player_not_found')
      }
      if (card.xp < card.requiredXp) {
        return await ctx.reply('commands.roster.xp_needed')
      }
      if (card.level >= 15) {
        return await ctx.reply('commands.roster.max_level_reached')
      }

      const cost = getUpgradeCost(card.level)
      if (ctx.db.profile.poisons < cost) {
        return await ctx.reply('commands.roster.poisons_needed', {
          required_poisons: cost.toLocaleString(),
          poisons: ctx.db.profile.poisons.toLocaleString()
        })
      }

      const buff = 1 + getBuff(card.level + 1)
      await prisma.$transaction([
        prisma.profile.update({
          where: {
            id: ctx.db.profile.id
          },
          data: {
            poisons: {
              decrement: cost
            }
          }
        }),
        prisma.card.update({
          where: {
            id: card.id
          },
          data: {
            level: {
              increment: 1
            },
            requiredXp: Math.floor(card.requiredXp * 1.3),
            xp: 0,
            aim: p.aim * buff,
            hs: p.hs * buff,
            movement: p.movement * buff,
            acs: p.acs * buff,
            gamesense: p.gamesense * buff,
            aggression: p.aggression * buff,
            overall: calcPlayerOvr({
              ...p,
              aim: p.aim * buff,
              hs: p.hs * buff,
              movement: p.movement * buff,
              acs: p.acs * buff,
              gamesense: p.gamesense * buff,
              aggression: p.aggression * buff
            })
          }
        })
      ])

      await ctx.reply('commands.roster.upgraded', {
        level: card.level + 1,
        poisons: cost.toLocaleString(),
        card: p.name
      })
    } else {
      const page = Number(ctx.args[3]) || 1

      if (page <= 1) {
        const [cards, hasNextPage] = await Promise.all([
          prisma.card.findMany({
            where: {
              profileId: ctx.db.profile.id,
              activeRoster: true
            },
            orderBy: {
              id: 'desc'
            },
            skip: Math.max(0, (page - 1) * 5),
            take: 5
          }),
          prisma.card.findFirst({
            where: {
              profileId: ctx.db.profile.id,
              activeRoster: false
            },
            select: {
              id: true
            }
          })
        ])

        let value = 0
        let ovr = 0

        for (const card of cards) {
          const player = ctx.app.players.get(card.playerId)

          if (!player) continue

          ovr += card.overall
          value += calcPlayerPrice({
            ...player,
            acs: card.acs,
            gamesense: card.gamesense,
            movement: card.movement,
            aggression: card.aggression,
            hs: card.hs,
            aim: card.aim
          })
        }

        const container = new ContainerBuilder()
          .setAccentColor(6719296)
          .addTextDisplayComponents(text =>
            text.setContent(
              ctx.t('commands.roster.container.title') +
                '\n' +
                ctx.t('commands.roster.container.desc', {
                  value: Math.floor(value).toLocaleString(),
                  ovr: Math.floor(ovr / cards.length),
                  name: ctx.db.profile.teamName
                    ? `${ctx.db.profile.teamName} (${ctx.db.profile.teamTag})`
                    : '`undefined`'
                })
            )
          )
          .addActionRowComponents(row =>
            row.setComponents(
              new ButtonBuilder()
                .setLabel(ctx.t('commands.roster.change_team'))
                .setCustomId(`roster;${ctx.author.id};team`)
                .setStyle(ButtonStyle.Primary)
            )
          )
          .addSeparatorComponents(separator => separator)

        if (cards.length) {
          container.addTextDisplayComponents(text =>
            text.setContent(
              ctx.t('commands.roster.container.active_players', { total: cards.length })
            )
          )

          for (const card of cards) {
            container
              .addTextDisplayComponents(text => {
                const player = ctx.app.players.get(card.playerId)

                if (!player) return text

                const emoji = ctx.app.emoji.get(player.role)

                return text.setContent(
                  ctx.t('commands.roster.container.card_content', {
                    card: `**${emoji} ${player.name} (${Math.floor(card.overall)}) — ${player.collection}**`,
                    level: card.level,
                    xp: `${card.xp}/${card.requiredXp}`,
                    progress: createProgressBar(card.xp / card.requiredXp)
                  })
                )
              })
              .addActionRowComponents(row =>
                row.setComponents(
                  new ButtonBuilder()
                    .setStyle(ButtonStyle.Danger)
                    .setLabel(ctx.t('commands.roster.container.button.remove'))
                    .setCustomId(`roster;${ctx.db.profile.userId};remove;${card.id}`),
                  new ButtonBuilder()
                    .setLabel(ctx.t('commands.roster.container.button.promote_arena'))
                    .setCustomId(`roster;${ctx.author.id};promote-arena;${card.id}`)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(card.arenaRoster),
                  new ButtonBuilder()
                    .setLabel(ctx.t('commands.roster.practice'))
                    .setCustomId(`roster;${ctx.author.id};practice;${card.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(card.requiredXp <= card.xp),
                  new ButtonBuilder()
                    .setLabel(
                      ctx.t('commands.roster.upgrade', {
                        cost: formatNumber(getUpgradeCost(card.level))
                      })
                    )
                    .setCustomId(`roster;${ctx.author.id};upgrade;${card.id}`)
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(card.requiredXp > card.xp)
                )
              )
          }
        }

        const previous = new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setEmoji('1404176223621611572')
          .setCustomId(`roster;${ctx.db.profile.userId};previous;${page - 1}`)

        const next = new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setEmoji('1404176291829121028')
          .setCustomId(`roster;${ctx.db.profile.userId};next;${page + 1}`)

        if (page <= 1) {
          previous.setDisabled()
        }
        if (!hasNextPage) {
          next.setDisabled()
        }

        const row = new ActionRowBuilder<ButtonBuilder>().setComponents(previous, next)

        await ctx.edit({
          flags: 'IsComponentsV2',
          components: [container, row.toJSON()]
        })
      } else {
        const [cards, cardsCount] = await Promise.all([
          prisma.card.findMany({
            where: {
              profileId: ctx.db.profile.id,
              activeRoster: false
            },
            orderBy: {
              id: 'desc'
            },
            skip: Math.max(0, (page - 2) * 5),
            take: 6
          }),
          prisma.card.count({
            where: {
              profileId: ctx.db.profile.id,
              activeRoster: false
            }
          })
        ])

        const container = new ContainerBuilder().setAccentColor(6719296)

        if (cards.length) {
          container.addTextDisplayComponents(text =>
            text.setContent(
              ctx.t('commands.roster.container.reserve_players', { total: cardsCount })
            )
          )

          for (const card of cards.slice(0, 5)) {
            container
              .addTextDisplayComponents(text => {
                const player = ctx.app.players.get(card.playerId)

                if (!player) return text

                const emoji = ctx.app.emoji.get(player.role)

                return text.setContent(
                  ctx.t('commands.roster.container.card_content', {
                    card: `**${emoji} ${player.name} (${Math.floor(card.overall)}) — ${player.collection}**`,
                    level: card.level,
                    xp: `${card.xp}/${card.requiredXp}`,
                    progress: createProgressBar(card.xp / card.requiredXp)
                  })
                )
              })
              .addActionRowComponents(row =>
                row.setComponents(
                  new ButtonBuilder()
                    .setStyle(ButtonStyle.Success)
                    .setLabel(ctx.t('commands.roster.container.button.promote'))
                    .setCustomId(`roster;${ctx.db.profile.userId};promote;${card.id}`),
                  new ButtonBuilder()
                    .setLabel(ctx.t('commands.roster.container.button.promote_arena'))
                    .setCustomId(`roster;${ctx.author.id};promote-arena;${card.id}`)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(card.arenaRoster),
                  new ButtonBuilder()
                    .setLabel(ctx.t('commands.roster.practice'))
                    .setCustomId(`roster;${ctx.author.id};practice;${card.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(card.requiredXp <= card.xp),
                  new ButtonBuilder()
                    .setLabel(
                      ctx.t('commands.roster.upgrade', {
                        cost: formatNumber(getUpgradeCost(card.level))
                      })
                    )
                    .setCustomId(`roster;${ctx.author.id};upgrade;${card.id}`)
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(card.requiredXp > card.xp)
                )
              )
          }
        }

        const previous = new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setEmoji('1404176223621611572')
          .setCustomId(`roster;${ctx.db.profile.userId};previous;${page - 1}`)

        const next = new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setEmoji('1404176291829121028')
          .setCustomId(`roster;${ctx.db.profile.userId};next;${page + 1}`)

        if (page <= 1) {
          previous.setDisabled()
        }
        if (cards.length <= 5) {
          next.setDisabled()
        }

        const row = new ActionRowBuilder<ButtonBuilder>().setComponents(previous, next)

        await ctx.edit({
          flags: 'IsComponentsV2',
          components: [container, row.toJSON()]
        })
      }
    }
  },
  async createModalSubmitInteraction({ ctx, i }) {
    ctx.setFlags(64)

    if (ctx.args[2] === 'team') {
      const name = i.fields.getTextInputValue(`roster;${i.user.id};team;response-1`)
      const tag = i.fields.getTextInputValue(`roster;${i.user.id};team;response-2`)

      await prisma.profile.update({
        where: {
          userId_guildId: {
            userId: ctx.db.profile.userId,
            guildId: ctx.db.guild.id
          }
        },
        data: {
          teamName: name,
          teamTag: tag
        }
      })
      await ctx.reply('commands.roster.team_info_changed', { name, tag })
    } else if (ctx.args[2] === 'practice') {
      const card = await prisma.card.findFirst({
        where: {
          id: BigInt(ctx.args[3]),
          profileId: ctx.db.profile.id
        }
      })
      if (!card) {
        return await ctx.reply('commands.promote.player_not_found')
      }

      const p = ctx.app.players.get(card.playerId)
      if (!p) {
        return await ctx.reply('commands.promote.player_not_found')
      }

      const value = Number(
        i.fields.getTextInputValue(`roster;${i.user.id};practice;${card.id};response`)
      )

      if (card.xp >= card.requiredXp) {
        return await ctx.reply('commands.roster.max_xp_reached')
      }
      if (Number.isNaN(value) || value > card.requiredXp - card.xp || value <= 0) {
        return await ctx.reply('commands.roster.invalid_value', {
          value: card.requiredXp - card.xp
        })
      }

      const decrementValue = value * 0.5

      if (ctx.db.profile.fates < decrementValue) {
        return await ctx.reply('commands.roster.value_too_short', {
          required_fates: decrementValue.toLocaleString(),
          fates: ctx.db.profile.fates.toLocaleString()
        })
      }

      await prisma.$transaction([
        prisma.card.update({
          where: {
            id: card.id
          },
          data: {
            xp: {
              increment: value
            }
          }
        }),
        prisma.profile.update({
          where: {
            id: ctx.db.profile.id
          },
          data: {
            fates: {
              decrement: decrementValue
            }
          }
        })
      ])

      await ctx.reply('commands.roster.practiced', {
        xp: card.xp + value,
        cost: decrementValue.toLocaleString(),
        card: p.name
      })
    }
  }
})
