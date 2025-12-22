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
  options: [
    {
      type: 2,
      name: 'enable',
      nameLocalizations: {
        'pt-BR': 'habilitar'
      },
      description: 'Enable live feed feature',
      descriptionLocalizations: {
        'pt-BR': 'Habilita a funcionalidade de transmissão aivo'
      },
      options: [
        {
          type: 1,
          name: 'valorant',
          description: 'Enable VALORANT live feed feature',
          descriptionLocalizations: {
            'pt-BR': 'Habilita a funcionalidade de transmissão ao vivo de VALORANT'
          },
          options: [
            {
              type: 7,
              name: 'channel',
              nameLocalizations: {
                'pt-BR': 'canal'
              },
              description: 'Enter a channel',
              descriptionLocalizations: {
                'pt-BR': 'Informe o canal'
              },
              required: true
            },
            {
              type: ApplicationCommandOptionType.Boolean,
              name: 'spam',
              description: 'Select whether you want the bot to spam messages from live matches or not',
              descriptionLocalizations: {
                'pt-BR': 'Selecione se você deseja que bot envie mensagens de spam de partidas ao vivo ou não'
              }
            }
          ]
        },
        {
          type: 1,
          name: 'lol',
          description: 'Enable League of Legends live feed feature',
          descriptionLocalizations: {
            'pt-BR': 'Habilita a funcionalidade de transmissão ao vivo de League of Legends'
          },
          options: [
            {
              type: 7,
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
          ]
        }
      ]
    },
    {
      type: 2,
      name: 'disable',
      nameLocalizations: {
        'pt-BR': 'desabilitar'
      },
      description: 'Disable live feed feature',
      descriptionLocalizations: {
        'pt-BR': 'Desabilitar a funcionalidade de transmissão ao vivo'
      },
      options: [
        {
          type: 1,
          name: 'valorant',
          description: 'Disable VALORANT live feed feature',
          descriptionLocalizations: {
            'pt-BR': 'Desabilita a funcionalidade de transmissão ao vivo de VALORANT'
          }
        },
        {
          type: 1,
          name: 'lol',
          description: 'Disable League of Legends live feed feature',
          descriptionLocalizations: {
            'pt-BR': 'Desabilita a funcionalidade de transmissão ao vivo de League of Legends'
          }
        }
      ]
    }
  ],
  permissions: ['ManageChannels'],
  async run({ ctx }) {
    if (!ctx.db.guild) return

    if (ctx.args[0] === 'enable') {
      const games = {
        valorant: async () => {
          if (!ctx.guild || !ctx.db.guild) return

          const channel = ctx.guild.channels.cache.get(ctx.args[2].toString())!

          if (![0, 5].some(t => t === channel.type)) return await ctx.reply('commands.live.invalid_channel')

          await prisma.guild.update({
            where: {
              id: ctx.db.guild.id
            },
            data: {
              valorant_live_feed_channel: channel.id
            }
          })
          await ctx.reply('commands.live.live_enabled', { ch: channel.toString() })
        },
        lol: async () => {
          if (!ctx.guild || !ctx.db.guild) return

          const channel = ctx.guild.channels.cache.get(ctx.args[2].toString())!

          if (![0, 5].some(t => t === channel.type)) return await ctx.reply('commands.live.invalid_channel')

          await prisma.guild.update({
            where: {
              id: ctx.db.guild.id
            },
            data: {
              lol_live_feed_channel: channel.id
            }
          })
          await ctx.reply('commands.live.live_enabled', { ch: channel.toString() })
        }
      }

      await games[ctx.args[1] as 'valorant' | 'lol']()
    } else {
      const games = {
        valorant: async () => {
          if (!ctx.db.guild) return

          await prisma.guild.update({
            where: {
              id: ctx.db.guild.id
            },
            data: {
              valorant_live_feed_channel: null
            }
          })
          await ctx.reply('commands.live.live_disabled')
        },
        lol: async () => {
          if (!ctx.db.guild) return

          await prisma.guild.update({
            where: {
              id: ctx.db.guild.id
            },
            data: {
              lol_live_feed_channel: null
            }
          })
          await ctx.reply('commands.live.live_disabled')
        }
      }

      await games[ctx.args[1] as 'valorant' | 'lol']()
    }
  }
})
