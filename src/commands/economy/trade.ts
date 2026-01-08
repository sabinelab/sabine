import { type ArenaMetadata, ProfileSchema, prisma } from '@db'
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
  userInstall: true,
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

    const player = app.players.get(ctx.args[1].toString())

    if (!player) {
      return await ctx.reply('commands.trade.player_not_found')
    }

    const price = calcPlayerPrice(player, true)

    if (BigInt(ctx.args[2]) < price) {
      return await ctx.reply('commands.trade.invalid_value', { value: price.toLocaleString() })
    }

    if (ctx.args[0] === ctx.interaction.user.id) {
      return await ctx.reply('commands.trade.cannot_trade')
    }

    if (!profile || profile.coins < BigInt(ctx.args[2])) {
      return await ctx.reply('commands.trade.missing_coins', {
        coins: (BigInt(ctx.args[2]) - (!profile ? 0n : profile.coins)).toLocaleString(),
        user: `<@${ctx.args[0]}>`
      })
    }

    await ctx.reply({
      content: ctx.t('commands.trade.request', {
        player: `${player.name} (${player.ovr})`,
        collection: player.collection,
        user: `<@${ctx.args[0]}>`,
        author: ctx.interaction.user.toString(),
        coins: BigInt(ctx.args[2]).toLocaleString()
      }),
      components: [
        {
          type: 1,
          components: [
            new ButtonBuilder()
              .defineStyle('green')
              .setLabel(ctx.t('commands.trade.make_purchase'))
              .setCustomId(`trade;${ctx.args[0]};buy;${ctx.interaction.user.id};${player.id};${ctx.args[2]}`),
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

    const players: Array<{ name: string; ovr: number; id: string }> = []

    const value = i.options.getString('player', true)

    for (const p_id of profile.reserve_players) {
      const p = app.players.get(p_id)

      if (!p) continue

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
  },
  async createMessageComponentInteraction({ ctx, app, i }) {
    if (!i.guildId) return
    if (ctx.args[2] === 'buy') {
      const profile = await ProfileSchema.fetch(ctx.args[3], i.guildId)

      const player = app.players.get(ctx.args[4])

      if (!profile || !player) return

      const index = profile.reserve_players.indexOf(ctx.args[4])

      if (index === -1 || index === undefined) return

      if (ctx.db.profile.coins < BigInt(ctx.args[5])) {
        return await ctx.edit('commands.trade.missing_coins', {
          coins: (BigInt(ctx.args[5]) - ctx.db.profile.coins).toLocaleString(),
          user: `<@${ctx.interaction.user}>`
        })
      }

      await prisma.$transaction(async tx => {
        const sellerProfile = await tx.profile.findUnique({
          where: {
            userId_guildId: {
              userId: ctx.args[3],
              guildId: ctx.db.guild.id
            }
          }
        })

        const buyerProfile = await tx.profile.findUnique({
          where: {
            userId_guildId: {
              userId: ctx.db.profile.userId,
              guildId: ctx.db.guild.id
            }
          }
        })

        if (!sellerProfile || !buyerProfile) return

        const sellerReservePlayers = [...sellerProfile.reserve_players]
        const sellerPlayerIndex = sellerReservePlayers.indexOf(ctx.args[4])
        if (sellerPlayerIndex === -1) return
        sellerReservePlayers.splice(sellerPlayerIndex, 1)

        const sellerArenaMetadata = sellerProfile.arena_metadata
          ? JSON.parse(JSON.stringify(sellerProfile.arena_metadata))
          : null

        if ((sellerArenaMetadata as ArenaMetadata | null)?.lineup.some(line => line.player === player.id.toString())) {
          const lineupIndex = (sellerArenaMetadata as ArenaMetadata)?.lineup.findIndex(
            line => line.player === player.id.toString()
          )
          if (lineupIndex !== -1) {
            ;(sellerArenaMetadata as ArenaMetadata).lineup.splice(lineupIndex, 1)
          }
        }

        const updatedSeller = await tx.profile.update({
          where: {
            userId_guildId: {
              userId: ctx.args[3],
              guildId: ctx.db.guild.id
            }
          },
          data: {
            reserve_players: {
              set: sellerReservePlayers
            },
            arena_metadata: sellerArenaMetadata ? sellerArenaMetadata : undefined,
            coins: {
              increment: BigInt(ctx.args[5])
            }
          }
        })

        await tx.profile.update({
          where: {
            userId_guildId: {
              userId: ctx.db.profile.userId,
              guildId: ctx.db.guild.id
            }
          },
          data: {
            coins: {
              decrement: BigInt(ctx.args[5])
            },
            reserve_players: {
              push: ctx.args[4]
            }
          }
        })

        await tx.transaction.createMany({
          data: [
            {
              type: 'TRADE_PLAYER',
              player: player.id,
              price: BigInt(ctx.args[5]),
              profileId: updatedSeller.id,
              to: buyerProfile.userId
            },
            {
              type: 'TRADE_PLAYER',
              player: player.id,
              price: BigInt(ctx.args[5]),
              profileId: buyerProfile.id,
              to: sellerProfile.userId
            }
          ]
        })
      })

      await ctx.edit('commands.trade.res', {
        player: `${player.name} (${player.ovr})`,
        collection: player.collection,
        user: ctx.interaction.user.toString(),
        coins: BigInt(ctx.args[5]).toLocaleString()
      })
    } else {
      await ctx.edit('commands.trade.cancelled')
    }
  }
})
