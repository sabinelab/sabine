import { ProfileSchema, prisma } from '@db'
import { calcPlayerPrice } from '@sabinelab/players'
import { ApplicationCommandOptionType } from 'discord.js'
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
  args: {
    player: {
      type: ApplicationCommandOptionType.String,
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
  },
  cooldown: true,
  async run({ ctx, app }) {
    if (Number.isNaN(Number(ctx.args.player))) {
      return await ctx.reply('commands.sell.player_not_found')
    }

    const card = await prisma.card.findFirst({
      where: {
        id: BigInt(ctx.args.player),
        profileId: ctx.db.profile.id,
        activeRoster: false
      }
    })
    const player = app.players.get(card?.playerId ?? '')

    if (!player || !card) {
      return await ctx.reply('commands.sell.player_not_found')
    }

    const price = BigInt(calcPlayerPrice(player, true))

    await ctx.db.profile.sellPlayer(card.id, price)

    await ctx.reply('commands.sell.sold', {
      p: player.name,
      price: price.toLocaleString()
    })
  },
  async createAutocompleteInteraction({ i, app }) {
    if (!i.guildId) return
    const profile = await ProfileSchema.fetch(i.user.id, i.guildId)

    if (!profile) return

    const cards = await prisma.card.findMany({
      where: {
        profileId: profile.id,
        activeRoster: false
      }
    })

    const value = i.options.getString('player', true)

    const players: Array<{ name: string; ovr: number; id: string }> = []

    for (const c of cards) {
      const p = app.players.get(c.playerId)

      if (!p) break

      const ovr = Math.floor(c.overall)

      players.push({
        name: `${p.name} (${ovr})`,
        ovr,
        id: c.id.toString()
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
