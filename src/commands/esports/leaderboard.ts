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
      const page = Number(ctx.args[1]) || 1
      const profiles = await app.prisma.profile.findMany({
        where: {
          guildId: ctx.db.guild.id,
          poisons: {
            gt: 0
          }
        },
        orderBy: {
          poisons: 'desc'
        },
        skip: (page - 1) * 10,
        take: 11,
        select: {
          userId: true,
          poisons: true
        }
      })

      if (!profiles.length) {
        return await ctx.reply('commands.leaderboard.no_users')
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: ctx.t('commands.leaderboard.poisons.author', {
            page
          })
        })
        .setTitle(ctx.t('commands.leaderboard.poisons.title'))
        .setThumb((await app.getUser(profiles[0].userId)).displayAvatarURL({ size: 2048 }))
        .setDesc(
          profiles
            .slice(0, 10)
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

      let pos: number | null = null

      if (ctx.db.profile.poisons) {
        pos =
          (await app.prisma.profile.count({
            where: {
              guildId: ctx.db.guild.id,
              OR: [
                {
                  poisons: {
                    gt: ctx.db.profile.poisons
                  }
                },
                {
                  poisons: ctx.db.profile.poisons,
                  userId: {
                    lt: ctx.db.profile.userId
                  }
                }
              ]
            }
          })) + 1
      }

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
      if (profiles.length <= 10) {
        next.setDisabled()
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(previous, next)

      await ctx.reply({
        embeds: [embed],
        components: [row]
      })
    } else if (ctx.args[0] === 'rating') {
      const page = Number(ctx.args[1]) || 1
      const profiles = await app.prisma.profile.findMany({
        where: {
          guildId: ctx.db.guild.id,
          rankRating: {
            gt: 0
          }
        },
        orderBy: {
          rankRating: 'desc'
        },
        skip: (page - 1) * 10,
        take: 11,
        select: {
          userId: true,
          rankRating: true
        }
      })

      if (!profiles.length) {
        return await ctx.reply('commands.leaderboard.no_users')
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: ctx.t('commands.leaderboard.rating.author', {
            page
          })
        })
        .setTitle(ctx.t('commands.leaderboard.rating.title'))
        .setThumb((await app.getUser(profiles[0].userId)).displayAvatarURL({ size: 2048 }))
        .setDesc(
          profiles
            .slice(0, 10)
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
                    rr: profile.rankRating
                  })
                : ctx.t('commands.leaderboard.rating.description2', {
                    pos,
                    user: `<@${profile.userId}>`,
                    rr: profile.rankRating
                  })
            })
            .join('\n')
        )

      let pos: number | null = null

      if (ctx.db.profile.rankRating) {
        pos =
          (await app.prisma.profile.count({
            where: {
              guildId: ctx.db.guild.id,
              OR: [
                {
                  rankRating: {
                    gt: ctx.db.profile.rankRating
                  }
                },
                {
                  rankRating: ctx.db.profile.rankRating,
                  userId: {
                    lt: ctx.db.profile.userId
                  }
                }
              ]
            }
          })) + 1
      }

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
      if (profiles.length <= 10) {
        next.setDisabled()
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(previous, next)

      await ctx.reply({
        embeds: [embed],
        components: [row]
      })
    } else if (ctx.args[0] === 'predictions') {
      const page = Number(ctx.args[1]) || 1
      const profiles = await app.prisma.profile.findMany({
        where: {
          guildId: ctx.db.guild.id,
          correctPredictions: {
            gt: 0
          }
        },
        orderBy: {
          correctPredictions: 'desc'
        },
        skip: (page - 1) * 10,
        take: 11,
        select: {
          userId: true,
          correctPredictions: true
        }
      })

      if (!profiles.length) {
        return await ctx.reply('commands.leaderboard.no_users')
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: ctx.t('commands.leaderboard.predictions.author', {
            page
          })
        })
        .setTitle(ctx.t('commands.leaderboard.predictions.title'))
        .setThumb((await app.getUser(profiles[0].userId)).displayAvatarURL({ size: 2048 }))
        .setDesc(
          profiles
            .slice(0, 10)
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
                    predictions: profile.correctPredictions
                  })
                : ctx.t('commands.leaderboard.predictions.description2', {
                    pos,
                    user: `<@${profile.userId}>`,
                    predictions: profile.correctPredictions
                  })
            })
            .join('\n')
        )

      let pos: number | null = null

      if (ctx.db.profile.rankRating) {
        pos =
          (await app.prisma.profile.count({
            where: {
              guildId: ctx.db.guild.id,
              OR: [
                {
                  rankRating: {
                    gt: ctx.db.profile.rankRating
                  }
                },
                {
                  rankRating: ctx.db.profile.rankRating,
                  userId: {
                    lt: ctx.db.profile.userId
                  }
                }
              ]
            }
          })) + 1
      }

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
      if (profiles.length <= 10) {
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
      const page = Number(ctx.args[4]) || 1
      const profiles = await app.prisma.profile.findMany({
        where: {
          guildId: ctx.db.guild.id,
          poisons: {
            gt: 0
          }
        },
        orderBy: {
          poisons: 'desc'
        },
        skip: (page - 1) * 10,
        take: 11,
        select: {
          userId: true,
          poisons: true
        }
      })

      if (!profiles.length) {
        return await ctx.reply('commands.leaderboard.no_users')
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: ctx.t('commands.leaderboard.poisons.author', {
            page
          })
        })
        .setTitle(ctx.t('commands.leaderboard.poisons.title'))
        .setThumb((await app.getUser(profiles[0].userId)).displayAvatarURL({ size: 2048 }))
        .setDesc(
          profiles
            .slice(0, 10)
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

      let pos: number | null = null

      if (ctx.db.profile.poisons) {
        pos =
          (await app.prisma.profile.count({
            where: {
              guildId: ctx.db.guild.id,
              OR: [
                {
                  poisons: {
                    gt: ctx.db.profile.poisons
                  }
                },
                {
                  poisons: ctx.db.profile.poisons,
                  userId: {
                    lt: ctx.db.profile.userId
                  }
                }
              ]
            }
          })) + 1
      }

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
      if (profiles.length <= 10) {
        next.setDisabled()
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(previous, next)

      await ctx.edit({
        embeds: [embed],
        components: [row]
      })
    } else if (ctx.args[2] === 'rating') {
      const page = Number(ctx.args[4]) || 1
      const profiles = await app.prisma.profile.findMany({
        where: {
          guildId: ctx.db.guild.id,
          rankRating: {
            gt: 0
          }
        },
        orderBy: {
          rankRating: 'desc'
        },
        skip: (page - 1) * 10,
        take: 11,
        select: {
          userId: true,
          rankRating: true
        }
      })

      if (!profiles.length) {
        return await ctx.reply('commands.leaderboard.no_users')
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: ctx.t('commands.leaderboard.rating.author', {
            page
          })
        })
        .setTitle(ctx.t('commands.leaderboard.rating.title'))
        .setThumb((await app.getUser(profiles[0].userId)).displayAvatarURL({ size: 2048 }))
        .setDesc(
          profiles
            .slice(0, 10)
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
                    rr: profile.rankRating
                  })
                : ctx.t('commands.leaderboard.rating.description2', {
                    pos,
                    user: `<@${profile.userId}>`,
                    rr: profile.rankRating
                  })
            })
            .join('\n')
        )

      let pos: number | null = null

      if (ctx.db.profile.rankRating) {
        pos =
          (await app.prisma.profile.count({
            where: {
              guildId: ctx.db.guild.id,
              OR: [
                {
                  rankRating: {
                    gt: ctx.db.profile.rankRating
                  }
                },
                {
                  rankRating: ctx.db.profile.rankRating,
                  userId: {
                    lt: ctx.db.profile.userId
                  }
                }
              ]
            }
          })) + 1
      }

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
      if (profiles.length <= 10) {
        next.setDisabled()
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(previous, next)

      await ctx.edit({
        embeds: [embed],
        components: [row]
      })
    } else if (ctx.args[2] === 'predictions') {
      const page = Number(ctx.args[4]) || 1
      const profiles = await app.prisma.profile.findMany({
        where: {
          guildId: ctx.db.guild.id,
          correctPredictions: {
            gt: 0
          }
        },
        orderBy: {
          correctPredictions: 'desc'
        },
        skip: (page - 1) * 10,
        take: 11,
        select: {
          userId: true,
          correctPredictions: true
        }
      })

      if (!profiles.length) {
        return await ctx.reply('commands.leaderboard.no_users')
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: ctx.t('commands.leaderboard.predictions.author', {
            page
          })
        })
        .setTitle(ctx.t('commands.leaderboard.predictions.title'))
        .setThumb((await app.getUser(profiles[0].userId)).displayAvatarURL({ size: 2048 }))
        .setDesc(
          profiles
            .slice(0, 10)
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
                    predictions: profile.correctPredictions
                  })
                : ctx.t('commands.leaderboard.predictions.description2', {
                    pos,
                    user: `<@${profile.userId}>`,
                    predictions: profile.correctPredictions
                  })
            })
            .join('\n')
        )

      let pos: number | null = null

      if (ctx.db.profile.rankRating) {
        pos =
          (await app.prisma.profile.count({
            where: {
              guildId: ctx.db.guild.id,
              OR: [
                {
                  rankRating: {
                    gt: ctx.db.profile.rankRating
                  }
                },
                {
                  rankRating: ctx.db.profile.rankRating,
                  userId: {
                    lt: ctx.db.profile.userId
                  }
                }
              ]
            }
          })) + 1
      }

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
      if (profiles.length <= 10) {
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
