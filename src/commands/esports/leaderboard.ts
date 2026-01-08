import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js'
import EmbedBuilder from '../../structures/builders/EmbedBuilder'
import createCommand from '../../structures/command/createCommand'

export default createCommand({
  name: 'leaderboard',
  nameLocalizations: {
    'pt-BR': 'tabela'
  },
  category: 'esports',
  description: 'Leaderboard of users with most correct predictions, rating and poisons',
  descriptionLocalizations: {
    'pt-BR': 'Tabela de usuários com mais palpites corretos, classificação e toxinas'
  },
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'predictions',
      nameLocalizations: {
        'pt-BR': 'palpites'
      },
      description: 'The leaderboard of predictions',
      descriptionLocalizations: {
        'pt-BR': 'Tabela de palpites'
      },
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'page',
          nameLocalizations: {
            'pt-BR': 'página'
          },
          description: 'Insert the page',
          descriptionLocalizations: {
            'pt-BR': 'Informe a página'
          }
        }
      ]
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'poisons',
      nameLocalizations: {
        'pt-BR': 'toxinas'
      },
      description: 'The leaderboard of poisons',
      descriptionLocalizations: {
        'pt-BR': 'Tabela de toxinas'
      },
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'page',
          nameLocalizations: {
            'pt-BR': 'página'
          },
          description: 'Insert the page',
          descriptionLocalizations: {
            'pt-BR': 'Informe a página'
          }
        }
      ]
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'rating',
      nameLocalizations: {
        'pt-BR': 'classificação'
      },
      description: 'The leaderboard of rating',
      descriptionLocalizations: {
        'pt-BR': 'Tabela de classificação'
      },
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'page',
          nameLocalizations: {
            'pt-BR': 'página'
          },
          description: 'Insert the page',
          descriptionLocalizations: {
            'pt-BR': 'Informe a página'
          }
        }
      ]
    }
  ],
  syntax: 'leaderboard predictions/poisons/rating <page>',
  examples: ['leaderboard predictions 1', 'leaderboard poisons 2', 'leaderboard rating 3'],
  isThinking: true,
  messageComponentInteractionTime: 10 * 60 * 1000,
  async run({ ctx, app }) {
    if (ctx.args[0] === 'poisons') {
      let profiles = await app.prisma.profile.findMany({
        where: {
          guildId: ctx.db.guild.id,
          poisons: {
            gt: 0
          }
        },
        orderBy: {
          poisons: 'desc'
        },
        take: 100,
        select: {
          userId: true,
          poisons: true
        }
      })

      const array = profiles
      const page = Number(ctx.args[1]) || 1
      const pages = Math.ceil(array.length / 10)

      profiles = profiles.slice(page * 10 - 10, page * 10)

      if (!profiles.length) {
        return await ctx.reply('commands.leaderboard.no_users')
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: ctx.t('commands.leaderboard.poisons.author', {
            page,
            pages
          })
        })
        .setTitle(ctx.t('commands.leaderboard.poisons.title'))
        .setThumb((await app.getUser(array[0].userId)).displayAvatarURL({ size: 2048 }))
        .setDesc(
          profiles
            .map((profile, i) => {
              const position = (page - 1) * 10 + i + 1
              const pos =
                position === 1
                  ? '🥇'
                  : position === 2
                    ? '🥈'
                    : position === 3
                      ? '🥉'
                      : `#${position}`

              return profile.userId === ctx.db.profile.userId
                ? ctx.t('commands.leaderboard.poisons.description1', {
                    pos,
                    user: `<@${profile.userId}>`,
                    poisons: profile.poisons.toLocaleString()
                  })
                : ctx.t('commands.leaderboard.poisons.description2', {
                    pos,
                    user: `<@${profile.userId}>`,
                    poisons: profile.poisons.toLocaleString()
                  })
            })
            .join('\n')
        )

      const pos = array.findIndex(p => p.userId === ctx.db.profile.userId) + 1
      if (pos) {
        embed.setFooter({
          text: ctx.t('commands.leaderboard.predictions.footer', { pos })
        })
      }

      const previous = new ButtonBuilder()
        .setEmoji('1404176223621611572')
        .setCustomId(`leaderboard;${ctx.interaction.user.id};poisons;previous;${page - 1}`)
        .setStyle(ButtonStyle.Primary)

      const next = new ButtonBuilder()
        .setEmoji('1404176291829121028')
        .setCustomId(`leaderboard;${ctx.interaction.user.id};poisons;next;${page + 1}`)
        .setStyle(ButtonStyle.Primary)

      if (page <= 1) {
        previous.setDisabled()
      }
      if (page >= pages) {
        next.setDisabled()
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(previous, next)

      await ctx.reply({
        embeds: [embed],
        components: [row]
      })
    } else if (ctx.args[0] === 'rating') {
      let profiles = await app.prisma.profile.findMany({
        where: {
          guildId: ctx.db.guild.id,
          rank_rating: {
            gt: 0
          }
        },
        orderBy: {
          rank_rating: 'desc'
        },
        take: 100,
        select: {
          userId: true,
          rank_rating: true
        }
      })

      const array = profiles
      const page = Number(ctx.args[1]) || 1
      const pages = Math.ceil(array.length / 10)

      profiles = profiles.slice(page * 10 - 10, page * 10)

      if (!profiles.length) {
        return await ctx.reply('commands.leaderboard.no_users')
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: ctx.t('commands.leaderboard.rating.author', {
            page,
            pages
          })
        })
        .setTitle(ctx.t('commands.leaderboard.rating.title'))
        .setThumb((await app.getUser(array[0].userId)).displayAvatarURL({ size: 2048 }))
        .setDesc(
          profiles
            .map((profile, i) => {
              const position = (page - 1) * 10 + i + 1
              const pos =
                position === 1
                  ? '🥇'
                  : position === 2
                    ? '🥈'
                    : position === 3
                      ? '🥉'
                      : `#${position}`

              return profile.userId === ctx.db.profile.userId
                ? ctx.t('commands.leaderboard.rating.description1', {
                    pos,
                    user: `<@${profile.userId}>`,
                    rr: profile.rank_rating
                  })
                : ctx.t('commands.leaderboard.rating.description2', {
                    pos,
                    user: `<@${profile.userId}>`,
                    rr: profile.rank_rating
                  })
            })
            .join('\n')
        )

      const pos = array.findIndex(p => p.userId === ctx.db.profile.userId) + 1
      if (pos) {
        embed.setFooter({
          text: ctx.t('commands.leaderboard.predictions.footer', { pos })
        })
      }

      const previous = new ButtonBuilder()
        .setEmoji('1404176223621611572')
        .setCustomId(`leaderboard;${ctx.interaction.user.id};rating;previous;${page - 1}`)
        .setStyle(ButtonStyle.Primary)

      const next = new ButtonBuilder()
        .setEmoji('1404176291829121028')
        .setCustomId(`leaderboard;${ctx.interaction.user.id};rating;next;${page + 1}`)
        .setStyle(ButtonStyle.Primary)

      if (page <= 1) {
        previous.setDisabled()
      }
      if (page >= pages) {
        next.setDisabled()
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(previous, next)

      await ctx.reply({
        embeds: [embed],
        components: [row]
      })
    }
    else if (ctx.args[0] === 'predictions') {
      let profiles = await app.prisma.profile.findMany({
        where: {
          guildId: ctx.db.guild.id,
          correct_predictions: {
            gt: 0
          }
        },
        orderBy: {
          correct_predictions: 'desc'
        },
        take: 100,
        select: {
          userId: true,
          correct_predictions: true
        }
      })

      const array = profiles
      const page = Number(ctx.args[1]) || 1
      const pages = Math.ceil(array.length / 10)

      profiles = profiles.slice(page * 10 - 10, page * 10)

      if (!profiles.length) {
        return await ctx.reply('commands.leaderboard.no_users')
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: ctx.t('commands.leaderboard.predictions.author', {
            page,
            pages
          })
        })
        .setTitle(ctx.t('commands.leaderboard.predictions.title'))
        .setThumb((await app.getUser(array[0].userId)).displayAvatarURL({ size: 2048 }))
        .setDesc(
          profiles
            .map((profile, i) => {
              const position = (page - 1) * 10 + i + 1
              const pos =
                position === 1
                  ? '🥇'
                  : position === 2
                    ? '🥈'
                    : position === 3
                      ? '🥉'
                      : `#${position}`

              return profile.userId === ctx.db.profile.userId
                ? ctx.t('commands.leaderboard.predictions.description1', {
                    pos,
                    user: `<@${profile.userId}>`,
                    predictions: profile.correct_predictions
                  })
                : ctx.t('commands.leaderboard.predictions.description2', {
                    pos,
                    user: `<@${profile.userId}>`,
                    predictions: profile.correct_predictions
                  })
            })
            .join('\n')
        )

      const pos = array.findIndex(p => p.userId === ctx.db.profile.userId) + 1
      if (pos) {
        embed.setFooter({
          text: ctx.t('commands.leaderboard.predictions.footer', { pos })
        })
      }

      const previous = new ButtonBuilder()
        .setEmoji('1404176223621611572')
        .setCustomId(`leaderboard;${ctx.interaction.user.id};predictions;previous;${page - 1}`)
        .setStyle(ButtonStyle.Primary)

      const next = new ButtonBuilder()
        .setEmoji('1404176291829121028')
        .setCustomId(`leaderboard;${ctx.interaction.user.id};predictions;next;${page + 1}`)
        .setStyle(ButtonStyle.Primary)

      if (page <= 1) {
        previous.setDisabled()
      }
      if (page >= pages) {
        next.setDisabled()
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(previous, next)

      await ctx.reply({
        embeds: [embed],
        components: [row]
      })
    }
  },
  async createMessageComponentInteraction({ ctx, app }) {
    if (ctx.args[2] === 'poisons') {
      let profiles = await app.prisma.profile.findMany({
        where: {
          guildId: ctx.db.guild.id,
          poisons: {
            gt: 0
          }
        },
        orderBy: {
          poisons: 'desc'
        },
        take: 100,
        select: {
          userId: true,
          poisons: true
        }
      })

      const array = profiles
      const page = Number(ctx.args[4]) || 1
      const pages = Math.ceil(array.length / 10)

      profiles = profiles.slice(page * 10 - 10, page * 10)

      if (!profiles.length) {
        return await ctx.reply('commands.leaderboard.no_users')
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: ctx.t('commands.leaderboard.poisons.author', {
            page,
            pages
          })
        })
        .setTitle(ctx.t('commands.leaderboard.poisons.title'))
        .setThumb((await app.getUser(array[0].userId)).displayAvatarURL({ size: 2048 }))
        .setDesc(
          profiles
            .map((profile, i) => {
              const position = (page - 1) * 10 + i + 1
              const pos =
                position === 1
                  ? '🥇'
                  : position === 2
                    ? '🥈'
                    : position === 3
                      ? '🥉'
                      : `#${position}`

              return profile.userId === ctx.db.profile.userId
                ? ctx.t('commands.leaderboard.poisons.description1', {
                    pos,
                    user: `<@${profile.userId}>`,
                    poisons: profile.poisons.toLocaleString()
                  })
                : ctx.t('commands.leaderboard.poisons.description2', {
                    pos,
                    user: `<@${profile.userId}>`,
                    poisons: profile.poisons.toLocaleString()
                  })
            })
            .join('\n')
        )

      const pos = array.findIndex(p => p.userId === ctx.db.profile.userId) + 1
      if (pos) {
        embed.setFooter({
          text: ctx.t('commands.leaderboard.predictions.footer', { pos })
        })
      }

      const previous = new ButtonBuilder()
        .setEmoji('1404176223621611572')
        .setCustomId(`leaderboard;${ctx.interaction.user.id};poisons;previous;${page - 1}`)
        .setStyle(ButtonStyle.Primary)

      const next = new ButtonBuilder()
        .setEmoji('1404176291829121028')
        .setCustomId(`leaderboard;${ctx.interaction.user.id};poisons;next;${page + 1}`)
        .setStyle(ButtonStyle.Primary)

      if (page <= 1) {
        previous.setDisabled()
      }
      if (page >= pages) {
        next.setDisabled()
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(previous, next)

      await ctx.edit({
        embeds: [embed],
        components: [row]
      })
    }
    else if (ctx.args[2] === 'rating') {
      let profiles = await app.prisma.profile.findMany({
        where: {
          guildId: ctx.db.guild.id,
          rank_rating: {
            gt: 0
          }
        },
        orderBy: {
          rank_rating: 'desc'
        },
        take: 100,
        select: {
          userId: true,
          rank_rating: true
        }
      })

      const array = profiles
      const page = Number(ctx.args[4]) || 1
      const pages = Math.ceil(array.length / 10)

      profiles = profiles.slice(page * 10 - 10, page * 10)

      if (!profiles.length) {
        return await ctx.reply('commands.leaderboard.no_users')
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: ctx.t('commands.leaderboard.rating.author', {
            page,
            pages
          })
        })
        .setTitle(ctx.t('commands.leaderboard.rating.title'))
        .setThumb((await app.getUser(array[0].userId)).displayAvatarURL({ size: 2048 }))
        .setDesc(
          profiles
            .map((profile, i) => {
              const position = (page - 1) * 10 + i + 1
              const pos =
                position === 1
                  ? '🥇'
                  : position === 2
                    ? '🥈'
                    : position === 3
                      ? '🥉'
                      : `#${position}`

              return profile.userId === ctx.db.profile.userId
                ? ctx.t('commands.leaderboard.rating.description1', {
                    pos,
                    user: `<@${profile.userId}>`,
                    rr: profile.rank_rating
                  })
                : ctx.t('commands.leaderboard.rating.description2', {
                    pos,
                    user: `<@${profile.userId}>`,
                    rr: profile.rank_rating
                  })
            })
            .join('\n')
        )

      const pos = array.findIndex(p => p.userId === ctx.db.profile.userId) + 1
      if (pos) {
        embed.setFooter({
          text: ctx.t('commands.leaderboard.predictions.footer', { pos })
        })
      }

      const previous = new ButtonBuilder()
        .setEmoji('1404176223621611572')
        .setCustomId(`leaderboard;${ctx.interaction.user.id};rating;previous;${page - 1}`)
        .setStyle(ButtonStyle.Primary)

      const next = new ButtonBuilder()
        .setEmoji('1404176291829121028')
        .setCustomId(`leaderboard;${ctx.interaction.user.id};rating;next;${page + 1}`)
        .setStyle(ButtonStyle.Primary)

      if (page <= 1) {
        previous.setDisabled()
      }
      if (page >= pages) {
        next.setDisabled()
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(previous, next)

      await ctx.edit({
        embeds: [embed],
        components: [row]
      })
    }
    else if (ctx.args[2] === 'predictions') {
      let profiles = await app.prisma.profile.findMany({
        where: {
          guildId: ctx.db.guild.id,
          correct_predictions: {
            gt: 0
          }
        },
        orderBy: {
          correct_predictions: 'desc'
        },
        take: 100,
        select: {
          userId: true,
          correct_predictions: true
        }
      })

      const array = profiles
      const page = Number(ctx.args[4]) || 1
      const pages = Math.ceil(array.length / 10)

      profiles = profiles.slice(page * 10 - 10, page * 10)

      if (!profiles.length) {
        return await ctx.reply('commands.leaderboard.no_users')
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: ctx.t('commands.leaderboard.predictions.author', {
            page,
            pages
          })
        })
        .setTitle(ctx.t('commands.leaderboard.predictions.title'))
        .setThumb((await app.getUser(array[0].userId)).displayAvatarURL({ size: 2048 }))
        .setDesc(
          profiles
            .map((profile, i) => {
              const position = (page - 1) * 10 + i + 1
              const pos =
                position === 1
                  ? '🥇'
                  : position === 2
                    ? '🥈'
                    : position === 3
                      ? '🥉'
                      : `#${position}`

              return profile.userId === ctx.db.profile.userId
                ? ctx.t('commands.leaderboard.predictions.description1', {
                    pos,
                    user: `<@${profile.userId}>`,
                    predictions: profile.correct_predictions
                  })
                : ctx.t('commands.leaderboard.predictions.description2', {
                    pos,
                    user: `<@${profile.userId}>`,
                    predictions: profile.correct_predictions
                  })
            })
            .join('\n')
        )

      const pos = array.findIndex(p => p.userId === ctx.db.profile.userId) + 1
      if (pos) {
        embed.setFooter({
          text: ctx.t('commands.leaderboard.predictions.footer', { pos })
        })
      }

      const previous = new ButtonBuilder()
        .setEmoji('1404176223621611572')
        .setCustomId(`leaderboard;${ctx.interaction.user.id};predictions;previous;${page - 1}`)
        .setStyle(ButtonStyle.Primary)

      const next = new ButtonBuilder()
        .setEmoji('1404176291829121028')
        .setCustomId(`leaderboard;${ctx.interaction.user.id};predictions;next;${page + 1}`)
        .setStyle(ButtonStyle.Primary)

      if (page <= 1) {
        previous.setDisabled()
      }
      if (page >= pages) {
        next.setDisabled()
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(previous, next)

      await ctx.edit({
        embeds: [embed],
        components: [row]
      })
    }
  }
})
