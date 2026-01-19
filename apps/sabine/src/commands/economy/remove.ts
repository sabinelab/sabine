import { ProfileSchema, prisma } from '@db'
import { ApplicationCommandOptionType } from 'discord.js'
import createCommand from '../../structures/command/createCommand'

export default createCommand({
  name: 'remove',
  aliases: ['r'],
  nameLocalizations: {
    'pt-BR': 'remover'
  },
  description: 'Remove a player from active roster!',
  descriptionLocalizations: {
    'pt-BR': 'Remova um jogador do elenco principal'
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
  async run({ ctx, app }) {
    const card = await prisma.card.findFirst({
      where: {
        id: BigInt(ctx.args.player),
        profileId: ctx.db.profile.id,
        activeRoster: true
      }
    })
    const p = app.players.get(card?.playerId ?? '')

    if (!card || !p) {
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

    return await ctx.reply('commands.remove.player_removed', { p: p.name })
  },
  async createAutocompleteInteraction({ i, app }) {
    if (!i.guildId) return

    const profile = await ProfileSchema.fetch(i.user.id, i.guildId)
    if (!profile) return

    const cards = await prisma.card.findMany({
      where: {
        profileId: profile.id,
        activeRoster: true
      }
    })

    const value = i.options.getString('player', true)

    const players: Array<{ name: string; ovr: number; id: string }> = []

    for (const c of cards) {
      const p = app.players.get(c.playerId)

      if (!p) break

      const ovr = Math.floor(c.overall)

      players.push({
        name: `${p.name} (${ovr}) — ${p.collection}`,
        ovr,
        id: c.id.toString()
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
