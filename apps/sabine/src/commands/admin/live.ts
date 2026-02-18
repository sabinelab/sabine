import { prisma } from '@db'
import { ApplicationCommandOptionType } from 'discord.js'
import createCommand from '../../structures/command/createCommand'

export default createCommand({
  name: 'live',
  category: 'admin',
  description: 'Manage lvie feed feature',
  descriptionLocalizations: {
    'pt-BR': 'Gerencie a funcionalidade de transmissão ao vivo'
  },
  args: {
    enable: {
      type: ApplicationCommandOptionType.SubcommandGroup,
      name: 'enable',
      nameLocalizations: {
        'pt-BR': 'habilitar'
      },
      description: 'Enable live feed feature',
      descriptionLocalizations: {
        'pt-BR': 'Habilita a funcionalidade de transmissão aivo'
      },
      args: {
        valorant: {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'valorant',
          description: 'Enable VALORANT live feed feature',
          descriptionLocalizations: {
            'pt-BR': 'Habilita a funcionalidade de transmissão ao vivo de VALORANT'
          },
          args: {
            channel: {
              type: ApplicationCommandOptionType.Channel,
              name: 'channel',
              nameLocalizations: {
                'pt-BR': 'canal'
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
          description: 'Enable League of Legends live feed feature',
          descriptionLocalizations: {
            'pt-BR': 'Habilita a funcionalidade de transmissão ao vivo de League of Legends'
          },
          args: {
            channel: {
              type: ApplicationCommandOptionType.Channel,
              name: 'channel',
              nameLocalizations: {
                'pt-BR': 'canal'
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
    disable: {
      type: ApplicationCommandOptionType.SubcommandGroup,
      name: 'disable',
      nameLocalizations: {
        'pt-BR': 'desabilitar'
      },
      description: 'Disable live feed feature',
      descriptionLocalizations: {
        'pt-BR': 'Desabilitar a funcionalidade de transmissão ao vivo'
      },
      args: {
        valorant: {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'valorant',
          description: 'Disable VALORANT live feed feature',
          descriptionLocalizations: {
            'pt-BR': 'Desabilita a funcionalidade de transmissão ao vivo de VALORANT'
          }
        },
        lol: {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'lol',
          description: 'Disable League of Legends live feed feature',
          descriptionLocalizations: {
            'pt-BR': 'Desabilita a funcionalidade de transmissão ao vivo de League of Legends'
          }
        }
      }
    }
  },
  permissions: ['ManageChannels'],
  syntaxes: [
    'live enable valorant [channel]',
    'live enable lol [channel]',
    'live disable valorant',
    'live disable lol'
  ],
  examples: [
    'live enable valorant #live-feed',
    'live enable lol #lol-live',
    'live disable valorant',
    'live disable lol'
  ],
  async run({ ctx }) {
    if (!ctx.db.guild) return

    if (ctx.args.enable) {
      const games = {
        valorant: async () => {
          const channel = ctx.args.enable?.valorant?.channel

          if (!channel || ![0, 5].some(t => t === channel.type)) {
            return await ctx.reply('commands.live.invalid_channel')
          }

          await prisma.guild.upsert({
            where: {
              id: ctx.db.guild.id
            },
            update: {
              valorantLiveFeedChannel: channel.id
            },
            create: {
              id: ctx.db.guild.id,
              valorantLiveFeedChannel: channel.id
            }
          })
          await ctx.reply('commands.live.live_enabled', { ch: channel.toString() })
        },
        lol: async () => {
          const channel = ctx.args.enable?.valorant?.channel

          if (!channel || ![0, 5].some(t => t === channel.type)) {
            return await ctx.reply('commands.live.invalid_channel')
          }

          await prisma.guild.upsert({
            where: {
              id: ctx.db.guild.id
            },
            update: {
              lolLiveFeedChannel: channel.id
            },
            create: {
              id: ctx.db.guild.id,
              lolLiveFeedChannel: channel.id
            }
          })
          await ctx.reply('commands.live.live_enabled', { ch: channel.toString() })
        }
      }

      const game = Object.keys(ctx.args.enable)[0] as 'valorant' | 'lol'
      await games[game]()
    } else {
      const games = {
        valorant: async () => {
          await prisma.guild.upsert({
            where: {
              id: ctx.db.guild.id
            },
            update: {
              valorantLiveFeedChannel: null
            },
            create: {
              id: ctx.db.guild.id
            }
          })
          await ctx.reply('commands.live.live_disabled')
        },
        lol: async () => {
          await prisma.guild.upsert({
            where: {
              id: ctx.db.guild.id
            },
            update: {
              lolLiveFeedChannel: null
            },
            create: {
              id: ctx.db.guild.id
            }
          })
          await ctx.reply('commands.live.live_disabled')
        }
      }

      if (ctx.args.disable) {
        const game = Object.keys(ctx.args.disable)[0] as 'valorant' | 'lol'
        await games[game]()
      }
    }
  }
})
