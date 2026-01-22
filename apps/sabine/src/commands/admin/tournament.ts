import { GuildSchema } from '@db'
import { ApplicationCommandOptionType } from 'discord.js'
import { env } from '@/env'
import Service from '../../api'
import createCommand from '../../structures/command/createCommand'

const service = new Service(env.AUTH)

export default createCommand({
  name: 'tournament',
  category: 'admin',
  nameLocalizations: {
    'pt-BR': 'torneio'
  },
  description: 'Add or remove tournaments, manage it, and more',
  descriptionLocalizations: {
    'pt-BR': 'Adicione ou remova torneios, gerencie-os, e mais'
  },
  args: {
    add: {
      type: ApplicationCommandOptionType.SubcommandGroup,
      name: 'add',
      nameLocalizations: {
        'pt-BR': 'adicionar'
      },
      description: 'Add a tournament',
      descriptionLocalizations: {
        'pt-BR': 'Adicione um torneio'
      },
      args: {
        valorant: {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'valorant',
          description: 'Add a VALORANT tournament',
          descriptionLocalizations: {
            'pt-BR': 'Adicione um torneio de VALORANT'
          },
          args: {
            tournament: {
              type: ApplicationCommandOptionType.String,
              name: 'tournament',
              nameLocalizations: {
                'pt-BR': 'torneio'
              },
              description: 'Enter a tournament',
              descriptionLocalizations: {
                'pt-BR': 'Informe o torneio'
              },
              autocomplete: true,
              required: true
            },
            matches_channel: {
              type: ApplicationCommandOptionType.Channel,
              name: 'matches_channel',
              nameLocalizations: {
                'pt-BR': 'canal_de_partidas'
              },
              description: 'Enter a channel',
              descriptionLocalizations: {
                'pt-BR': 'Informe o canal'
              },
              required: true
            },
            results_channel: {
              type: ApplicationCommandOptionType.Channel,
              name: 'results_channel',
              nameLocalizations: {
                'pt-BR': 'canal_de_resultados'
              },
              description: 'Enter a channel',
              descriptionLocalizations: {
                'pt-BR': 'Informe o canal'
              },
              required: true
            }
          }
        },
        lol: {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'lol',
          description: 'Add a League of Legends tournament',
          descriptionLocalizations: {
            'pt-BR': 'Adicione um torneio de League of Legends'
          },
          args: {
            tournament: {
              type: ApplicationCommandOptionType.String,
              name: 'tournament',
              nameLocalizations: {
                'pt-BR': 'torneio'
              },
              description: 'Enter a tournament',
              descriptionLocalizations: {
                'pt-BR': 'Informe o torneio'
              },
              autocomplete: true,
              required: true
            },
            matches_channel: {
              type: ApplicationCommandOptionType.Channel,
              name: 'matches_channel',
              nameLocalizations: {
                'pt-BR': 'canal_de_partidas'
              },
              description: 'Enter a channel',
              descriptionLocalizations: {
                'pt-BR': 'Informe o canal'
              },
              required: true
            },
            results_channel: {
              type: ApplicationCommandOptionType.Channel,
              name: 'results_channel',
              nameLocalizations: {
                'pt-BR': 'canal_de_resultados'
              },
              description: 'Enter a channel',
              descriptionLocalizations: {
                'pt-BR': 'Informe o canal'
              },
              required: true
            }
          }
        }
      }
    },
    remove: {
      type: ApplicationCommandOptionType.SubcommandGroup,
      name: 'remove',
      nameLocalizations: {
        'pt-BR': 'remover'
      },
      description: 'Remove a tournament',
      descriptionLocalizations: {
        'pt-BR': 'Remove um torneio'
      },
      args: {
        valorant: {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'valorant',
          description: 'Remove a VALORANT tournament',
          descriptionLocalizations: {
            'pt-BR': 'Remova um torneio de VALORANT'
          },
          args: {
            tournament: {
              type: ApplicationCommandOptionType.String,
              name: 'tournament',
              nameLocalizations: {
                'pt-BR': 'torneio'
              },
              description: 'Enter a tournament',
              descriptionLocalizations: {
                'pt-BR': 'Informe o torneio'
              },
              autocomplete: true,
              required: true
            }
          }
        },
        lol: {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'lol',
          description: 'Remove a League of Legends tournament',
          descriptionLocalizations: {
            'pt-BR': 'Remova um torneio de League of Legends'
          },
          args: {
            tournament: {
              type: ApplicationCommandOptionType.String,
              name: 'tournament',
              nameLocalizations: {
                'pt-BR': 'torneio'
              },
              description: 'Enter a tournament',
              descriptionLocalizations: {
                'pt-BR': 'Informe o torneio'
              },
              autocomplete: true,
              required: true
            }
          }
        }
      }
    }
  },
  permissions: ['ManageGuild', 'ManageChannels'],
  botPermissions: ['ManageMessages', 'SendMessages'],
  syntaxes: [
    'tournament add valorant [tournament] [matches_channel] [results_channel]',
    'tournament add lol [tournament] [matches_channel] [results_channel]',
    'tournament remove valorant [tournament]',
    'tournament remove lol [tournament]'
  ],
  examples: [
    'tournament add valorant VCT Americas #matches #results',
    'tournament add lol Worlds #matches #results',
    'tournament remove valorant VCT Americas',
    'tournament remove lol Worlds'
  ],
  async run({ ctx, app, t, id }) {
    if (ctx.args.add) {
      if (ctx.args.add.valorant) {
        const { tournament, matches_channel, results_channel } = ctx.args.add.valorant

        if (!ctx.db.guild || !ctx.guild) return

        const guild =
          (await app.prisma.guild.findUnique({
            where: {
              id: ctx.db.guild.id
            },
            include: {
              events: true
            }
          })) ?? new GuildSchema(ctx.db.guild.id)

        if (
          guild.events.filter(e => e.type === 'lol').length +
            guild.events.filter(e => e.type === 'valorant').length >=
          ctx.db.guild.tournamentsLength
        )
          return ctx.reply('commands.tournament.limit_reached', {
            cmd: `</tournament remove valorant:${id}>`
          })

        if (matches_channel.toString() === results_channel.toString())
          return ctx.reply('commands.tournament.channels_must_be_different')

        if (
          ctx.guild.channels.cache.get(matches_channel.toString())?.type !== 0 ||
          ctx.guild.channels.cache.get(results_channel.toString())?.type !== 0
        ) {
          return ctx.reply('commands.tournament.invalid_channel')
        }

        await app.prisma.guild.upsert({
          where: {
            id: guild.id
          },
          update: {
            events: {
              create: [
                {
                  name: tournament,
                  channel1: matches_channel.id,
                  channel2: results_channel.id,
                  type: 'valorant'
                }
              ]
            }
          },
          create: {
            events: {
              create: [
                {
                  name: tournament,
                  channel1: matches_channel.id,
                  channel2: results_channel.id,
                  type: 'valorant'
                }
              ]
            },
            id: ctx.db.guild.id
          }
        })
        await ctx.reply('commands.tournament.tournament_added', {
          t: tournament
        })
      } else if (ctx.args.add.lol) {
        const { tournament, matches_channel, results_channel } = ctx.args.add.lol

        if (!ctx.db.guild || !ctx.guild) return

        const guild =
          (await app.prisma.guild.findUnique({
            where: {
              id: ctx.db.guild.id
            },
            include: {
              events: true
            }
          })) ?? new GuildSchema(ctx.db.guild.id)

        if (
          guild.events.filter(e => e.type === 'lol').length +
            guild.events.filter(e => e.type === 'valorant').length >=
          ctx.db.guild.tournamentsLength
        )
          return ctx.reply('commands.tournament.limit_reached', {
            cmd: `</tournament remove lol:${id}>`
          })

        if (matches_channel.toString() === results_channel.toString())
          return ctx.reply('commands.tournament.channels_must_be_different')

        if (
          ctx.guild.channels.cache.get(matches_channel.toString())?.type !== 0 ||
          ctx.guild.channels.cache.get(results_channel.toString())?.type !== 0
        ) {
          return ctx.reply('commands.tournament.invalid_channel')
        }

        await app.prisma.guild.upsert({
          where: {
            id: guild.id
          },
          update: {
            events: {
              create: [
                {
                  name: tournament,
                  channel1: matches_channel.id,
                  channel2: results_channel.id,
                  type: 'lol'
                }
              ]
            }
          },
          create: {
            events: {
              create: [
                {
                  name: tournament,
                  channel1: matches_channel.toString(),
                  channel2: results_channel.toString(),
                  type: 'lol'
                }
              ]
            },
            id: ctx.db.guild.id
          }
        })
        await ctx.reply('commands.tournament.tournament_added', {
          t: tournament
        })
      }
    } else if (ctx.args.remove) {
      if (ctx.args.remove.valorant) {
        const { tournament } = ctx.args.remove.valorant

        if (!ctx.db.guild) return

        if (tournament === t('commands.tournament.remove_all')) {
          const guild = await app.prisma.guild.findUnique({
            where: {
              id: ctx.db.guild.id
            }
          })

          if (guild) {
            await app.prisma.guild.update({
              where: {
                id: ctx.db.guild.id
              },
              data: {
                events: {
                  deleteMany: {
                    type: 'valorant'
                  }
                }
              }
            })
          }

          return await ctx.reply('commands.tournament.tournament_removed')
        }

        const guild = await app.prisma.guild.findUnique({
          where: {
            id: ctx.db.guild.id
          }
        })

        if (guild) {
          await app.prisma.guild.update({
            where: {
              id: ctx.db.guild.id
            },
            data: {
              events: {
                deleteMany: {
                  type: 'valorant',
                  name: tournament
                }
              }
            }
          })
        }

        await ctx.reply('commands.tournament.tournament_removed', {
          t: tournament
        })
      } else if (ctx.args.remove.lol) {
        const { tournament } = ctx.args.remove.lol

        if (!ctx.db.guild) return

        if (tournament === t('commands.tournament.remove_all')) {
          const guild = await app.prisma.guild.findUnique({
            where: {
              id: ctx.db.guild.id
            }
          })

          if (guild) {
            await app.prisma.guild.update({
              where: {
                id: ctx.db.guild.id
              },
              data: {
                events: {
                  deleteMany: {
                    type: 'lol'
                  }
                }
              }
            })
          }

          return await ctx.reply('commands.tournament.tournament_removed')
        }

        const guild = await app.prisma.guild.findUnique({
          where: {
            id: ctx.db.guild.id
          }
        })

        if (guild) {
          await app.prisma.guild.update({
            where: {
              id: ctx.db.guild.id
            },
            data: {
              events: {
                deleteMany: {
                  type: 'lol',
                  name: tournament
                }
              }
            }
          })
        }

        await ctx.reply('commands.tournament.tournament_removed', {
          t: tournament
        })
      }
    }
  },
  async createAutocompleteInteraction({ i, t, app }) {
    const focused = i.options.getFocused(true)
    const sub = i.options.getSubcommand(false) // 'valorant' or 'lol'
    const group = i.options.getSubcommandGroup(false) // 'add' or 'remove'

    if (!group || !sub) return []

    const game = sub as 'valorant' | 'lol'

    if (focused.name === 'tournament') {
      if (group === 'add') {
        const tournaments = await service.getEvents(game)

        tournaments.unshift({
          name: 'Valorant Game Changers'
        })

        tournaments.unshift({
          name: 'Valorant Challengers League'
        })

        tournaments.unshift({
          name: 'Valorant Champions Tour'
        })

        return await i.respond(
          tournaments
            .filter(e => e.status !== 'completed')
            .filter(e => e.name.toLowerCase().includes(focused.value.toLowerCase()))
            .map(e => ({ name: e.name, value: e.name }))
            .slice(0, 25)
        )
      } else if (group === 'remove') {
        const guild = await app.prisma.guild.findUnique({
          where: {
            id: i.guild!.id
          },
          include: {
            events: true
          }
        })

        if (!guild) return []

        const events = guild.events
          .filter(e => e.type === game)
          .map(e => e.name)
          .filter(e => e.toLowerCase().includes(focused.value.toLowerCase()))

        events.unshift(t('commands.tournament.remove_all'))

        return await i.respond(events.map(e => ({ name: e, value: e })).slice(0, 25))
      }
    }
  }
})
