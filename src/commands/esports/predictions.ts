import ButtonBuilder from '../../structures/builders/ButtonBuilder'
import EmbedBuilder from '../../structures/builders/EmbedBuilder'
import createCommand from '../../structures/command/createCommand'

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
  options: [
    {
      type: 1,
      name: 'valorant',
      description: 'Shows your VALORANT predictions',
      descriptionLocalizations: {
        'pt-BR': 'Mostra seus palpites de VALORANT'
      },
      options: [
        {
          type: 4,
          name: 'page',
          nameLocalizations: {
            'pt-BR': 'página'
          },
          description: 'Insert the page',
          descriptionLocalizations: {
            'pt-BR': 'Insira a página'
          }
        }
      ]
    },
    {
      type: 1,
      name: 'lol',
      description: 'Shows your League of Legends predictions',
      descriptionLocalizations: {
        'pt-BR': 'Mostra seus palpites de League of Legends'
      },
      options: [
        {
          type: 4,
          name: 'page',
          nameLocalizations: {
            'pt-BR': 'página'
          },
          description: 'Insert the page',
          descriptionLocalizations: {
            'pt-BR': 'Insira a página'
          }
        }
      ]
    }
  ],
  syntax: 'predictions <page>',
  examples: [
    'predictions valorant',
    'precitions lol',
    'predictions valorant 1',
    'predictions lol 2',
    'predictions valorant 5'
  ],
  userInstall: true,
  async run({ ctx, t, app }) {
    if (ctx.args[0] === 'valorant') {
      const predictions = await app.prisma.prediction.findMany({
        where: {
          game: 'valorant',
          profile: {
            userId: ctx.db.profile.id,
            guildId: ctx.db.guild.id
          }
        },
        include: {
          teams: true
        }
      })
      if (!predictions.length) {
        return await ctx.reply('commands.predictions.no_predictions')
      }
      let preds = predictions.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      const page = !ctx.args[1] ? 1 : Number(ctx.args[1])
      const pages = Math.ceil(preds.length / 5)
      if (page === 1) preds = preds.slice(0, 5)
      else preds = preds.slice(page * 5 - 5, page * 5)
      if (!preds.length) {
        return await ctx.reply('commands.predictions.no_pages')
      }
      const embed = new EmbedBuilder()
        .setAuthor({
          name: t('commands.predictions.embed.author'),
          iconURL: ctx.interaction.user.displayAvatarURL({ size: 2048 })
        })
        .setDesc(
          t('commands.predictions.embed.desc', {
            correct: ctx.db.profile.correct_predictions,
            wrong: ctx.db.profile.incorrect_predictions,
            t: predictions.length
          })
        )
        .setFooter({
          text: t('commands.predictions.embed.footer', {
            p1: Number.isNaN(page) ? 1 : page,
            p2: pages
          })
        })
      for (const prediction of preds) {
        let status: string
        let odd = ''
        if (prediction.status === 'correct') {
          status = '<:success:1300882212190945292>'
        } else if (prediction.status === 'incorrect') {
          status = '<:error:1300882259078938685>'
        } else {
          status = '<a:carregando:809221866434199634>'
        }
        if (prediction.odd) {
          odd += `\nOdd: \`${prediction.odd}x\``
        }
        const timestamp = (prediction.created_at.getTime() / 1000).toFixed(0)
        embed.addField(
          `${prediction.teams[0].name} <:versus:1349105624180330516> ${prediction.teams[1].name} (<t:${timestamp}:d> <t:${timestamp}:t> | <t:${timestamp}:R>)`,
          t('commands.predictions.embed.field', {
            score1: prediction.teams[0].score,
            score2: prediction.teams[1].score,
            link: `https://www.vlr.gg/${prediction.match}`,
            status
          }) + odd
        )
      }
      const previous = new ButtonBuilder()
        .setEmoji('1404176223621611572')
        .setCustomId(`predictions;${ctx.interaction.user.id};${page - 1 < 1 ? 1 : page - 1};previous;valorant`)
        .defineStyle('blue')
      const next = new ButtonBuilder()
        .setEmoji('1404176291829121028')
        .setCustomId(`predictions;${ctx.interaction.user.id};${page + 1 > pages ? pages : page + 1};next;valorant`)
        .defineStyle('blue')
      if (page <= 1) previous.setDisabled()
      if (page >= pages) next.setDisabled()
      await ctx.reply({
        embeds: [embed],
        components: [
          {
            type: 1,
            components: [previous, next]
          }
        ]
      })
    } else {
      const predictions = await app.prisma.prediction.findMany({
        where: {
          game: 'lol',
          profile: {
            userId: ctx.db.profile.id,
            guildId: ctx.db.guild.id
          }
        },
        include: {
          teams: true
        }
      })
      if (!predictions.length) {
        return await ctx.reply('commands.predictions.no_predictions')
      }
      let preds = predictions.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      const page = !ctx.args[1] ? 1 : Number(ctx.args[1])
      const pages = Math.ceil(predictions.length / 5)
      if (page === 1) preds = preds.slice(0, 5)
      else preds = preds.slice(page * 5 - 5, page * 5)
      if (!preds.length) {
        return await ctx.reply('commands.predictions.no_pages')
      }
      const embed = new EmbedBuilder()
        .setAuthor({
          name: t('commands.predictions.embed.author'),
          iconURL: ctx.interaction.user.displayAvatarURL({ size: 2048 })
        })
        .setDesc(
          t('commands.predictions.embed.desc', {
            correct: ctx.db.profile.correct_predictions,
            wrong: ctx.db.profile.incorrect_predictions,
            t: predictions.length
          })
        )
        .setFooter({
          text: t('commands.predictions.embed.footer', {
            p1: Number.isNaN(page) ? 1 : page,
            p2: pages
          })
        })
      for (const prediction of preds) {
        let status: string
        let odd = ''
        if (prediction.status === 'correct') {
          status = '<:success:1300882212190945292>'
        } else if (prediction.status === 'incorrect') {
          status = '<:error:1300882259078938685>'
        } else {
          status = '<a:carregando:809221866434199634>'
        }
        if (prediction.odd) {
          odd += `\nOdd: \`${prediction.odd}x\``
        }
        const timestamp = (prediction.created_at.getTime() / 1000).toFixed(0)
        embed.addField(
          `${prediction.teams[0].name} <:versus:1349105624180330516> ${prediction.teams[1].name} (<t:${timestamp}:d> <t:${timestamp}:t> | <t:${timestamp}:R>)`,
          t('commands.predictions.embed.field', {
            score1: prediction.teams[0].score,
            score2: prediction.teams[1].score,
            link: `https://www.loltv.gg/match/${prediction.match}`,
            status
          }) + odd
        )
      }
      const previous = new ButtonBuilder()
        .setEmoji('1404176223621611572')
        .setCustomId(`predictions;${ctx.interaction.user.id};${page - 1 < 1 ? 1 : page - 1};previous;lol`)
        .defineStyle('blue')
      const next = new ButtonBuilder()
        .setEmoji('1404176291829121028')
        .setCustomId(`predictions;${ctx.interaction.user.id};${page + 1 > pages ? pages : page + 1};next;lol`)
        .defineStyle('blue')
      if (page <= 1) previous.setDisabled()
      if (page >= pages) next.setDisabled()
      await ctx.reply({
        embeds: [embed],
        components: [
          {
            type: 1,
            components: [previous, next]
          }
        ]
      })
    }
  },
  async createMessageComponentInteraction({ ctx, t, app }) {
    if (ctx.args[4] === 'valorant') {
      const predictions = await app.prisma.prediction.findMany({
        where: {
          game: 'valorant',
          profile: {
            userId: ctx.db.profile.id,
            guildId: ctx.db.guild.id
          }
        },
        include: {
          teams: true
        }
      })

      if (!predictions.length) {
        return await ctx.reply('commands.predictions.no_predictions')
      }

      let preds = predictions.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())

      const page = Number(ctx.args[2])
      const pages = Math.ceil(predictions.length / 5)

      preds = preds.slice(page * 5 - 5, page * 5)

      if (!preds.length) {
        return await ctx.reply('commands.predictions.no_pages')
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: t('commands.predictions.embed.author'),
          iconURL: ctx.interaction.user.displayAvatarURL({ size: 2048 })
        })
        .setDesc(
          t('commands.predictions.embed.desc', {
            correct: ctx.db.profile.correct_predictions,
            wrong: ctx.db.profile.incorrect_predictions,
            t: predictions.length
          })
        )
        .setFooter({
          text: t('commands.predictions.embed.footer', {
            p1: Number.isNaN(page) ? 1 : page,
            p2: pages
          })
        })

      for (const prediction of preds) {
        let status: string
        let odd = ''

        if (prediction.status === 'correct') {
          status = '<:success:1300882212190945292>'
        } else if (prediction.status === 'incorrect') {
          status = '<:error:1300882259078938685>'
        } else {
          status = '<a:carregando:809221866434199634>'
        }
        if (prediction.odd) {
          odd += `\nOdd: \`${prediction.odd}x\``
        }

        const timestamp = (prediction.created_at.getTime() / 1000).toFixed(0)
        embed.addField(
          `${prediction.teams[0].name} <:versus:1349105624180330516> ${prediction.teams[1].name} (<t:${timestamp}:d> <t:${timestamp}:t> | <t:${timestamp}:R>)`,
          t('commands.predictions.embed.field', {
            score1: prediction.teams[0].score,
            score2: prediction.teams[1].score,
            link: `https://www.vlr.gg/${prediction.match}`,
            status
          }) + odd
        )
      }
      const previous = new ButtonBuilder()
        .setEmoji('1404176223621611572')
        .defineStyle('blue')
        .setCustomId(`${ctx.args[0]};${ctx.args[1]};${page - 1};previous;valorant`)

      const next = new ButtonBuilder()
        .setEmoji('1404176291829121028')
        .defineStyle('blue')
        .setCustomId(`${ctx.args[0]};${ctx.args[1]};${page + 1};next;valorant`)

      if (page <= 1) previous.setDisabled()
      if (page >= pages) next.setDisabled()

      await ctx.edit({
        embeds: [embed],
        components: [
          {
            type: 1,
            components: [previous, next]
          }
        ]
      })
    } else {
      const predictions = await app.prisma.prediction.findMany({
        where: {
          game: 'valorant',
          profile: {
            userId: ctx.db.profile.id,
            guildId: ctx.db.guild.id
          }
        },
        include: {
          teams: true
        }
      })

      if (!predictions.length) {
        return await ctx.reply('commands.predictions.no_predictions')
      }

      let preds = predictions.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())

      const page = Number(ctx.args[2])
      const pages = Math.ceil(predictions.length / 5)

      preds = preds.slice(page * 5 - 5, page * 5)

      if (!preds.length) {
        return await ctx.reply('commands.predictions.no_pages')
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: t('commands.predictions.embed.author'),
          iconURL: ctx.interaction.user.displayAvatarURL({ size: 2048 })
        })
        .setDesc(
          t('commands.predictions.embed.desc', {
            correct: ctx.db.profile.correct_predictions,
            wrong: ctx.db.profile.incorrect_predictions,
            t: predictions.length
          })
        )
        .setFooter({
          text: t('commands.predictions.embed.footer', {
            p1: Number.isNaN(page) ? 1 : page,
            p2: pages
          })
        })

      for (const prediction of preds) {
        let status: string
        let odd = ''

        if (prediction.status === 'correct') {
          status = '<:success:1300882212190945292>'
        } else if (prediction.status === 'incorrect') {
          status = '<:error:1300882259078938685>'
        } else {
          status = '<a:carregando:809221866434199634>'
        }
        if (prediction.odd) {
          odd += `\nOdd: \`${prediction.odd}x\``
        }

        const timestamp = (prediction.created_at.getTime() / 1000).toFixed(0)

        embed.addField(
          `${prediction.teams[0].name} <:versus:1349105624180330516> ${prediction.teams[1].name} (<t:${timestamp}:d> <t:${timestamp}:t> | <t:${timestamp}:R>)`,
          t('commands.predictions.embed.field', {
            score1: prediction.teams[0].score,
            score2: prediction.teams[1].score,
            link: `https://www.loltv.gg/match/${prediction.match}`,
            status
          }) + odd
        )
      }
      const previous = new ButtonBuilder()
        .setEmoji('1404176223621611572')
        .defineStyle('blue')
        .setCustomId(`${ctx.args[0]};${ctx.args[1]};${page - 1};previous;lol`)

      const next = new ButtonBuilder()
        .setEmoji('1404176291829121028')
        .defineStyle('blue')
        .setCustomId(`${ctx.args[0]};${ctx.args[1]};${page + 1};next;lol`)

      if (page <= 1) previous.setDisabled()
      if (page >= pages) next.setDisabled()

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
  }
})
