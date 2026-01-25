import { prisma } from '@db'
import { ApplicationCommandOptionType } from 'discord.js'
import createCommand from '../../structures/command/createCommand'

export default createCommand({
  name: 'news',
  category: 'admin',
  nameLocalizations: {
    'pt-BR': 'noticias'
  },
  description: 'Manage news feature',
  descriptionLocalizations: {
    'pt-BR': 'Gerencie a funcionalidade de notícias'
  },
  args: {
    enable: {
      type: ApplicationCommandOptionType.SubcommandGroup,
      name: 'enable',
      nameLocalizations: {
        'pt-BR': 'habilitar'
      },
      description: 'Enable news feature',
      descriptionLocalizations: {
        'pt-BR': 'Habilitar'
      },
      args: {
        valorant: {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'valorant',
          description: 'Enable VALORANT news feature',
          descriptionLocalizations: {
            'pt-BR': 'Habilita a funcionalidade de notícias de VALORANT'
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
          description: 'Enable League of Legends news feature',
          descriptionLocalizations: {
            'pt-BR': 'Habilita a funcionalidade de notícias de League of Legends'
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
      description: 'Disable news feature',
      descriptionLocalizations: {
        'pt-BR': 'Desabilitar a funcionalidade de notícias'
      },
      args: {
        valorant: {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'valorant',
          description: 'Disable VALORANT news feature',
          descriptionLocalizations: {
            'pt-BR': 'Desabilita a funcionalidade de notícias de VALORANT'
          }
        },
        lol: {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'lol',
          description: 'Disable League of Legends news feature',
          descriptionLocalizations: {
            'pt-BR': 'Desabilita a funcionalidade de notícias de League of Legends'
          }
        }
      }
    }
  },
  permissions: ['ManageChannels'],
  syntaxes: [
    'news enable valorant [channel]',
    'news enable lol [channel]',
    'news disable valorant',
    'news disable lol'
  ],
  examples: [
    'news enable valorant #news',
    'news enable lol #lol-news',
    'news disable valorant',
    'news disable lol'
  ],
  async run({ ctx }) {
    if (ctx.args.enable) {
      const games = {
        valorant: async () => {
          if (!ctx.guild || !ctx.db.guild) return

          const channel = ctx.guild.channels.cache.get(ctx.args.enable?.valorant?.channel.id ?? '')!

          if (![0, 5].some(t => t === channel.type))
            return await ctx.reply('commands.news.invalid_channel')

          await prisma.guild.update({
            where: {
              id: ctx.guild.id
            },
            data: {
              valorantNewsChannel: channel.id
            }
          })
          await ctx.reply('commands.news.news_enabled', { ch: channel.toString() })
        },
        lol: async () => {
          if (!ctx.guild || !ctx.db.guild) return

          const channel = ctx.guild.channels.cache.get(ctx.args.enable?.lol?.channel.id ?? '')!

          if (![0, 5].some(t => t === channel.type))
            return await ctx.reply('commands.news.invalid_channel')

          await prisma.guild.update({
            where: {
              id: ctx.guild.id
            },
            data: {
              lolNewsChannel: channel.id
            }
          })
          await ctx.reply('commands.news.news_enabled', { ch: channel.toString() })
        }
      }

      const game = Object.keys(ctx.args.enable)[0] as 'valorant' | 'lol'
      await games[game]()
    } else {
      const games = {
        valorant: async () => {
          if (!ctx.db.guild) return

          await prisma.guild.update({
            where: {
              id: ctx.db.guild.id
            },
            data: {
              valorantNewsChannel: null
            }
          })
          await ctx.reply('commands.news.news_disabled')
        },
        lol: async () => {
          if (!ctx.db.guild) return

          await prisma.guild.update({
            where: {
              id: ctx.db.guild.id
            },
            data: {
              lolNewsChannel: null
            }
          })
          await ctx.reply('commands.news.news_disabled')
        }
      }

      if (ctx.args.disable) {
        const game = Object.keys(ctx.args.disable)[0] as 'valorant' | 'lol'
        await games[game]()
      }
    }
  }
})
