import type { $Enums } from '@generated'
import { ApplicationCommandOptionType } from 'discord.js'
import ButtonBuilder from '../../structures/builders/ButtonBuilder'
import EmbedBuilder from '../../structures/builders/EmbedBuilder'
import createCommand from '../../structures/command/createCommand'

const status = {
  correct: '<:success:1300882212190945292>',
  incorrect: '<:error:1300882259078938685>',
  pending: '<a:loading:809221866434199634>'
} as const

export default createCommand({
  name: 'predictions',
  category: 'esports',
  nameLocalizations: {
    'pt-BR': 'palpites'
  },
  description: 'Shows your predictions',
  descriptionLocalizations: {
    'pt-BR': 'Mostra seus palpites'
  },
  args: {
    valorant: {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'valorant',
      description: 'Shows your VALORANT predictions',
      descriptionLocalizations: {
        'pt-BR': 'Mostra seus palpites de VALORANT'
      },
      args: {
        page: {
          type: ApplicationCommandOptionType.Integer,
          name: 'page',
          nameLocalizations: {
            'pt-BR': 'página'
          },
          description: 'Insert the page',
          descriptionLocalizations: {
            'pt-BR': 'Insira a página'
          }
        }
      }
    },
    lol: {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'lol',
      description: 'Shows your League of Legends predictions',
      descriptionLocalizations: {
        'pt-BR': 'Mostra seus palpites de League of Legends'
      },
      args: {
        page: {
          type: ApplicationCommandOptionType.Integer,
          name: 'page',
          nameLocalizations: {
            'pt-BR': 'página'
          },
          description: 'Insert the page',
          descriptionLocalizations: {
            'pt-BR': 'Insira a página'
          }
        }
      }
    }
  },
  syntax: 'predictions <page>',
  examples: [
    'predictions valorant',
    'precitions lol',
    'predictions valorant 1',
    'predictions lol 2',
    'predictions valorant 5'
  ],
  async run({ ctx, t, app }) {
    const game = ctx.args.valorant ? 'valorant' : 'lol'
    const page = Number(ctx.args.valorant?.page || ctx.args.lol?.page) || 1

    const [predictions, count] = await Promise.all([
      app.prisma.prediction.findMany({
        where: {
          game: game as $Enums.Game,
          profileId: ctx.db.profile.id
        },
        include: {
          teams: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * 5,
        take: 5
      }),
      app.prisma.prediction.count({
        where: {
          game: game as $Enums.Game,
          profileId: ctx.db.profile.id
        }
      })
    ])

    if (!predictions.length) {
      return await ctx.reply('commands.predictions.no_predictions')
    }

    const embed = new EmbedBuilder()
      .setAuthor({
        name: t('commands.predictions.embed.author'),
        iconURL: ctx.author.displayAvatarURL({ size: 2048 })
      })
      .setDesc(
        t('commands.predictions.embed.desc', {
          correct: ctx.db.profile.correctPredictions,
          wrong: ctx.db.profile.incorrectPredictions,
          t: count
        })
      )
      .setFooter({
        text: t('commands.predictions.embed.footer', {
          page
        })
      })

    for (const prediction of predictions.slice(0, 5)) {
      let odd = ''
      if (prediction.odd) {
        odd += `\nOdd: \`${prediction.odd}x\``
      }

      const timestamp = (prediction.createdAt.getTime() / 1000).toFixed(0)

      embed.addField(
        `${prediction.teams[0].name} <:versus:1349105624180330516> ${prediction.teams[1].name} (<t:${timestamp}:d> <t:${timestamp}:t> | <t:${timestamp}:R>)`,
        t('commands.predictions.embed.field', {
          score1: prediction.teams[0].score,
          score2: prediction.teams[1].score,
          link: `https://www.vlr.gg/${prediction.match}`,
          status: status[prediction.status]
        }) + odd
      )
    }

    const previous = new ButtonBuilder()
      .setEmoji('1404176223621611572')
      .setCustomId(`predictions;${ctx.author.id};${page - 1};previous;${game}`)
      .defineStyle('blue')

    const next = new ButtonBuilder()
      .setEmoji('1404176291829121028')
      .setCustomId(`predictions;${ctx.author.id};${page + 1};next;${game}`)
      .defineStyle('blue')

    if (page <= 1) {
      previous.setDisabled()
    }
    if (count <= 5) {
      next.setDisabled()
    }

    await ctx.reply({
      embeds: [embed],
      components: [
        {
          type: 1,
          components: [previous, next]
        }
      ]
    })
  },
  async createMessageComponentInteraction({ ctx, t, app }) {
    const page = Number(ctx.args[2]) || 1

    const [predictions, count] = await Promise.all([
      app.prisma.prediction.findMany({
        where: {
          game: ctx.args[4] as $Enums.Game,
          profileId: ctx.db.profile.id
        },
        include: {
          teams: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * 5,
        take: 5
      }),
      app.prisma.prediction.count({
        where: {
          game: ctx.args[4] as $Enums.Game,
          profileId: ctx.db.profile.id
        }
      })
    ])

    if (!predictions.length) {
      return await ctx.reply('commands.predictions.no_predictions')
    }

    const embed = new EmbedBuilder()
      .setAuthor({
        name: t('commands.predictions.embed.author'),
        iconURL: ctx.author.displayAvatarURL({ size: 2048 })
      })
      .setDesc(
        t('commands.predictions.embed.desc', {
          correct: ctx.db.profile.correctPredictions,
          wrong: ctx.db.profile.incorrectPredictions,
          t: count
        })
      )
      .setFooter({
        text: t('commands.predictions.embed.footer', {
          page
        })
      })

    for (const prediction of predictions.slice(0, 5)) {
      let odd = ''
      if (prediction.odd) {
        odd += `\nOdd: \`${prediction.odd}x\``
      }

      const timestamp = (prediction.createdAt.getTime() / 1000).toFixed(0)

      embed.addField(
        `${prediction.teams[0].name} <:versus:1349105624180330516> ${prediction.teams[1].name} (<t:${timestamp}:d> <t:${timestamp}:t> | <t:${timestamp}:R>)`,
        t('commands.predictions.embed.field', {
          score1: prediction.teams[0].score,
          score2: prediction.teams[1].score,
          link: `https://www.vlr.gg/${prediction.match}`,
          status: status[prediction.status]
        }) + odd
      )
    }

    const previous = new ButtonBuilder()
      .setEmoji('1404176223621611572')
      .setCustomId(`predictions;${ctx.author.id};${page - 1};previous;${ctx.args[4]}`)
      .defineStyle('blue')

    const next = new ButtonBuilder()
      .setEmoji('1404176291829121028')
      .setCustomId(`predictions;${ctx.author.id};${page + 1};next;${ctx.args[4]}`)
      .defineStyle('blue')

    if (page <= 1) {
      previous.setDisabled()
    }
    if (count <= 5) {
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
