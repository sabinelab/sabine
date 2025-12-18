import { ApplicationCommandOptionType } from 'discord.js'
import createCommand from '../../structures/command/createCommand'
import { prisma, SabineUser, type ArenaMetadata } from '@db'
import ButtonBuilder from '../../structures/builders/ButtonBuilder'
import { calcPlayerPrice } from '@sabinelab/players'

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
    const user = await SabineUser.fetch(ctx.args[0].toString())

    const player = app.players.get(ctx.args[1].toString())

    if(!player) {
      return await ctx.reply('commands.trade.player_not_found')
    }

    const price = calcPlayerPrice(player, true)

    if(BigInt(ctx.args[2]) < price) {
      return await ctx.reply('commands.trade.invalid_value', { value: price.toLocaleString() })
    }

    if(ctx.args[0] === ctx.interaction.user.id) {
      return await ctx.reply('commands.trade.cannot_trade')
    }

    if(!user || user.coins < BigInt(ctx.args[2])) {
      return await ctx.reply('commands.trade.missing_coins', {
        coins: (BigInt(ctx.args[2]) - (!user ? 0n : user.coins)).toLocaleString(),
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
    const user = (await SabineUser.fetch(i.user.id)) ?? new SabineUser(i.user.id)

    const players: Array<{ name: string, ovr: number, id: string }> = []

    const value = i.options.getString('player', true)

    for(const p_id of user.reserve_players) {
      const p = app.players.get(p_id)

      if(!p) continue

      const ovr = Math.floor(p.ovr)

      players.push({
        name: `${p.name} (${ovr})`,
        ovr,
        id: p_id
      })
    }

    await i.respond(
      players.sort((a, b) => a.ovr - b.ovr)
        .filter(p => {
          if(p.name.toLowerCase().includes(value.toLowerCase())) return p
        })
        .slice(0, 25)
        .map(p => ({ name: p.name, value: p.id }))
    )
  },
  async createMessageComponentInteraction({ ctx, app }) {
    if(ctx.args[2] === 'buy') {
      const user = await SabineUser.fetch(ctx.args[3])

      const player = app.players.get(ctx.args[4])

      if(!user || !player) return

      const i = user.reserve_players.findIndex(p => p === ctx.args[4])

      if(i === -1 || i === undefined) return

      if(ctx.db.user.coins < BigInt(ctx.args[5])) {
        return await ctx.edit('commands.trade.missing_coins', {
          coins: (BigInt(ctx.args[5]) - ctx.db.user.coins).toLocaleString(),
          user: `<@${ctx.interaction.user}>`
        })
      }

      await prisma.$transaction(async(tx) => {
        const user = await tx.user.findUnique({
          where: {
            id: ctx.db.user.id
          }
        })

        if(!user) return

        if(
          (user.arena_metadata as ArenaMetadata).lineup
            .some(line => line.player === player.id.toString())
        ) {
          const index = (user.arena_metadata as ArenaMetadata).lineup
            .findIndex(line => line.player === player.id.toString())

          ;(user.arena_metadata as ArenaMetadata).lineup.splice(index, 1)
        }

        await tx.user.update({
          where: {
            id: user.id
          },
          data: {
            reserve_players: user.reserve_players,
            arena_metadata: user.arena_metadata
              ? user.arena_metadata
              : undefined,
            coins: {
              increment: BigInt(ctx.args[5])
            }
          }
        })

        await tx.user.update({
          where: {
            id: ctx.db.user.id
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
              userId: ctx.db.user.id,
              to: user.id
            },
            {
              type: 'TRADE_PLAYER',
              player: player.id,
              price: BigInt(ctx.args[5]),
              userId: user.id,
              to: ctx.db.user.id
            }
          ]
        })
        await Bun.redis.del(`user:${ctx.db.user.id}`)
        await Bun.redis.del(`user:${user.id}`)
      })

      await ctx.edit('commands.trade.res', {
        player: `${player.name} (${player.ovr})`,
        collection: player.collection,
        user: ctx.interaction.user.toString(),
        coins: BigInt(ctx.args[5]).toLocaleString()
      })
    }
    else {
      await ctx.edit('commands.trade.cancelled')
    }
  }
})