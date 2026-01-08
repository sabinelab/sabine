import { ProfileSchema, prisma } from '@db'
import type { APISelectMenuOption } from 'discord.js'
import SelectMenuBuilder from '../../structures/builders/SelectMenuBuilder'
import createCommand from '../../structures/command/createCommand'

export default createCommand({
  name: 'promote',
  nameLocalizations: {
    'pt-BR': 'promover'
  },
  description: 'Promote a player to your active roster',
  descriptionLocalizations: {
    'pt-BR': 'Promova um jogador para o elenco principal'
  },
  category: 'economy',
  options: [
    {
      type: 3,
      name: 'player',
      nameLocalizations: {
        'pt-BR': 'jogador'
      },
      description: 'Select a player',
      descriptionLocalizations: {
        'pt-BR': 'Selecione um jogador'
      },
      required: true,
      autocomplete: true
    }
  ],
  messageComponentInteractionTime: 5 * 60 * 1000,
  async run({ ctx, t, app }) {
    const p = app.players.get(ctx.args[0].toString())

    if (!p) {
      return await ctx.reply('commands.promote.player_not_found')
    }

    const options: APISelectMenuOption[] = []

    const players = ctx.db.profile.active_players

    if (players.length < 5) {
      await prisma.$transaction(async tx => {
        const user = await tx.profile.findUnique({
          where: {
            userId_guildId: {
              userId: ctx.db.profile.userId,
              guildId: ctx.db.guild.id
            }
          },
          select: {
            active_players: true,
            reserve_players: true
          }
        })

        if (!user) throw new Error('Not found')

        const i = user.reserve_players.indexOf(p.id.toString())

        user.active_players.push(p.id.toString())
        user.reserve_players.splice(i, 1)

        await tx.profile.update({
          where: {
            userId_guildId: {
              userId: ctx.db.profile.userId,
              guildId: ctx.db.guild.id
            }
          },
          data: {
            active_players: user.active_players,
            reserve_players: user.reserve_players
          }
        })
      })

      return await ctx.reply('commands.promote.player_promoted', { p: p.name })
    }
    let i = 0

    for (const p_id of players) {
      i++

      const p = app.players.get(p_id)

      if (!p) break

      const ovr = Math.floor(p.ovr)

      options.push({
        label: `${p.name} (${ovr})`,
        description: p.role,
        value: `${i}_${p_id}`
      })
    }

    const menu = new SelectMenuBuilder()
      .setCustomId(`promote;${ctx.interaction.user.id};${ctx.args[0]}`)
      .setOptions(...options)

    await ctx.reply(menu.build(t('commands.promote.select_player')))
  },
  async createAutocompleteInteraction({ i, app }) {
    if (!i.guildId) return

    const profile = await ProfileSchema.fetch(i.user.id, i.guildId)

    if (!profile) return

    const value = i.options.getString('player', true)

    const players: Array<{ name: string; ovr: number; id: string }> = []

    for (const p_id of profile.reserve_players) {
      const p = app.players.get(p_id)

      if (!p) break

      const ovr = Math.floor(p.ovr)

      players.push({
        name: `${p.name} (${ovr}) — ${p.collection}`,
        ovr,
        id: p_id
      })
    }
    await i.respond(
      players
        .sort((a, b) => a.ovr - b.ovr)
        .filter(p => p.name.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 25)
        .map(p => ({ name: p.name, value: p.id }))
    )
  },
  async createMessageComponentInteraction({ ctx, i, app }) {
    if (!i.isStringSelectMenu()) return

    await prisma.$transaction(async tx => {
      const user = await tx.profile.findUnique({
        where: {
          userId_guildId: {
            userId: ctx.db.profile.userId,
            guildId: ctx.db.guild.id
          }
        },
        select: {
          active_players: true,
          reserve_players: true
        }
      })

      if (!user) throw new Error('Not found')

      const id = i.values[0].split('_')[1]

      let index = user.active_players.indexOf(id)

      user.active_players.splice(index, 1)
      user.reserve_players.push(id)

      index = user.reserve_players.indexOf(ctx.args[2])

      user.reserve_players.splice(index, 1)
      user.active_players.push(ctx.args[2])

      await tx.profile.update({
        where: {
          userId_guildId: {
            userId: ctx.db.profile.userId,
            guildId: ctx.db.guild.id
          }
        },
        data: {
          reserve_players: user.reserve_players,
          active_players: user.active_players
        }
      })
    })

    const p = app.players.get(ctx.args[2])!

    await ctx.edit('commands.promote.player_promoted', { p: p.name })
  }
})
