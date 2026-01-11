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
    const card = await prisma.card.findFirst({
      where: {
        id: BigInt(ctx.args[0]),
        profileId: ctx.db.profile.id,
        activeRoster: false
      }
    })
    const p = app.players.get(card?.playerId ?? '')

    if (!p || !card) {
      return await ctx.reply('commands.promote.player_not_found')
    }

    const options: APISelectMenuOption[] = []

    const cards = await prisma.card.findMany({
      where: {
        profileId: ctx.db.profile.id,
        activeRoster: true
      }
    })

    if (cards.length < 5) {
      await prisma.card.update({
        where: {
          id: card.id
        },
        data: {
          activeRoster: true
        }
      })

      return await ctx.reply('commands.promote.player_promoted', { p: p.name })
    }

    for (const c of cards) {
      const p = app.players.get(c.playerId)

      if (!p) break

      const ovr = Math.floor(p.ovr)

      options.push({
        label: `${p.name} (${ovr})`,
        description: p.role,
        value: c.id.toString()
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

    const cards = await prisma.card.findMany({
      where: {
        profileId: profile.id,
        activeRoster: false
      }
    })

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
        .slice(0, 25)
        .map(p => ({ name: p.name, value: p.id }))
    )
  },
  async createMessageComponentInteraction({ ctx, i, app }) {
    if (!i.isStringSelectMenu()) return

    const idActive = i.values[0].split(';')[0]
    const idSub = ctx.args[2]

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

    const p = app.players.get(card.playerId)!

    await ctx.edit('commands.promote.player_promoted', { p: p.name })
  }
})
