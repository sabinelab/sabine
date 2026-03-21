import { ApplicationCommandOptionType } from 'discord.js'
import ButtonBuilder from '../../structures/builders/ButtonBuilder'
import EmbedBuilder from '../../structures/builders/EmbedBuilder'
import createCommand from '../../structures/command/createCommand'

export default createCommand({
  name: 'career',
  aliases: ['carreira'],
  nameLocalizations: {
    'pt-BR': 'carreira'
  },
  description: 'See your career',
  descriptionLocalizations: {
    'pt-BR': 'Veja sua carreira'
  },
  category: 'economy',
  syntax: 'career [page]',
  examples: ['career', 'career 1', 'career 2'],
  args: {
    page: {
      type: ApplicationCommandOptionType.Integer,
      name: 'page',
      nameLocalizations: {
        'pt-BR': 'página'
      },
      description: 'Insert a number page',
      descriptionLocalizations: {
        'pt-BR': 'Insira o número de uma página'
      }
    }
  },
  messageComponentInteractionTime: 5 * 60 * 1000,
  async run({ ctx, t, app }) {
    const page = Number(ctx.args.page) || 1
    const matches = await app.prisma.match.findMany({
      where: {
        profile: {
          userId: ctx.db.profile.userId,
          guildId: ctx.db.guild.id
        }
      },
      orderBy: {
        when: 'desc'
      },
      skip: (page - 1) * 10,
      take: 11,
      include: {
        teams: true
      }
    })

    if (!matches.length) {
      return await ctx.reply('commands.career.no_pages')
    }

    let content = ''

    const embed = new EmbedBuilder()
      .setAuthor({
        name: t('commands.career.embed.author'),
        iconURL: ctx.author.displayAvatarURL({ size: 2048 })
      })
      .setFooter({
        text: t('commands.career.embed.footer', { page })
      })

    for (const match of matches) {
      if (match.mode.toLowerCase().includes('ranked') && match.mode.toLowerCase() !== 'unranked') {
        const timestamp = (match.when.getTime() / 1000).toFixed(0)

        const type = match.winner ? 'win' : 'defeat'

        content += `- [<t:${timestamp}:d> <t:${timestamp}:t> | <t:${timestamp}:R>] **[${t(`commands.career.mode.${match.mode}`)}]** ${t(
          `commands.career.type.ranked_${type}`,
          {
            score: `${match.teams[0].score}-${match.teams[1].score}`,
            user: `<@${match.teams[1].user}>`,
            points: match.points! > 0 ? `+${match.points}` : match.points
          }
        )}\n  - ${t('commands.career.seed')}: \`${match.id}\`\n`
      } else if (match.mode === 'ARENA') {
        const timestamp = (match.when.getTime() / 1000).toFixed(0)

        const type = match.winner ? 'win' : 'defeat'

        content += `- [<t:${timestamp}:d> <t:${timestamp}:t> | <t:${timestamp}:R>] **[${t(`commands.career.mode.${match.mode}`)}]** ${t(
          `commands.career.type.ranked_${type}`,
          {
            score: `${match.teams[0].score}-${match.teams[1].score}`,
            user: `<@${match.teams[1].user}>`,
            points: match.points! > 0 ? `+${match.points}` : match.points
          }
        )}\n  - ${t('commands.career.seed')}: \`${match.id}\`\n`
      } else {
        const timestamp = (match.when.getTime() / 1000).toFixed(0)

        const type = match.winner ? 'win' : 'defeat'

        content += `- [<t:${timestamp}:d> <t:${timestamp}:t> | <t:${timestamp}:R>] **[${t(`commands.career.mode.${match.mode}`)}]** ${t(
          `commands.career.type.unranked_${type}`,
          {
            score: `${match.teams[0].score}-${match.teams[1].score}`,
            user: `<@${match.teams[1].user}>`
          }
        )}\n  - ${t('commands.career.seed')}: \`${match.id}\`\n`
      }
    }

    embed.setDesc(content)

    const previous = new ButtonBuilder()
      .defineStyle('blue')
      .setEmoji('1404176223621611572')
      .setCustomId(`career;${ctx.author.id};${page - 1};previous`)

    const next = new ButtonBuilder()
      .defineStyle('blue')
      .setEmoji('1404176291829121028')
      .setCustomId(`career;${ctx.author.id};${page + 1};next`)

    if (page <= 1) {
      previous.setDisabled()
    }

    if (matches.length <= 10) {
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
    const page = Number(ctx.args[2]) || 1
    const matches = await app.prisma.match.findMany({
      where: {
        profile: {
          userId: ctx.db.profile.userId,
          guildId: ctx.db.guild.id
        }
      },
      orderBy: {
        when: 'desc'
      },
      skip: (page - 1) * 10,
      take: 11,
      include: {
        teams: true
      }
    })

    if (!matches.length) {
      return await ctx.reply('commands.career.no_pages')
    }

    let content = ''

    const embed = new EmbedBuilder()
      .setAuthor({
        name: t('commands.career.embed.author'),
        iconURL: ctx.author.displayAvatarURL({ size: 2048 })
      })
      .setFooter({
        text: t('commands.career.embed.footer', { page })
      })

    for (const match of matches) {
      if (match.mode.toLowerCase().includes('ranked') && match.mode.toLowerCase() !== 'unranked') {
        const timestamp = (match.when.getTime() / 1000).toFixed(0)

        const type = match.winner ? 'win' : 'defeat'

        content += `- [<t:${timestamp}:d> <t:${timestamp}:t> | <t:${timestamp}:R>] **[${t(`commands.career.mode.${match.mode}`)}]** ${t(
          `commands.career.type.ranked_${type}`,
          {
            score: `${match.teams[0].score}-${match.teams[1].score}`,
            user: `<@${match.teams[1].user}>`,
            points: match.points! > 0 ? `+${match.points}` : match.points
          }
        )}\n  - ${t('commands.career.seed')}: \`${match.id}\`\n`
      } else if (match.mode === 'ARENA') {
        const timestamp = (match.when.getTime() / 1000).toFixed(0)

        const type = match.winner ? 'win' : 'defeat'

        content += `- [<t:${timestamp}:d> <t:${timestamp}:t> | <t:${timestamp}:R>] **[${t(`commands.career.mode.${match.mode}`)}]** ${t(
          `commands.career.type.ranked_${type}`,
          {
            score: `${match.teams[0].score}-${match.teams[1].score}`,
            user: `<@${match.teams[1].user}>`,
            points: match.points! > 0 ? `+${match.points}` : match.points
          }
        )}\n  - ${t('commands.career.seed')}: \`${match.id}\`\n`
      } else {
        const timestamp = (match.when.getTime() / 1000).toFixed(0)

        const type = match.winner ? 'win' : 'defeat'

        content += `- [<t:${timestamp}:d> <t:${timestamp}:t> | <t:${timestamp}:R>] **[${t(`commands.career.mode.${match.mode}`)}]** ${t(
          `commands.career.type.unranked_${type}`,
          {
            score: `${match.teams[0].score}-${match.teams[1].score}`,
            user: `<@${match.teams[1].user}>`
          }
        )}\n  - ${t('commands.career.seed')}: \`${match.id}\`\n`
      }
    }

    embed.setDesc(content)

    const previous = new ButtonBuilder()
      .defineStyle('blue')
      .setEmoji('1404176223621611572')
      .setCustomId(`career;${ctx.author.id};${page - 1};previous`)

    const next = new ButtonBuilder()
      .defineStyle('blue')
      .setEmoji('1404176291829121028')
      .setCustomId(`career;${ctx.author.id};${page + 1};next`)

    if (page <= 1) {
      previous.setDisabled()
    }

    if (matches.length <= 10) {
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
  }
})
