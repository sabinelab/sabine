import { ProfileSchema } from '@db'
import { calcPlayerPrice } from '@sabinelab/players'
import createCommand from '../../structures/command/createCommand'

export default createCommand({
  name: 'sell',
  nameLocalizations: {
    'pt-BR': 'vender'
  },
  description: 'Sell a player',
  descriptionLocalizations: {
    'pt-BR': 'Venda um jogador'
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
  cooldown: true,
  async run({ ctx, app }) {
    const player = app.players.get(ctx.args[0].toString())
    const i = ctx.db.profile.reserve_players.indexOf(ctx.args[0].toString())

    if (!player || i === -1) {
      return await ctx.reply('commands.sell.player_not_found')
    }

    await ctx.db.profile.sellPlayer(player.id.toString(), BigInt(calcPlayerPrice(player, true)), i)

    await ctx.reply('commands.sell.sold', { p: player.name, price: calcPlayerPrice(player, true).toLocaleString() })
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
        name: `${p.name} (${ovr})`,
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
  }
})
