import { ApplicationCommandOptionType } from 'discord.js'
import ButtonBuilder from '../../structures/builders/ButtonBuilder'
import EmbedBuilder from '../../structures/builders/EmbedBuilder'
import createCommand from '../../structures/command/createCommand'

export default createCommand({
  name: 'transactions',
  nameLocalizations: {
    'pt-BR': 'transações'
  },
  description: 'View your player transactions',
  descriptionLocalizations: {
    'pt-BR': 'Veja sua transação de jogadores'
  },
  category: 'economy',
  options: [
    {
      type: ApplicationCommandOptionType.Integer,
      name: 'page',
      nameLocalizations: {
        'pt-BR': 'página'
      },
      description: 'Provide a page',
      descriptionLocalizations: {
        'pt-BR': 'Informe a página'
      }
    }
  ],
  messageComponentInteractionTime: 5 * 60 * 1000,
  async run({ ctx, t, app }) {
    const page = Number(ctx.args[0]) || 1

    const transactions = await app.prisma.transaction.findMany({
      where: {
        profileId: ctx.db.profile.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * 10,
      take: 11
    })

    if (!transactions.length) {
      return await ctx.reply('commands.transactions.none_yet')
    }

    const embed = new EmbedBuilder().setTitle(t('commands.transactions.embed.title')).setFooter({
      text: t('commands.transactions.embed.footer', {
        page
      })
    })

    let description = ''

    for (const transaction of transactions.slice(0, 10)) {
      const timestamp = (transaction.createdAt.getTime() / 1000).toFixed(0)

      if (transaction.player) {
        const player = app.players.get(transaction.player.toString())

        if (!player) continue

        description += `- [<t:${timestamp}:d> <t:${timestamp}:t> | <t:${timestamp}:R>] ${t(
          `commands.transactions.type.${transaction.type}`,
          {
            player: `${player.name} (${player.collection})`,
            price: transaction.price?.toLocaleString(),
            user: `<@${transaction.to}>`,
            cmd: `</claim:${app.commands.get('claim')?.id}>`
          }
        )}\n`
      } else if (transaction.pack) {
        description += `- [<t:${timestamp}:d> <t:${timestamp}:t> | <t:${timestamp}:R>] ${t(
          `commands.transactions.type.${transaction.type}`,
          {
            pack: transaction.pack
          }
        )}\n`
      }
    }

    embed.setDesc(description)

    const previous = new ButtonBuilder()
      .defineStyle('blue')
      .setEmoji('1404176223621611572')
      .setCustomId(`transactions;${ctx.interaction.user.id};${page - 1};previous`)

    const next = new ButtonBuilder()
      .defineStyle('blue')
      .setEmoji('1404176291829121028')
      .setCustomId(`transactions;${ctx.interaction.user.id};${page + 1};next`)

    if (page <= 1) {
      previous.setDisabled()
    }
    if (transactions.length <= 10) {
      next.setDisabled()
    }

    await ctx.reply(
      embed.build({
        components: [
          {
            type: 1,
            components: [previous, next]
          }
        ]
      })
    )
  },
  async createMessageComponentInteraction({ ctx, t, app }) {
    ctx.setFlags(64)

    const page = Number(ctx.args[2]) || 1

    const transactions = await app.prisma.transaction.findMany({
      where: {
        profileId: ctx.db.profile.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * 10,
      take: 11
    })

    if (!transactions.length) {
      return await ctx.reply('commands.transactions.none_yet')
    }

    const embed = new EmbedBuilder().setTitle(t('commands.transactions.embed.title')).setFooter({
      text: t('commands.transactions.embed.footer', {
        page
      })
    })

    let description = ''

    for (const transaction of transactions.slice(0, 10)) {
      const timestamp = (transaction.createdAt.getTime() / 1000).toFixed(0)

      if (transaction.player) {
        const player = app.players.get(transaction.player.toString())

        if (!player) continue

        description += `- [<t:${timestamp}:d> <t:${timestamp}:t> | <t:${timestamp}:R>] ${t(
          `commands.transactions.type.${transaction.type}`,
          {
            player: `${player.name} (${player.collection})`,
            price: transaction.price?.toLocaleString(),
            user: `<@${transaction.to}>`,
            cmd: `</claim:${app.commands.get('claim')?.id}>`
          }
        )}\n`
      } else if (transaction.pack) {
        description += `- [<t:${timestamp}:d> <t:${timestamp}:t> | <t:${timestamp}:R>] ${t(
          `commands.transactions.type.${transaction.type}`,
          {
            pack: transaction.pack
          }
        )}\n`
      }
    }

    embed.setDesc(description)

    const previous = new ButtonBuilder()
      .defineStyle('blue')
      .setEmoji('1404176223621611572')
      .setCustomId(`transactions;${ctx.interaction.user.id};${page - 1};previous`)

    const next = new ButtonBuilder()
      .defineStyle('blue')
      .setEmoji('1404176291829121028')
      .setCustomId(`transactions;${ctx.interaction.user.id};${page + 1};next`)

    if (page <= 1) {
      previous.setDisabled()
    }
    if (transactions.length <= 10) {
      next.setDisabled()
    }

    await ctx.edit({
      embeds: [embed],
      components: [
        {
          type: 1,
          components: [previous, next]
        }
      ]
    })
  }
})
