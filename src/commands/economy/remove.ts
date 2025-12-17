import { prisma, SabineUser } from '@db'
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

    if(!ctx.db.user.active_players.includes(ctx.args[0].toString()) || !p) {
      return await ctx.reply('commands.remove.player_not_found')
    }

    await prisma.$transaction(async(tx) => {
      const i = ctx.db.user.active_players.findIndex(pl => pl === p.id.toString())
      ctx.db.user.active_players.splice(i, 1)

      await tx.user.update({
        where: {
          id: ctx.db.user.id
        },
        data: {
          reserve_players: {
            push: p.id.toString()
          },
          active_players: ctx.db.user.active_players
        }
      })
      await Bun.redis.del(`user:${ctx.db.user.id}`)
    })

    return await ctx.reply('commands.remove.player_removed', { p: p.name })
  },
  async createAutocompleteInteraction({ i, app }) {
    const user = await SabineUser.fetch(i.user.id)
    if(!user) return

    const value = i.options.getString('player', true)

    const players: Array<{ name: string, ovr: number, id: string }> = []

    for(const p_id of user.active_players) {
      const p = app.players.get(p_id)

      if(!p) break

      const ovr = Math.floor(p.ovr)

      players.push({
        name: `${p.name} (${ovr}) — ${p.collection}`,
        ovr,
        id: p_id
      })
    }

    await i.respond(
      players.sort((a, b) => a.ovr - b.ovr)
        .filter(p => {
          if(p.name.toLowerCase().includes(value.toLowerCase())) return p
        })
        .map(p => ({ name: p.name, value: p.id }))
    )
  }
})