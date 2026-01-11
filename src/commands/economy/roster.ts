import { prisma } from '@db'
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
import { calcPlayerOvr } from '@sabinelab/players'

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
  options: [
    {
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
  ],
  messageComponentInteractionTime: 5 * 60 * 1000,
  async run({ ctx }) {
    const cards = await prisma.card.findMany({
      where: {
        profileId: ctx.db.profile.id
      }
    })
    const activeCards = cards.filter(c => c.active_roster)
    const subCards = cards.filter(c => !c.active_roster)

    let value = 0
    let ovr = 0

    for (const c of activeCards) {
      const player = ctx.app.players.get(c.playerId)

      if (!player) continue

      ovr += c.overall
      value += player.price
    }

    for (const c of subCards) {
      const player = ctx.app.players.get(c.playerId)

      if (!player) continue

      ovr += c.overall
      value += player.price
    }

    const container = new ContainerBuilder()
      .setAccentColor(6719296)
      .addTextDisplayComponents(text =>
        text.setContent(
          ctx.t('commands.roster.container.title') +
            '\n' +
            ctx.t('commands.roster.container.desc', {
              value: Math.floor(value).toLocaleString(),
              ovr: Math.floor(ovr / (activeCards.length + subCards.length)),
              name: ctx.db.profile.team_name
                ? `${ctx.db.profile.team_name} (${ctx.db.profile.team_tag})`
                : '`undefined`'
            })
        )
      )
      .addActionRowComponents(row =>
        row.setComponents(
          new ButtonBuilder()
            .setLabel(ctx.t('commands.roster.change_team'))
            .setCustomId(`roster;${ctx.interaction.user.id};team`)
            .setStyle(ButtonStyle.Primary)
        )
      )
      .addSeparatorComponents(separator => separator)

    const pages = Math.ceil(subCards.length / 5) + 1
    let page = (ctx.args[0] as number) ?? 1

    if (page === 1) {
      if (activeCards.length) {
        container.addTextDisplayComponents(text =>
          text.setContent(
            ctx.t('commands.roster.container.active_players', { total: activeCards.length })
          )
        )

        for (const c of activeCards) {
          container
            .addTextDisplayComponents(text => {
              const player = ctx.app.players.get(c.playerId)

              if (!player) return text

              const emoji = ctx.app.emoji.get(player.role)

              return text.setContent(
                ctx.t('commands.roster.container.card_content', {
                  card: `**${emoji} ${player.name} (${Math.floor(c.overall)}) — ${player.collection}**`,
                  level: c.level,
                  xp: `${c.xp}/${c.required_xp}`,
                  progress: createProgressBar(c.xp / c.required_xp)
                })
              )
            })
            .addActionRowComponents(row =>
              row.setComponents(
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Danger)
                  .setLabel(ctx.t('commands.roster.container.button.remove'))
                  .setCustomId(`roster;${ctx.db.profile.userId};remove;${c.id}`),
                new ButtonBuilder()
                  .setLabel(ctx.t('commands.roster.practice'))
                  .setCustomId(`roster;${ctx.interaction.user.id};practice;${c.id}`)
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(c.required_xp <= c.xp),
                new ButtonBuilder()
                  .setLabel(
                    ctx.t('commands.roster.upgrade', {
                      cost: formatNumber(getUpgradeCost(c.level))
                    })
                  )
                  .setCustomId(`roster;${ctx.interaction.user.id};upgrade;${c.id}`)
                  .setStyle(ButtonStyle.Success)
                  .setDisabled(c.required_xp > c.xp)
              )
            )
        }
      }
    } else {
      page -= 1

      const players = subCards.slice(page * 5 - 5, page * 5)

      if (players.length) {
        container.addTextDisplayComponents(text =>
          text.setContent(
            ctx.t('commands.roster.container.reserve_players', { total: subCards.length })
          )
        )

        for (const c of players) {
          container
            .addTextDisplayComponents(text => {
              const player = ctx.app.players.get(c.playerId)

              if (!player) return text

              const emoji = ctx.app.emoji.get(player.role)

              return text.setContent(
                ctx.t('commands.roster.container.card_content', {
                  card: `**${emoji} ${player.name} (${Math.floor(c.overall)}) — ${player.collection}**`,
                  level: c.level,
                  xp: `${c.xp}/${c.required_xp}`,
                  progress: createProgressBar(c.xp / c.required_xp)
                })
              )
            })
            .addActionRowComponents(row =>
              row.setComponents(
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Success)
                  .setLabel(ctx.t('commands.roster.container.button.promote'))
                  .setCustomId(`roster;${ctx.db.profile.userId};promote;${c.id}`),
                new ButtonBuilder()
                  .setLabel(ctx.t('commands.roster.practice'))
                  .setCustomId(`roster;${ctx.interaction.user.id};practice;${c.id}`)
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(c.required_xp <= c.xp),
                new ButtonBuilder()
                  .setLabel(
                    ctx.t('commands.roster.upgrade', {
                      cost: formatNumber(getUpgradeCost(c.level))
                    })
                  )
                  .setCustomId(`roster;${ctx.interaction.user.id};upgrade;${c.id}`)
                  .setStyle(ButtonStyle.Success)
                  .setDisabled(c.required_xp > c.xp)
              )
            )
        }
      }

      page += 1
    }

    const previous = new ButtonBuilder()
      .setStyle(ButtonStyle.Primary)
      .setEmoji('1404176223621611572')
      .setCustomId(`roster;${ctx.db.profile.userId};previous;${page - 1 < 1 ? 1 : page - 1}`)

    const next = new ButtonBuilder()
      .setStyle(ButtonStyle.Primary)
      .setEmoji('1404176291829121028')
      .setCustomId(`roster;${ctx.db.profile.userId};next;${page + 1 > pages ? pages : page + 1}`)

    if (page <= 1) previous.setDisabled()
    if (page >= pages) next.setDisabled()

    const row = new ActionRowBuilder<ButtonBuilder>().setComponents(previous, next)

    await ctx.reply({
      flags: 'IsComponentsV2',
      components: [container, row.toJSON()]
    })
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
                required: true
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
                required: true
              }
            ]
          }
        ]
      })
    } else if (ctx.args[2] === 'promote') {
      const cards = await prisma.card.findMany({
        where: {
          profileId: ctx.db.profile.id
        }
      })
      const card = cards.find(c => c.id === BigInt(ctx.args[3]))
      if (!card || card.active_roster) {
        return await ctx.reply('commands.promote.player_not_found')
      }

      const player = ctx.app.players.get(card.playerId)
      if (!player) {
        return await ctx.reply('commands.promote.player_not_found')
      }

      if (cards.filter(c => c.active_roster).length < 5) {
        await prisma.card.update({
          where: {
            id: BigInt(ctx.args[3])
          },
          data: {
            active_roster: true
          }
        })

        return await ctx.reply('commands.promote.player_promoted', { p: player.name })
      }

      const options: APISelectMenuOption[] = []

      for (const c of cards.filter(c => c.active_roster)) {
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
      const card = await prisma.card.findUnique({
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
          active_roster: false
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
            active_roster: true
          }
        }),
        prisma.card.update({
          where: {
            id: BigInt(idActive)
          },
          data: {
            active_roster: false
          }
        })
      ])

      const p = ctx.app.players.get(card.playerId)

      await ctx.edit('commands.promote.player_promoted', { p: p?.name })
    } else if (ctx.args[2] === 'practice') {
      const card = await prisma.card.findUnique({
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
                  max: card.required_xp - card.xp
                }),
                value: (card.required_xp - card.xp).toString()
              }
            ]
          }
        ]
      })
    } else if (ctx.args[2] === 'upgrade') {
      const card = await prisma.card.findUnique({
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
      if (card.xp < card.required_xp) {
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
            required_xp: Math.floor(card.required_xp * 1.3),
            xp: 0,
            aim: p.aim * buff,
            hs: p.HS * buff,
            movement: p.movement * buff,
            acs: p.ACS * buff,
            gamesense: p.gamesense * buff,
            aggression: p.aggression * buff,
            overall: calcPlayerOvr({
              ...p,
              aim: p.aim * buff,
              HS: p.HS * buff,
              movement: p.movement * buff,
              ACS: p.ACS * buff,
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
      const cards = await prisma.card.findMany({
        where: {
          profileId: ctx.db.profile.id
        }
      })
      const activeCards = cards.filter(c => c.active_roster)
      const subCards = cards.filter(c => !c.active_roster)

      let value = 0
      let ovr = 0

      for (const c of activeCards) {
        const player = ctx.app.players.get(c.playerId)

        if (!player) continue

        ovr += c.overall
        value += player.price
      }

      for (const c of subCards) {
        const player = ctx.app.players.get(c.playerId)

        if (!player) continue

        ovr += c.overall
        value += player.price
      }

      const container = new ContainerBuilder()
        .setAccentColor(6719296)
        .addTextDisplayComponents(text =>
          text.setContent(
            ctx.t('commands.roster.container.title') +
              '\n' +
              ctx.t('commands.roster.container.desc', {
                value: Math.floor(value).toLocaleString(),
                ovr: Math.floor(ovr / (activeCards.length + subCards.length)),
                name: ctx.db.profile.team_name
                  ? `${ctx.db.profile.team_name} (${ctx.db.profile.team_tag})`
                  : '`undefined`'
              })
          )
        )
        .addActionRowComponents(row =>
          row.setComponents(
            new ButtonBuilder()
              .setLabel(ctx.t('commands.roster.change_team'))
              .setCustomId(`roster;${ctx.interaction.user.id};team`)
              .setStyle(ButtonStyle.Primary)
          )
        )
        .addSeparatorComponents(separator => separator)

      const pages = Math.ceil(subCards.length / 5) + 1
      let page = Number(ctx.args[3]) ?? 1

      if (page === 1) {
        if (activeCards.length) {
          container.addTextDisplayComponents(text =>
            text.setContent(
              ctx.t('commands.roster.container.active_players', { total: activeCards.length })
            )
          )

          for (const c of activeCards) {
            container
              .addTextDisplayComponents(text => {
                const player = ctx.app.players.get(c.playerId)

                if (!player) return text

                const emoji = ctx.app.emoji.get(player.role)

                return text.setContent(
                  ctx.t('commands.roster.container.card_content', {
                    card: `**${emoji} ${player.name} (${Math.floor(c.overall)}) — ${player.collection}**`,
                    level: c.level,
                    xp: `${c.xp}/${c.required_xp}`,
                    progress: createProgressBar(c.xp / c.required_xp)
                  })
                )
              })
              .addActionRowComponents(row =>
                row.setComponents(
                  new ButtonBuilder()
                    .setStyle(ButtonStyle.Danger)
                    .setLabel(ctx.t('commands.roster.container.button.remove'))
                    .setCustomId(`roster;${ctx.db.profile.userId};remove;${c.id}`),
                  new ButtonBuilder()
                    .setLabel(ctx.t('commands.roster.practice'))
                    .setCustomId(`roster;${ctx.interaction.user.id};practice;${c.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(c.required_xp <= c.xp),
                  new ButtonBuilder()
                    .setLabel(
                      ctx.t('commands.roster.upgrade', {
                        cost: formatNumber(getUpgradeCost(c.level))
                      })
                    )
                    .setCustomId(`roster;${ctx.interaction.user.id};upgrade;${c.id}`)
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(c.required_xp > c.xp)
                )
              )
          }
        }
      } else {
        page -= 1

        const players = subCards.slice(page * 5 - 5, page * 5)

        if (players.length) {
          container.addTextDisplayComponents(text =>
            text.setContent(
              ctx.t('commands.roster.container.reserve_players', { total: subCards.length })
            )
          )

          for (const c of players) {
            container
              .addTextDisplayComponents(text => {
                const player = ctx.app.players.get(c.playerId)

                if (!player) return text

                const emoji = ctx.app.emoji.get(player.role)

                return text.setContent(
                  ctx.t('commands.roster.container.card_content', {
                    card: `**${emoji} ${player.name} (${Math.floor(c.overall)}) — ${player.collection}**`,
                    level: c.level,
                    xp: `${c.xp}/${c.required_xp}`,
                    progress: createProgressBar(c.xp / c.required_xp)
                  })
                )
              })
              .addActionRowComponents(row =>
                row.setComponents(
                  new ButtonBuilder()
                    .setStyle(ButtonStyle.Success)
                    .setLabel(ctx.t('commands.roster.container.button.promote'))
                    .setCustomId(`roster;${ctx.db.profile.userId};promote;${c.id}`),
                  new ButtonBuilder()
                    .setLabel(ctx.t('commands.roster.practice'))
                    .setCustomId(`roster;${ctx.interaction.user.id};practice;${c.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(c.required_xp <= c.xp),
                  new ButtonBuilder()
                    .setLabel(
                      ctx.t('commands.roster.upgrade', {
                        cost: formatNumber(getUpgradeCost(c.level))
                      })
                    )
                    .setCustomId(`roster;${ctx.interaction.user.id};upgrade;${c.id}`)
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(c.required_xp > c.xp)
                )
              )
          }
        }

        page += 1
      }

      const previous = new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setEmoji('1404176223621611572')
        .setCustomId(`roster;${ctx.db.profile.userId};previous;${page - 1 < 1 ? 1 : page - 1}`)

      const next = new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setEmoji('1404176291829121028')
        .setCustomId(`roster;${ctx.db.profile.userId};next;${page + 1 > pages ? pages : page + 1}`)

      if (page <= 1) previous.setDisabled()
      if (page >= pages) next.setDisabled()

      const row = new ActionRowBuilder<ButtonBuilder>().setComponents(previous, next)

      await ctx.edit({
        flags: 'IsComponentsV2',
        components: [container, row.toJSON()]
      })
    }
  },
  async createModalSubmitInteraction({ ctx, i }) {
    ctx.setFlags(64)

    if (ctx.args[2] === 'modal') {
      const name = i.fields.getTextInputValue(`roster;${i.user.id};modal;response-1`)
      const tag = i.fields.getTextInputValue(`roster;${i.user.id};modal;response-2`)

      await prisma.profile.update({
        where: {
          userId_guildId: {
            userId: ctx.db.profile.userId,
            guildId: ctx.db.guild.id
          }
        },
        data: {
          team_name: name,
          team_tag: tag
        }
      })
      await ctx.reply('commands.roster.team_info_changed', { name, tag })
    } else if (ctx.args[2] === 'practice') {
      const card = await prisma.card.findUnique({
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

      if (card.xp >= card.required_xp) {
        return await ctx.reply('commands.roster.max_xp_reached')
      }
      if (Number.isNaN(value) || value > card.required_xp - card.xp || value <= 0) {
        return await ctx.reply('commands.roster.invalid_value', {
          value: card.required_xp - card.xp
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
