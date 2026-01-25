import { calcPlayerPrice } from '@sabinelab/players'
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js'
import { env } from '@/env'
import EmbedBuilder from '../../structures/builders/EmbedBuilder'
import createCommand from '../../structures/command/createCommand'

const date = Date.now()

export const getNextPlayer = (
  collection: Set<string>,
  currentPlayer: string,
  type: 'next' | 'previous'
) => {
  const players = [...collection]
  const currentIndex = players.indexOf(currentPlayer)

  if (currentIndex === -1) return null

  if (type === 'next') {
    const nextIndex = currentIndex + 1
    return nextIndex < players.length ? players[nextIndex] : null
  }

  const prevIndex = currentIndex - 1
  return prevIndex >= 0 ? players[prevIndex] : null
}

export default createCommand({
  name: 'card',
  category: 'economy',
  nameLocalizations: {
    'pt-BR': 'carta'
  },
  description: 'Search a card',
  descriptionLocalizations: {
    'pt-BR': 'Pesquise uma carta'
  },
  syntax: 'card [card]',
  examples: ['card TenZ', 'card 12345'],
  args: {
    card: {
      type: ApplicationCommandOptionType.String,
      name: 'card',
      nameLocalizations: {
        'pt-BR': 'carta'
      },
      description: 'Insert the card',
      descriptionLocalizations: {
        'pt-BR': 'Informe a carta'
      },
      autocomplete: true,
      required: 'commands.card.missing_card'
    }
  },
  async run({ ctx, t, app }) {
    if (Number.isNaN(Number(ctx.args.card))) {
      const players = app.playerNameIndex.get(ctx.args.card.toLowerCase())

      if (!players) {
        return await ctx.reply('commands.card.player_not_found')
      }

      const firstPlayer = players.values().next().value
      const player = app.players.get(firstPlayer ?? '')

      if (!player) {
        return await ctx.reply('commands.card.player_not_found')
      }

      const embed = new EmbedBuilder()
        .setFields(
          {
            name: t('commands.card.name'),
            value: player.name,
            inline: true
          },
          {
            name: t('commands.card.collection'),
            value: player.collection,
            inline: true
          },
          {
            name: t('commands.card.price'),
            value: calcPlayerPrice(player).toLocaleString('en') + ' poisons',
            inline: true
          },
          {
            name: t('commands.card.devalued_price'),
            value: calcPlayerPrice(player, true).toLocaleString('en') + ' poisons',
            inline: true
          }
        )
        .setImage(`${env.CDN_URL}/cards/${player.id}.png?ts=${date}`)

      const previous = new ButtonBuilder()
        .setEmoji('1404176223621611572')
        .setCustomId(`card;${ctx.author.id};previous;${ctx.args.card};${firstPlayer}`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled()

      const next = new ButtonBuilder()
        .setEmoji('1404176291829121028')
        .setCustomId(`card;${ctx.author.id};next;${ctx.args.card};${firstPlayer}`)
        .setStyle(ButtonStyle.Primary)

      const row = new ActionRowBuilder<ButtonBuilder>().setComponents(previous, next)

      await ctx.reply({
        embeds: [embed],
        components: [row]
      })
    } else {
      const player = app.players.get(ctx.args.card)
      if (!player) {
        return await ctx.reply('commands.card.player_not_found')
      }

      const embed = new EmbedBuilder()
        .setFields(
          {
            name: t('commands.card.name'),
            value: player.name,
            inline: true
          },
          {
            name: t('commands.card.collection'),
            value: player.collection,
            inline: true
          },
          {
            name: t('commands.card.price'),
            value: calcPlayerPrice(player).toLocaleString('en') + ' poisons',
            inline: true
          },
          {
            name: t('commands.card.devalued_price'),
            value: calcPlayerPrice(player, true).toLocaleString('en') + ' poisons',
            inline: true
          }
        )
        .setImage(`${env.CDN_URL}/cards/${player.id}.png?ts=${date}`)

      await ctx.reply(embed.build())
    }
  },
  async createAutocompleteInteraction({ i, app }) {
    const value = i.options.getString('card', true)

    const players: Array<{ name: string; ovr: number; id: number }> = []

    for (const p of app.players.values()) {
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
  async createMessageComponentInteraction({ ctx, app, t }) {
    const players = app.playerNameIndex.get(ctx.args[3])

    if (!players) {
      return await ctx.reply('commands.card.player_not_found')
    }

    const nextPlayer = getNextPlayer(players, ctx.args[4], ctx.args[2] as 'next' | 'previous')
    const player = app.players.get(nextPlayer ?? '')

    if (!player) {
      return await ctx.reply('commands.card.player_not_found')
    }

    const embed = new EmbedBuilder()
      .setFields(
        {
          name: t('commands.card.name'),
          value: player.name,
          inline: true
        },
        {
          name: t('commands.card.collection'),
          value: player.collection,
          inline: true
        },
        {
          name: t('commands.card.price'),
          value: calcPlayerPrice(player).toLocaleString('en') + ' poisons',
          inline: true
        },
        {
          name: t('commands.card.devalued_price'),
          value: calcPlayerPrice(player, true).toLocaleString('en') + ' poisons',
          inline: true
        }
      )
      .setImage(`${env.CDN_URL}/cards/${player.id}.png?ts=${date}`)

    const previous = new ButtonBuilder()
      .setEmoji('1404176223621611572')
      .setCustomId(`card;${ctx.author.id};previous;${ctx.args[3]};${nextPlayer}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!getNextPlayer(players, nextPlayer!, 'previous'))

    const next = new ButtonBuilder()
      .setEmoji('1404176291829121028')
      .setCustomId(`card;${ctx.author.id};next;${ctx.args[3]};${nextPlayer}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!getNextPlayer(players, nextPlayer!, 'next'))

    const row = new ActionRowBuilder<ButtonBuilder>().setComponents(previous, next)

    await ctx.edit({
      embeds: [embed],
      components: [row]
    })
  }
})
