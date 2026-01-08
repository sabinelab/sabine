import { GuildSchema } from '@db'
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
  options: [
    {
      type: 2,
      name: 'add',
      nameLocalizations: {
        'pt-BR': 'adicionar'
      },
      description: 'Add a tournament',
      descriptionLocalizations: {
        'pt-BR': 'Adicione um torneio'
      },
      options: [
        {
          type: 1,
          name: 'valorant',
          description: 'Add a VALORANT tournament',
          descriptionLocalizations: {
            'pt-BR': 'Adicione um torneio de VALORANT'
          },
          options: [
            {
              type: 3,
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
            {
              type: 7,
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
            {
              type: 7,
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
          ]
        },
        {
          type: 1,
          name: 'lol',
          description: 'Add a League of Legends tournament',
          descriptionLocalizations: {
            'pt-BR': 'Adicione um torneio de League of Legends'
          },
          options: [
            {
              type: 3,
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
            {
              type: 7,
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
            {
              type: 7,
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
          ]
        }
      ]
    },
    {
      type: 2,
      name: 'remove',
      nameLocalizations: {
        'pt-BR': 'remover'
      },
      description: 'Remove a tournament',
      descriptionLocalizations: {
        'pt-BR': 'Remove um torneio'
      },
      options: [
        {
          type: 1,
          name: 'valorant',
          description: 'Remove a VALORANT tournament',
          descriptionLocalizations: {
            'pt-BR': 'Remova um torneio de VALORANT'
          },
          options: [
            {
              type: 3,
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
          ]
        },
        {
          type: 1,
          name: 'lol',
          description: 'Remove a League of Legends tournament',
          descriptionLocalizations: {
            'pt-BR': 'Remova um torneio de League of Legends'
          },
          options: [
            {
              type: 3,
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
          ]
        }
      ]
    }
  ],
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
  async run({ ctx, id, t, app }) {
    if (ctx.args[0].toString() === 'add') {
      const games = {
        valorant: async () => {
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
            ctx.db.guild.tournaments_length
          )
            return ctx.reply('commands.tournament.limit_reached', {
              cmd: `</tournament remove valorant:${id}>`
            })

          if (ctx.args[3].toString() === ctx.args[4].toString())
            return ctx.reply('commands.tournament.channels_must_be_different')

          if (
            ctx.guild.channels.cache.get(ctx.args[3].toString())?.type !== 0 ||
            ctx.guild.channels.cache.get(ctx.args[4].toString())?.type !== 0
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
                    name: ctx.args[2].toString(),
                    channel1: ctx.args[3].toString(),
                    channel2: ctx.args[4].toString(),
                    type: 'valorant'
                  }
                ]
              }
            },
            create: {
              events: {
                create: [
                  {
                    name: ctx.args[2].toString(),
                    channel1: ctx.args[3].toString(),
                    channel2: ctx.args[4].toString(),
                    type: 'valorant'
                  }
                ]
              },
              id: ctx.db.guild.id
            }
          })
          await ctx.reply('commands.tournament.tournament_added', {
            t: ctx.args[2].toString()
          })
        },
        lol: async () => {
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
            ctx.db.guild.tournaments_length
          )
            return ctx.reply('commands.tournament.limit_reached', {
              cmd: `</tournament remove lol:${id}>`
            })
          if (ctx.args[3].toString() === ctx.args[4].toString())
            return ctx.reply('commands.tournament.channels_must_be_different')
          if (
            ctx.guild.channels.cache.get(ctx.args[3].toString())?.type !== 0 ||
            ctx.guild.channels.cache.get(ctx.args[4].toString())?.type !== 0
          )
            return ctx.reply('commands.tournament.invalid_channel')

          await app.prisma.guild.upsert({
            where: {
              id: guild.id
            },
            update: {
              events: {
                create: [
                  {
                    name: ctx.args[2].toString(),
                    channel1: ctx.args[3].toString(),
                    channel2: ctx.args[4].toString(),
                    type: 'lol'
                  }
                ]
              }
            },
            create: {
              id: ctx.db.guild.id,
              events: {
                create: [
                  {
                    name: ctx.args[2].toString(),
                    channel1: ctx.args[3].toString(),
                    channel2: ctx.args[4].toString(),
                    type: 'lol'
                  }
                ]
              }
            }
          })
          await ctx.reply('commands.tournament.tournament_added', {
            t: ctx.args[2].toString()
          })
        }
      }

      await games[ctx.args[1].toString() as 'valorant' | 'lol']()
    } else {
      const games = {
        valorant: async () => {
          if (!ctx.db.guild) return

          if (ctx.args[2].toString() === t('commands.tournament.remove_all')) {
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
                    name: ctx.args[2].toString()
                  }
                }
              }
            })
          }

          await ctx.reply('commands.tournament.tournament_removed', {
            t: ctx.args[2].toString()
          })
        },
        lol: async () => {
          if (!ctx.db.guild) return
          if (ctx.args[2].toString() === t('commands.tournament.remove_all')) {
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
                    name: ctx.args[2].toString()
                  }
                }
              }
            })
          }

          await ctx.reply('commands.tournament.tournament_removed', {
            t: ctx.args[2].toString()
          })
        }
      }

      await games[ctx.args[1].toString() as 'valorant' | 'lol']()
    }
  },
  async createAutocompleteInteraction({ i, t, args, app }) {
    if (!args || !i.guild) return

    const value = i.options.getString('tournament', true)

    if (args[1] === 'valorant') {
      const res = await service.getEvents('valorant')

      res.unshift({
        name: 'Valorant Game Changers'
      })

      res.unshift({
        name: 'Valorant Challengers League'
      })

      res.unshift({
        name: 'Valorant Champions Tour'
      })

      const events = res
        .filter(e => e.status !== 'completed')
        .map(e => e.name)
        .filter(e => e.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 25)

      const actions = {
        add: async () => {
          await i.respond(events.map(e => ({ name: e, value: e })))
        },
        remove: async () => {
          const guild = await app.prisma.guild.findUnique({
            where: {
              id: i.guild!.id
            },
            include: {
              events: {
                where: {
                  type: 'valorant'
                }
              }
            }
          })

          if (!guild) return

          const events = guild.events
            .map(e => e.name)
            .filter(e => e.toLowerCase().includes(value.toLowerCase()))

          events.unshift(t('commands.tournament.remove_all'))

          await i.respond(events.map(e => ({ name: e, value: e })))
        }
      }

      await actions[args[0] as 'add' | 'remove']()
    } else {
      const res = await service.getEvents('lol')

      const events = res
        .map(e => e.name)
        .filter(e => e.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 25)

      const actions = {
        add: async () => {
          await i.respond(events.map(e => ({ name: e, value: e })))
        },
        remove: async () => {
          const guild = await app.prisma.guild.findUnique({
            where: {
              id: i.guild!.id
            },
            include: {
              events: {
                where: {
                  type: 'valorant'
                }
              }
            }
          })

          if (!guild) return

          const events = guild.events
            .filter(e => e.type === 'lol')
            .map(e => e.name)
            .filter(e => e.toLowerCase().includes(value.toLowerCase()))

          events.unshift(t('commands.tournament.remove_all'))

          await i.respond(events.map(e => ({ name: e, value: e })))
        }
      }

      await actions[args[0] as 'add' | 'remove']()
    }
  }
})
