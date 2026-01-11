import { ProfileSchema, prisma } from '@db'
import { calcPlayerPrice } from '@sabinelab/players'
import { ApplicationCommandOptionType } from 'discord.js'
import ButtonBuilder from '../../structures/builders/ButtonBuilder'
import createCommand from '../../structures/command/createCommand'

export default createCommand({
  name: 'trade',
  nameLocalizations: {
    'pt-BR': 'negociar'
  },
  description: 'Trade a player',
  descriptionLocalizations: {
    'pt-BR': 'Negocie um jogador'
  },
  category: 'economy',
  options: [
    {
      type: ApplicationCommandOptionType.User,
      name: 'user',
      nameLocalizations: {
        'pt-BR': 'usuário'
      },
      description: 'Insert a user',
      descriptionLocalizations: {
        'pt-BR': 'Informe o usuário'
      },
      required: true
    },
    {
      type: ApplicationCommandOptionType.String,
      name: 'player',
      nameLocalizations: {
        'pt-BR': 'jogador'
      },
      description: 'Insert the player',
      descriptionLocalizations: {
        'pt-BR': 'Informe o jogador'
      },
      autocomplete: true,
      required: true
    },
    {
      type: ApplicationCommandOptionType.Integer,
      name: 'price',
      nameLocalizations: {
        'pt-BR': 'preço'
      },
      description: 'Insert a price',
      descriptionLocalizations: {
        'pt-BR': 'Informe o preço'
      },
      required: true
    }
  ],
  messageComponentInteractionTime: 5 * 60 * 1000,
  cooldown: true,
  async run({ ctx, app }) {
    const profile = await ProfileSchema.fetch(ctx.args[0].toString(), ctx.db.guild.id)
    const card = await prisma.card.findFirst({
      where: {
        id: BigInt(ctx.args[1]),
        profileId: ctx.db.profile.id
      }
    })
    const player = app.players.get(card?.playerId ?? '')

    if (!player || !card) {
      return await ctx.reply('commands.trade.player_not_found')
    }

    const price = calcPlayerPrice(player, true)

    if (BigInt(ctx.args[2]) < price) {
      return await ctx.reply('commands.trade.invalid_value', { value: price.toLocaleString() })
    }

    if (ctx.args[0] === ctx.interaction.user.id) {
      return await ctx.reply('commands.trade.cannot_trade')
    }

    if (!profile || profile.poisons < BigInt(ctx.args[2])) {
      return await ctx.reply('commands.trade.missing_poisons', {
        poisons: (BigInt(ctx.args[2]) - (!profile ? 0n : profile.poisons)).toLocaleString(),
        user: `<@${ctx.args[0]}>`
      })
    }

    await ctx.reply({
      content: ctx.t('commands.trade.request', {
        player: `${player.name} (${Math.floor(card.overall)})`,
        collection: player.collection,
        user: `<@${ctx.args[0]}>`,
        author: ctx.interaction.user.toString(),
        poisons: BigInt(ctx.args[2]).toLocaleString()
      }),
      components: [
        {
          type: 1,
          components: [
            new ButtonBuilder()
              .defineStyle('green')
              .setLabel(ctx.t('commands.trade.make_purchase'))
              .setCustomId(
                `trade;${ctx.args[0]};buy;${ctx.interaction.user.id};${card.id};${ctx.args[2]}`
              ),
            new ButtonBuilder()
              .defineStyle('red')
              .setLabel(ctx.t('commands.trade.cancel'))
              .setCustomId(`trade;${ctx.interaction.user.id};cancel`)
          ]
        }
      ]
    })
  },
  async createAutocompleteInteraction({ i, app }) {
    if (!i.guildId) return
    const profile = await ProfileSchema.fetch(i.user.id, i.guildId)
    if (!profile) return

    const cards = await prisma.card.findMany({
      where: {
        profileId: profile.id,
        active_roster: false
      }
    })

    const players: Array<{ name: string; ovr: number; id: string }> = []

    const value = i.options.getString('player', true)

    for (const c of cards) {
      const p = app.players.get(c.playerId)

      if (!p) continue

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
  },
  async createMessageComponentInteraction({ ctx, app, i }) {
    if (!i.guildId) return
    if (ctx.args[2] === 'buy') {
      const profile = await ProfileSchema.fetch(ctx.args[3], i.guildId)
      const card = await prisma.card.findFirst({
        where: {
          id: BigInt(ctx.args[4]),
          profileId: profile?.id ?? ''
        }
      })
      const player = app.players.get(card?.playerId ?? '')

      if (!profile || !player || !card) return

      if (ctx.db.profile.poisons < BigInt(ctx.args[5])) {
        return await ctx.edit('commands.trade.missing_poisons', {
          poisons: (BigInt(ctx.args[5]) - ctx.db.profile.poisons).toLocaleString(),
          user: `<@${ctx.interaction.user}>`
        })
      }

      await prisma.$transaction([
        prisma.card.update({
          where: {
            id: card.id
          },
          data: {
            profileId: ctx.db.profile.id,
            arena_agent_name: null,
            arena_agent_role: null,
            arena_roster: false,
            active_roster: false
          }
        }),
        prisma.profile.update({
          where: {
            userId_guildId: {
              userId: ctx.args[3],
              guildId: ctx.db.guild.id
            }
          },
          data: {
            poisons: {
              increment: BigInt(ctx.args[5])
            }
          }
        }),
        prisma.profile.update({
          where: {
            userId_guildId: {
              userId: ctx.db.profile.userId,
              guildId: ctx.db.guild.id
            }
          },
          data: {
            poisons: {
              decrement: BigInt(ctx.args[5])
            }
          }
        }),
        prisma.transaction.createMany({
          data: [
            {
              type: 'TRADE_PLAYER',
              player: player.id,
              price: BigInt(ctx.args[5]),
              profileId: profile.id,
              to: profile.userId
            },
            {
              type: 'TRADE_PLAYER',
              player: player.id,
              price: BigInt(ctx.args[5]),
              profileId: ctx.db.profile.id,
              to: profile.userId
            }
          ]
        })
      ])

      await ctx.edit('commands.trade.res', {
        player: `${player.name} (${Math.floor(card.overall)})`,
        collection: player.collection,
        user: ctx.interaction.user.toString(),
        poisons: BigInt(ctx.args[5]).toLocaleString()
      })
    } else {
      await ctx.edit('commands.trade.cancelled')
    }
  }
})
