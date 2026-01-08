import { ApplicationCommandOptionType } from 'discord.js'
import { env } from '@/env'
import ButtonBuilder from '../../structures/builders/ButtonBuilder'
import EmbedBuilder from '../../structures/builders/EmbedBuilder'
import createCommand from '../../structures/command/createCommand'

export default createCommand({
  name: 'sign',
  nameLocalizations: {
    'pt-BR': 'contratar'
  },
  description: 'Sign a player',
  descriptionLocalizations: {
    'pt-BR': 'Contrate um jogador'
  },
  category: 'economy',
  options: [
    {
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
  ],
  messageComponentInteractionTime: 5 * 60 * 1000,
  async run({ ctx, t, app }) {
    const player = app.players.get(ctx.args[0].toString())

    if (!player || !player.purchasable) return await ctx.reply('commands.sign.player_not_found')

    const price = player.price

    const embed = new EmbedBuilder()
      .setTitle(player.name)
      .setDesc(
        t('commands.sign.embed.desc', {
          price: price.toLocaleString()
        })
      )
      .setImage(`${env.CDN_URL}/cards/${player.id}.png`)

    const button = new ButtonBuilder()
      .defineStyle('green')
      .setLabel(t('commands.sign.buy'))
      .setCustomId(`sign;${ctx.interaction.user.id};${player.id}`)

    await ctx.reply(embed.build(button.build()))
  },
  async createAutocompleteInteraction({ i, app }) {
    const players: Array<{ name: string; ovr: number; id: number }> = []

    const value = i.options.getString('player', true)

    for (const p of app.players.values()) {
      if (!p.purchasable) continue

      const ovr = Math.floor(p.ovr)

      players.push({
        name: `${p.name} (${ovr}) — ${p.collection}`,
        ovr,
        id: p.id
      })
    }

    await i.respond(
      players
        .sort((a, b) => b.ovr - a.ovr)
        .filter(p => p.name.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 25)
        .map(p => ({ name: p.name, value: p.id.toString() }))
    )
  },
  async createMessageComponentInteraction({ ctx, i, app }) {
    await i.deferReply({ flags: 64 })

    const player = app.players.get(ctx.args[2])

    if (!player) return

    const price = player.price

    if (price > ctx.db.profile.coins) return ctx.reply('commands.sign.coins_needed')

    await app.prisma.$transaction([
      app.prisma.transaction.create({
        data: {
          player: player.id,
          type: 'SIGN_PLAYER',
          profile: {
            connect: {
              userId_guildId: {
                userId: ctx.db.profile.userId,
                guildId: ctx.db.guild.id
              }
            }
          }
        }
      }),
      app.prisma.profile.update({
        where: {
          userId_guildId: {
            userId: ctx.db.profile.userId,
            guildId: ctx.db.guild.id
          }
        },
        data: {
          reserve_players: {
            push: player.id.toString()
          },
          coins: {
            decrement: price
          }
        }
      })
    ])

    await ctx.reply('commands.sign.signed', {
      player: `${player.name} (${Math.floor(player.ovr)})`,
      price: price.toLocaleString()
    })
  }
})
