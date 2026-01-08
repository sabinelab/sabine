import { ProfileSchema, prisma } from '@db'
import createCommand from '../../structures/command/createCommand'

export default createCommand({
  name: 'remove',
  nameLocalizations: {
    'pt-BR': 'remover'
  },
  description: 'Remove a player from active roster!',
  descriptionLocalizations: {
    'pt-BR': 'Remova um jogador do elenco principal'
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
      autocomplete: true,
      required: true
    }
  ],
  userInstall: true,
  async run({ ctx, app }) {
    const p = app.players.get(ctx.args[0].toString())

    if (!ctx.db.profile.active_players.includes(ctx.args[0].toString()) || !p) {
      return await ctx.reply('commands.remove.player_not_found')
    }

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

      if (!user) {
        throw new Error('Not found')
      }

      const i = user.active_players.indexOf(p.id.toString())
      if (i === -1) {
        throw new Error('Not found')
      }

      user.active_players.splice(i, 1)

      await tx.profile.update({
        where: {
          userId_guildId: {
            userId: ctx.db.profile.userId,
            guildId: ctx.db.guild.id
          }
        },
        data: {
          reserve_players: {
            push: p.id.toString()
          },
          active_players: user.active_players
        }
      })
    })

    return await ctx.reply('commands.remove.player_removed', { p: p.name })
  },
  async createAutocompleteInteraction({ i, app }) {
    if (!i.guildId) return
    const profile = await ProfileSchema.fetch(i.user.id, i.guildId)
    if (!profile) return

    const value = i.options.getString('player', true)

    const players: Array<{ name: string; ovr: number; id: string }> = []

    for (const p_id of profile.active_players) {
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
        .map(p => ({ name: p.name, value: p.id }))
    )
  }
})
