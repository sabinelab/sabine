import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  type APISelectMenuOption
} from 'discord.js'
import createCommand from '@/structures/command/createCommand'
import SelectMenuBuilder from '@/structures/builders/SelectMenuBuilder'
import { prisma } from '@db'

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
  userInstall: true,
  messageComponentInteractionTime: 5 * 60 * 1000,
  async run({ ctx }) {
    const active_players = ctx.db.user.active_players
    const reserve_players = ctx.db.user.reserve_players

    let value = 0
    let ovr = 0

    for(const p of active_players) {
      const player = ctx.app.players.get(p)

      if(!player) continue

      ovr += player.ovr
      value += player.price
    }

    for(const p of reserve_players) {
      const player = ctx.app.players.get(p)

      if(!player) continue

      ovr += player.ovr
      value += player.price
    }

    const container = new ContainerBuilder()
      .setAccentColor(6719296)
      .addTextDisplayComponents(
        text => text.setContent(
          ctx.t('commands.roster.container.title') + '\n'
          + ctx.t('commands.roster.container.desc', {
            value: Math.floor(value).toLocaleString(),
            ovr: Math.floor(ovr / (active_players.length + reserve_players.length)),
            name: ctx.db.user.team_name
              ? `${ctx.db.user.team_name} (${ctx.db.user.team_tag})`
              : '`undefined`'
          })
        )
      )
      .addActionRowComponents(
        row => row.setComponents(
          new ButtonBuilder()
            .setLabel(ctx.t('commands.roster.change_team'))
            .setCustomId(`roster;${ctx.interaction.user.id};team`)
            .setStyle(ButtonStyle.Primary)
        )
      )
      .addSeparatorComponents(separator => separator)

    const pages = Math.ceil(reserve_players.length / 10) + 1
    let page = ctx.args[0] as number ?? 1

    if(page === 1) {
      if(active_players.length) {
        container.addTextDisplayComponents(
          text => text.setContent(ctx.t('commands.roster.container.active_players', { total: active_players.length }))
        )

        for(const p of active_players) {
          container.addSectionComponents(
            section => section
              .addTextDisplayComponents(
                text => {
                  const player = ctx.app.players.get(p)

                  if(!player) return text

                  const emoji = ctx.app.emoji.get(player.role)
                  const content = `${emoji} ${player.name} (${Math.floor(player.ovr)}) — ${player.collection}`

                  return text.setContent(content)
                }
              )
              .setButtonAccessory(
                button => button
                  .setStyle(ButtonStyle.Danger)
                  .setLabel(ctx.t('commands.roster.container.button.remove'))
                  .setCustomId(`roster;${ctx.db.user.id};remove;${p}`)
              )
          )
        }
      }
    }
    else {
      page -= 1

      const players = reserve_players.slice(page * 10 - 10, page * 10)

      if(players.length) {
        container.addTextDisplayComponents(
          text => text.setContent(ctx.t('commands.roster.container.reserve_players', { total: reserve_players.length }))
        )

        let i = 0

        for(const p of players) {
          container.addSectionComponents(
            section => section
              .addTextDisplayComponents(
                text => {
                  const player = ctx.app.players.get(p)

                  if(!player) return text

                  const emoji = ctx.app.emoji.get(player.role)
                  const content = `${emoji} ${player.name} (${Math.floor(player.ovr)}) — ${player.collection}`

                  return text.setContent(content)
                }
              )
              .setButtonAccessory(
                button => button
                  .setStyle(ButtonStyle.Success)
                  .setLabel(ctx.t('commands.roster.container.button.promote'))
                  .setCustomId(`roster;${ctx.db.user.id};promote;${p};${i}`)
              )
          )

          i++
        }
      }

      page += 1
    }

    const previous = new ButtonBuilder()
      .setStyle(ButtonStyle.Primary)
      .setEmoji('1404176223621611572')
      .setCustomId(`roster;${ctx.db.user.id};previous;${page - 1 < 1 ? 1 : page - 1}`)

    const next = new ButtonBuilder()
      .setStyle(ButtonStyle.Primary)
      .setEmoji('1404176291829121028')
      .setCustomId(`roster;${ctx.db.user.id};next;${page + 1 > pages ? pages : page + 1}`)

    if(page <= 1) previous.setDisabled()
    if(page >= pages) next.setDisabled()

    const row = new ActionRowBuilder<ButtonBuilder>()
      .setComponents(previous, next)

    await ctx.reply({
      flags: 'IsComponentsV2',
      components: [container, row]
    })
  },
  async createMessageComponentInteraction({ ctx, i, t }) {
    ctx.setFlags(64)

    if(ctx.args[2] === 'team') {
      await i.showModal({
        customId: `roster;${i.user.id};modal`,
        title: t('commands.roster.modal.title'),
        components: [
          {
            type: 1,
            components: [
              {
                type: 4,
                customId: `roster;${i.user.id};modal;response-1`,
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
                customId: `roster;${i.user.id};modal;response-2`,
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
    }
    else if(ctx.args[2] === 'promote') {
      const player = ctx.app.players.get(ctx.args[3])

      if(!player) {
        return await ctx.reply('commands.promote.player_not_found')
      }

      if(ctx.db.user.active_players.length < 5) {
        await prisma.$transaction(async(tx) => {
          const user = await tx.user.findUnique({
            where: { id: ctx.db.user.id },
            select: { active_players: true, reserve_players: true }
          })
          if(!user) throw new Error('Not found')

          if(user.active_players.length >= 5) {
            throw new Error('Roster full')
          }

          const i = user.reserve_players.findIndex(p => p === player.id.toString())

          if(i === -1) throw new Error('Not found')

          user.reserve_players.splice(i, 1)
          
          await tx.user.update({
            where: {
              id: ctx.db.user.id
            },
            data: {
              reserve_players: user.reserve_players,
              active_players: {
                push: player.id.toString()
              }
            }
          })
        })
        await Bun.redis.del(`user:${ctx.db.user.id}`)

        return await ctx.reply('commands.promote.player_promoted', { p: player.name })
      }

      let i = 0
      const options: APISelectMenuOption[] = []

      for(const p of ctx.db.user.active_players) {
        const player = ctx.app.players.get(p)

        if(!player) break

        options.push({
          label: `${player.name} (${Math.floor(player.ovr)})`,
          description: player.role,
          value: `${i};${player.id}`
        })

        i++
      }

      const menu = new SelectMenuBuilder()
        .setCustomId(`roster;${ctx.db.user.id};promote2;${player.id}`)
        .setOptions(options)

      await ctx.reply(menu.build(t('commands.promote.select_player')))
    }
    else if(ctx.args[2] === 'promote2') {
      if(!ctx.interaction.isStringSelectMenu()) return

      const idActive = ctx.interaction.values[0].split(';')[1]
      const idReserve = ctx.args[3]

      await prisma.$transaction(async(tx) => {
        const user = await tx.user.findUnique({
          where: { id: ctx.db.user.id },
          select: { active_players: true, reserve_players: true }
        })
        if(!user) throw new Error('Not found')

        const iActive = user.active_players.findIndex(p => p === idActive)
        const iReserve = user.reserve_players.findIndex(p => p === idReserve)

        if(iActive === -1 || iReserve === -1) {
          throw new Error('Player not found')
        }

        user.active_players.splice(iActive, 1)
        user.active_players.push(idReserve)

        user.reserve_players.splice(iReserve, 1)
        user.reserve_players.push(idActive)

        await tx.user.update({
          where: {
            id: ctx.db.user.id
          },
          data: {
            active_players: user.active_players,
            reserve_players: user.reserve_players
          }
        })
      })
      await Bun.redis.del(`user:${ctx.db.user.id}`)

      const p = ctx.app.players.get(ctx.args[3])

      await ctx.edit('commands.promote.player_promoted', { p: p?.name })
    }
    else {
      const active_players = ctx.db.user.active_players
      const reserve_players = ctx.db.user.reserve_players

      let value = 0
      let ovr = 0

      for(const p of active_players) {
        const player = ctx.app.players.get(p)

        if(!player) continue

        ovr += player.ovr
        value += player.price
      }

      for(const p of reserve_players) {
        const player = ctx.app.players.get(p)

        if(!player) continue

        ovr += player.ovr
        value += player.price
      }

      let page = Number(ctx.args[3])
      const pages = Math.ceil(reserve_players.length / 10) + 1

      const container = new ContainerBuilder()
        .setAccentColor(6719296)
        .addTextDisplayComponents(
          text => text.setContent(
            t('commands.roster.container.title') + '\n'
            + t('commands.roster.container.desc', {
              value: Math.floor(value).toLocaleString(),
              ovr: Math.floor(ovr / (active_players.length + reserve_players.length)),
              name: ctx.db.user.team_name
                ? `${ctx.db.user.team_name} (${ctx.db.user.team_tag})`
                : '`undefined`'
            })
          )
        )
        .addActionRowComponents(
          row => row.setComponents(
            new ButtonBuilder()
              .setLabel(t('commands.roster.change_team'))
              .setCustomId(`roster;${ctx.interaction.user.id};team`)
              .setStyle(ButtonStyle.Primary)
          )
        )
        .addSeparatorComponents(separator => separator)

      if(page === 1) {
        if(active_players.length) {
          container.addTextDisplayComponents(
            text => text.setContent(t('commands.roster.container.active_players', { total: active_players.length }))
          )

          for(const p of active_players) {
            container.addSectionComponents(
              section => section
                .addTextDisplayComponents(
                  text => {
                    const player = ctx.app.players.get(p)

                    if(!player) return text

                    const emoji = ctx.app.emoji.get(player.role)
                    const content = `${emoji} ${player.name} (${Math.floor(player.ovr)}) — ${player.collection}`

                    return text.setContent(content)
                  }
                )
                .setButtonAccessory(
                  button => button
                    .setStyle(ButtonStyle.Danger)
                    .setLabel(t('commands.roster.container.button.remove'))
                    .setCustomId(`roster;${ctx.db.user.id};remove;${p}`)
                )
            )
          }
        }
      }
      else if(ctx.args[2] === 'remove') {
        const player = ctx.app.players.get(ctx.args[3])

        if(!player) {
          return await ctx.reply('commands.remove.player_not_found')
        }

        await prisma.$transaction(async(tx) => {
          const user = await tx.user.findUnique({
            where: { id: ctx.db.user.id },
            select: { active_players: true }
          })
          if(!user) throw new Error('Not found')

          const i = user.active_players.findIndex(p => p === player.id.toString())

          if(i === -1) throw new Error('Player not found')

          user.active_players.splice(i, 1)

          await tx.user.update({
            where: {
              id: ctx.db.user.id
            },
            data: {
              reserve_players: {
                push: player.id.toString()
              },
              active_players: user.active_players
            }
          })
        })
        await Bun.redis.del(`user:${ctx.db.user.id}`)

        await ctx.reply('commands.remove.player_removed', { p: player.name })
      }
      else {
        page -= 1

        const players = reserve_players.slice(page * 10 - 10, page * 10)

        if(players.length) {
          container.addTextDisplayComponents(
            text => text.setContent(t('commands.roster.container.reserve_players', { total: reserve_players.length }))
          )

          let i = 0

          for(const p of players) {
            container.addSectionComponents(
              section => section
                .addTextDisplayComponents(
                  text => {
                    const player = ctx.app.players.get(p)

                    if(!player) return text

                    const emoji = ctx.app.emoji.get(player.role)
                    const content = `${emoji} ${player.name} (${Math.floor(player.ovr)}) — ${player.collection}`

                    return text.setContent(content)
                  }
                )
                .setButtonAccessory(
                  button => button
                    .setStyle(ButtonStyle.Success)
                    .setLabel(t('commands.roster.container.button.promote'))
                    .setCustomId(`roster;${ctx.db.user.id};promote;${p};${i}`)
                )
            )
          }

          i++
        }

        page += 1
      }

      const previous = new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setEmoji('1404176223621611572')
        .setCustomId(`roster;${ctx.db.user.id};previous;${page - 1}`)

      const next = new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setEmoji('1404176291829121028')
        .setCustomId(`roster;${ctx.db.user.id};next;${page + 1}`)

      if(page <= 1) previous.setDisabled()
      if(page >= pages) next.setDisabled()

      const row = new ActionRowBuilder<ButtonBuilder>()
        .setComponents(previous, next)

      await ctx.edit({
        flags: 'IsComponentsV2',
        components: [container, row]
      })
    }
  },
  async createModalSubmitInteraction({ ctx, i }) {
    await i.deferReply({ flags: 64 })

    const name = i.fields.getTextInputValue(`roster;${i.user.id};modal;response-1`)
    const tag = i.fields.getTextInputValue(`roster;${i.user.id};modal;response-2`)

    await prisma.user.update({
      where: {
        id: ctx.db.user.id
      },
      data: {
        team_name: name,
        team_tag: tag
      }
    })
    await Bun.redis.del(`user:${ctx.db.user.id}`)
    await ctx.reply('commands.roster.team_info_changed', { name, tag })
  }
})