import { prisma } from '@db'
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js'
import { env } from '@/env'
import EmbedBuilder from '@/structures/builders/EmbedBuilder'
import createCommand from '@/structures/command/createCommand'
import { createProgressBar } from '@/util/createProgressBar'

const date = Date.now().toString()

export default createCommand({
  name: 'show',
  nameLocalizations: {
    'pt-BR': 'mostrar'
  },
  description: 'Show a player from your roster',
  descriptionLocalizations: {
    'pt-BR': 'Mostra um jogador do seu elenco'
  },
  category: 'economy',
  args: {
    player: {
      type: ApplicationCommandOptionType.String,
      name: 'player',
      nameLocalizations: {
        'pt-BR': 'jogador'
      },
      description: 'Provide a player',
      descriptionLocalizations: {
        'pt-BR': 'Informe o jogador'
      },
      autocomplete: true,
      required: true
    }
  },
  async run({ ctx }) {
    if (Number.isNaN(Number(ctx.args.player))) {
      const players = ctx.app.playerNameIndex.get(ctx.args.player.toLowerCase())
      if (!players) {
        return await ctx.reply('commands.card.player_not_found')
      }
      const cards = await prisma.card.findMany({
        where: {
          profileId: ctx.db.profile.id,
          playerId: {
            in: [...players]
          }
        },
        orderBy: {
          id: 'asc'
        },
        take: 2
      })
      const card = cards[0]
      if (!card) {
        return await ctx.reply('commands.card.player_not_found')
      }

      const player = ctx.app.players.get(card.playerId)
      if (!player) {
        return await ctx.reply('commands.card.player_not_found')
      }

      const query = new URLSearchParams({
        id: player.id.toString(),
        collection: player.collection,
        country: player.country,
        team: player.team,
        role: player.role,
        aim: card.aim.toString(),
        hs: card.hs.toString(),
        movement: card.movement.toString(),
        aggression: card.aggression.toString(),
        acs: card.acs.toString(),
        gamesense: card.gamesense.toString(),
        ovr: card.overall.toString(),
        ts: date
      }).toString()

      const embed = new EmbedBuilder()
        .setTitle(`${player.name} — ${player.collection}`)
        .setDesc(
          ctx.t('commands.show.card_content', {
            level: card.level,
            xp: card.xp,
            progress: createProgressBar(card.xp / card.requiredXp)
          })
        )
        .setImage(`${env.CDN_URL}/show?${query}`)

      const previous = new ButtonBuilder()
        .setEmoji('1404176223621611572')
        .setCustomId(
          `show;${ctx.author.id};previous;${ctx.args.player};${card.playerId};${card.id}`
        )
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true)

      const next = new ButtonBuilder()
        .setEmoji('1404176291829121028')
        .setCustomId(`show;${ctx.author.id};next;${ctx.args.player};${card.playerId};${card.id}`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(cards.length === 1)

      const row = new ActionRowBuilder<ButtonBuilder>().setComponents(previous, next)

      await ctx.reply(embed.build({ components: [row] }))
    }
  },
  async createMessageComponentInteraction({ ctx }) {
    const players = ctx.app.playerNameIndex.get(ctx.args[3])
    if (!players) {
      return await ctx.reply('commands.card.player_not_found')
    }

    const action = ctx.args[2] as 'next' | 'previous'
    const currentId = BigInt(ctx.args[5])

    const cards = await prisma.card.findMany({
      cursor: {
        id: currentId
      },
      skip: 1,
      take: action === 'next' ? 2 : -2,
      where: {
        profileId: ctx.db.profile.id,
        playerId: {
          in: [...players]
        }
      },
      orderBy: {
        id: 'asc'
      }
    })

    const card = action === 'next' ? cards[0] : cards[cards.length - 1]
    const player = ctx.app.players.get(card?.playerId ?? '')

    if (!player || !card) {
      return await ctx.reply('commands.card.player_not_found')
    }

    const query = new URLSearchParams({
      id: player.id.toString(),
      collection: player.collection,
      country: player.country,
      team: player.team,
      role: player.role,
      aim: card.aim.toString(),
      hs: card.hs.toString(),
      movement: card.movement.toString(),
      aggression: card.aggression.toString(),
      acs: card.acs.toString(),
      gamesense: card.gamesense.toString(),
      ovr: card.overall.toString(),
      ts: date
    }).toString()

    const embed = new EmbedBuilder()
      .setTitle(`${player.name} — ${player.collection}`)
      .setDesc(
        ctx.t('commands.show.card_content', {
          level: card.level,
          xp: card.xp,
          progress: createProgressBar(card.xp / card.requiredXp)
        })
      )
      .setImage(`${env.CDN_URL}/show?${query}`)

    const hasNext = action === 'next' ? cards.length > 1 : true
    const hasPrevious = action === 'previous' ? cards.length > 1 : true

    const previous = new ButtonBuilder()
      .setEmoji('1404176223621611572')
      .setCustomId(`show;${ctx.author.id};previous;${ctx.args[3]};${card.playerId};${card.id}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!hasPrevious)

    const next = new ButtonBuilder()
      .setEmoji('1404176291829121028')
      .setCustomId(`show;${ctx.author.id};next;${ctx.args[3]};${card.playerId};${card.id}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!hasNext)

    const row = new ActionRowBuilder<ButtonBuilder>().setComponents(previous, next)

    await ctx.edit({
      embeds: [embed],
      components: [row]
    })
  }
})
