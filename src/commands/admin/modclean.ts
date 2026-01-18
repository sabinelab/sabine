import { prisma } from '@db'
import { ApplicationCommandOptionType, ButtonStyle } from 'discord.js'
import ButtonBuilder from '@/structures/builders/ButtonBuilder'
import createCommand from '@/structures/command/createCommand'

export default createCommand({
  name: 'modclean',
  description: 'Reset predictions, matches, career, poisons, and more',
  descriptionLocalizations: {
    'pt-BR': 'Resete palpites, partidas, carreira, toxinas e mais'
  },
  category: 'admin',
  syntaxes: [
    'modclean all',
    'modclean balance',
    'modclean simulator',
    'modclean predictions',
    'modclean stats'
  ],
  args: {
    all: {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'all',
      nameLocalizations: {
        'pt-BR': 'tudo'
      },
      description:
        "Reset users' predictions, matches, career, poisons, cards, packs, claims, and more",
      descriptionLocalizations: {
        'pt-BR': 'Redefine palpites, partidas, carreira, toxinas, cartas, pacotes, claims e mais'
      }
    },
    balance: {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'balance',
      nameLocalizations: {
        'pt-BR': 'saldo'
      },
      description: "Reset server users' poisons and fates",
      descriptionLocalizations: {
        'pt-BR': 'Redefine as toxinas e destinos dos usuários do servidor'
      }
    },
    simulator: {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'simulator',
      nameLocalizations: {
        'pt-BR': 'simulador'
      },
      description:
        "Reset server users' roster, career, claims, wins/defeats, poisons, fates and more",
      descriptionLocalizations: {
        'pt-BR': 'Redefine o elenco, carreira, claims, vitórias/derrotas, toxinas, destinos e mais'
      }
    },
    predictions: {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'predictions',
      nameLocalizations: {
        'pt-BR': 'palpites'
      },
      description: "Reset server users' predictions",
      descriptionLocalizations: {
        'pt-BR': 'Redefine os palpites dos usuários do servidor'
      }
    },
    stats: {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'stats',
      nameLocalizations: {
        'pt-BR': 'estatísticas'
      },
      description: "Reset server users' wins/defeats and correct/incorrect predictions",
      descriptionLocalizations: {
        'pt-BR':
          'Redefine as vitórias/derrotas e palpites corretos/incorretos dos usuários do servidor'
      }
    }
  },
  permissions: ['Administrator'],
  messageComponentInteractionTime: 30_000,
  async run({ ctx }) {
    const sub = Object.keys(ctx.args)[0]
    const button = new ButtonBuilder()
      .setStyle(ButtonStyle.Danger)
      .setLabel(ctx.t('commands.modclean.button'))
      .setCustomId(`modclean;${ctx.db.profile.userId};${sub}`)
      .build(
        ctx.t('commands.modclean.content', {
          type: ctx.t(`commands.modclean.type.${sub}`),
          time: `<t:${Math.floor((Date.now() + 60_000) / 1000)}:R>`
        })
      )

    await ctx.reply(button)
  },
  async createMessageComponentInteraction({ ctx }) {
    await ctx.edit({
      components: [
        {
          type: 1,
          components: [
            new ButtonBuilder()
              .setDisabled()
              .setEmoji('809221866434199634', true)
              .setStyle(ButtonStyle.Danger)
              .setCustomId(Date.now().toString())
          ]
        }
      ]
    })

    switch (ctx.args[2]) {
      case 'all':
        {
          try {
            await prisma.$transaction([
              prisma.profile.updateMany({
                where: {
                  guildId: ctx.db.guild.id
                },
                data: {
                  correctPredictions: 0,
                  incorrectPredictions: 0,
                  arenaDefeats: 0,
                  rankedDefeats: 0,
                  unrankedDefeats: 0,
                  swiftplayDefeats: 0,
                  rankedSwiftplayDefeats: 0,
                  arenaWins: 0,
                  rankedWins: 0,
                  unrankedWins: 0,
                  swiftplayWins: 0,
                  rankedSwiftplayWins: 0,
                  pity: 0,
                  claims: 0,
                  fates: 0,
                  rankRating: 0,
                  goldPacks: 0,
                  ironPacks: 0,
                  bronzePacks: 0,
                  silverPacks: 0,
                  diamondPacks: 0,
                  radiantPacks: 0,
                  immortalPacks: 0,
                  ascendantPacks: 0,
                  platinumPacks: 0,
                  poisons: 0,
                  dailyTime: null,
                  claimTime: null
                }
              }),
              prisma.match.deleteMany({
                where: {
                  profile: {
                    guildId: ctx.db.guild.id
                  }
                }
              }),
              prisma.prediction.deleteMany({
                where: {
                  profile: {
                    guildId: ctx.db.guild.id
                  }
                }
              }),
              prisma.transaction.deleteMany({
                where: {
                  profile: {
                    guildId: ctx.db.guild.id
                  }
                }
              })
            ])

            await ctx.edit('commands.modclean.reseted', {
              type: ctx.t(`commands.modclean.type.${ctx.args[2]}`)
            })
          } catch (e) {
            await ctx.edit('helper.error', { e: e as Error })
          }
        }
        break
      case 'balance':
        {
          try {
            await prisma.profile.updateMany({
              where: {
                guildId: ctx.db.guild.id
              },
              data: {
                poisons: 0,
                fates: 0
              }
            })

            await ctx.edit('commands.modclean.reseted', {
              type: ctx.t(`commands.modclean.type.${ctx.args[2]}`)
            })
          } catch (e) {
            await ctx.edit('helper.error', { e: e as Error })
          }
        }
        break
      case 'predictions':
        {
          try {
            await prisma.$transaction([
              prisma.profile.updateMany({
                where: {
                  guildId: ctx.db.guild.id
                },
                data: {
                  correctPredictions: 0,
                  incorrectPredictions: 0
                }
              }),
              prisma.prediction.deleteMany({
                where: {
                  profile: {
                    guildId: ctx.db.guild.id
                  }
                }
              })
            ])

            await ctx.edit('commands.modclean.reseted', {
              type: ctx.t(`commands.modclean.type.${ctx.args[2]}`)
            })
          } catch (e) {
            await ctx.edit('helper.error', { e: e as Error })
          }
        }
        break
      case 'simulator':
        {
          try {
            await prisma.$transaction([
              prisma.profile.updateMany({
                where: {
                  guildId: ctx.db.guild.id
                },
                data: {
                  arenaDefeats: 0,
                  rankedDefeats: 0,
                  unrankedDefeats: 0,
                  swiftplayDefeats: 0,
                  rankedSwiftplayDefeats: 0,
                  arenaWins: 0,
                  rankedWins: 0,
                  unrankedWins: 0,
                  swiftplayWins: 0,
                  rankedSwiftplayWins: 0,
                  pity: 0,
                  claims: 0,
                  fates: 0,
                  rankRating: 0,
                  goldPacks: 0,
                  ironPacks: 0,
                  bronzePacks: 0,
                  silverPacks: 0,
                  diamondPacks: 0,
                  radiantPacks: 0,
                  immortalPacks: 0,
                  ascendantPacks: 0,
                  platinumPacks: 0,
                  poisons: 0,
                  dailyTime: null,
                  claimTime: null
                }
              }),
              prisma.match.deleteMany({
                where: {
                  profile: {
                    guildId: ctx.db.guild.id
                  }
                }
              }),
              prisma.transaction.deleteMany({
                where: {
                  profile: {
                    guildId: ctx.db.guild.id
                  }
                }
              })
            ])

            await ctx.edit('commands.modclean.reseted', {
              type: ctx.t(`commands.modclean.type.${ctx.args[2]}`)
            })
          } catch (e) {
            await ctx.edit('helper.error', { e: e as Error })
          }
        }
        break
      case 'stats': {
        try {
          await prisma.$transaction([
            prisma.profile.updateMany({
              where: {
                guildId: ctx.db.guild.id
              },
              data: {
                arenaDefeats: 0,
                rankedDefeats: 0,
                unrankedDefeats: 0,
                swiftplayDefeats: 0,
                rankedSwiftplayDefeats: 0,
                arenaWins: 0,
                rankedWins: 0,
                unrankedWins: 0,
                swiftplayWins: 0,
                rankedSwiftplayWins: 0,
                claimTime: null,
                dailyTime: null,
                correctPredictions: 0,
                incorrectPredictions: 0
              }
            }),
            prisma.match.deleteMany({
              where: {
                profile: {
                  guildId: ctx.db.guild.id
                }
              }
            }),
            prisma.prediction.deleteMany({
              where: {
                profile: {
                  guildId: ctx.db.guild.id
                }
              }
            })
          ])

          await ctx.edit('commands.modclean.reseted', {
            type: ctx.t(`commands.modclean.type.${ctx.args[2]}`)
          })
        } catch (e) {
          await ctx.edit('helper.error', { e: e as Error })
        }
      }
    }
  }
})
