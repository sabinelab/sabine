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

    let transactions = (
      await app.prisma.transaction.findMany({
        where: {
          profile: {
            userId: ctx.db.profile.userId,
            guildId: ctx.db.guild.id
          }
        }
      })
    ).sort((a, b) => b.created_at.getTime() - a.created_at.getTime())

    const array = transactions

    if (page === 1) {
      transactions = transactions.slice(0, 10)
    } else transactions = transactions.slice(page * 10 - 10, page * 10)
    if (!transactions.length) {
      return await ctx.reply('commands.transactions.none_yet')
    }

    const embed = new EmbedBuilder().setTitle(t('commands.transactions.embed.title')).setFooter({
      text: t('commands.transactions.embed.footer', {
        page,
        pages: Math.ceil(array.length / 10)
      })
    })

    let description = ''

    for (const transaction of transactions) {
      const timestamp = (transaction.created_at.getTime() / 1000).toFixed(0)

      if (transaction.player) {
        const player = app.players.get(transaction.player.toString())

        if (!player) continue

        description += `- [<t:${timestamp}:d> <t:${timestamp}:t> | <t:${timestamp}:R>] ${t(
          `commands.transactions.type.${transaction.type}`,
          {
            player: `${player.name} (${player.collection})`,
            price: transaction.price?.toLocaleString(),
            user: `<@${transaction.to}>`
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
      .setCustomId(
        `transactions;${ctx.interaction.user.id};${page - 1 < 1 ? 1 : page - 1};previous`
      )

    const next = new ButtonBuilder()
      .defineStyle('blue')
      .setEmoji('1404176291829121028')
      .setCustomId(
        `transactions;${ctx.interaction.user.id};${page + 1 > Math.ceil(array.length / 10) ? Math.ceil(array.length / 10) : page + 1};next`
      )

    if (page <= 1) previous.setDisabled()

    if (page >= Math.ceil(array.length / 10)) next.setDisabled()
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

    const page = Number(ctx.args[2])

    let transactions = (
      await app.prisma.transaction.findMany({
        where: {
          profile: {
            userId: ctx.db.profile.userId,
            guildId: ctx.db.guild.id
          }
        }
      })
    ).sort((a, b) => b.created_at.getTime() - a.created_at.getTime())

    const array = transactions

    transactions = transactions.slice(page * 10 - 10, page * 10)

    if (!transactions.length) {
      return await ctx.reply('commands.transactions.none_yet')
    }

    const embed = new EmbedBuilder().setTitle(t('commands.transactions.embed.title')).setFooter({
      text: t('commands.transactions.embed.footer', {
        page,
        pages: Math.ceil(array.length / 10)
      })
    })

    let description = ''

    for (const transaction of transactions) {
      const timestamp = (transaction.created_at.getTime() / 1000).toFixed(0)

      if (transaction.player) {
        const player = app.players.get(transaction.player.toString())

        if (!player) continue

        description += `- [<t:${timestamp}:d> <t:${timestamp}:t> | <t:${timestamp}:R>] ${t(
          `commands.transactions.type.${transaction.type}`,
          {
            player: `${player.name} (${player.collection})`,
            price: transaction.price?.toLocaleString(),
            user: `<@${transaction.to}>`
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

    if (page <= 1) previous.setDisabled()

    if (page >= Math.ceil(array.length / 10)) next.setDisabled()

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
