import { ApplicationCommandOptionType } from 'discord.js'
import ButtonBuilder from '../../structures/builders/ButtonBuilder'
import EmbedBuilder from '../../structures/builders/EmbedBuilder'
import createCommand from '../../structures/command/createCommand'

export default createCommand({
  name: 'leaderboard',
  nameLocalizations: {
    'pt-BR': 'tabela'
  },
  category: 'esports',
  description: 'Leaderboard of users with most correct predictions, most victories and most coins',
  descriptionLocalizations: {
    'pt-BR': 'Tabela de usuários com mais palpites corretos'
  },
  options: [
    {
      type: ApplicationCommandOptionType.SubcommandGroup,
      name: 'local',
      description: 'Shows the leaderboard of this server',
      descriptionLocalizations: {
        'pt-BR': 'Mostra a tabela desse servidor'
      },
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'predictions',
          nameLocalizations: {
            'pt-BR': 'palpites'
          },
          description: 'The local leaderboard of predictions',
          descriptionLocalizations: {
            'pt-BR': 'Tabela local de palpites'
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
          name: 'coins',
          description: 'The local leaderboard of coins',
          descriptionLocalizations: {
            'pt-BR': 'Tabela local de coins'
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
          description: 'The local leaderboard of rating',
          descriptionLocalizations: {
            'pt-BR': 'Tabela local de classificação'
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
      ]
    },
    {
      type: ApplicationCommandOptionType.SubcommandGroup,
      name: 'global',
      description: 'Shows the global leaderboard',
      descriptionLocalizations: {
        'pt-BR': 'Mostra a tabela global'
      },
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'predictions',
          nameLocalizations: {
            'pt-BR': 'palpites'
          },
          description: 'The global leaderboard of predictions',
          descriptionLocalizations: {
            'pt-BR': 'Tabela global de palpites'
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
          name: 'coins',
          description: 'The global leaderboard of coins',
          descriptionLocalizations: {
            'pt-BR': 'Tabela global de coins'
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
          description: 'The global leaderboard of rating',
          descriptionLocalizations: {
            'pt-BR': 'Tabela global de classificação'
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
      ]
    }
  ],
  syntax: 'leaderboard global/local <page>',
  examples: [
    'leaderboard global',
    'leaderboard global 2',
    'leaderboard global 5',
    'leaderboard local',
    'leaderboard local 2',
    'leaderboard local 5'
  ],
  isThinking: true,
  messageComponentInteractionTime: 10 * 60 * 1000,
  async run({ ctx, t, app }) {
    if (ctx.args[0] === 'local' && ctx.guild) {
      if (ctx.args[1] === 'predictions') {
        const value = JSON.parse((await app.redis.get('leaderboard:predictions'))!)

        let users = value.data.filter((user: any) => ctx.guild!.members.cache.get(user.id))

        const array = users

        let page = Number(ctx.args[1])

        if (!page || page === 1 || Number.isNaN(page)) {
          users = users.slice(0, 10)
          page = 1
        } else users = users.slice(page * 10 - 10, page * 10)

        if (!users.length) {
          return await ctx.reply('commands.leaderboard.no_users')
        }

        const embed = new EmbedBuilder()
          .setAuthor({
            name: t('commands.leaderboard.predictions.author', {
              page,
              pages: Math.ceil(array.length / 10)
            })
          })
          .setTitle(t('commands.leaderboard.predictions.title'))
          .setThumb((await app.getUser(array[0].id!))?.avatarURL({ size: 2048 }) ?? '')
          .setDesc(
            t('commands.leaderboard.desc', {
              last: `<t:${(value.updated_at / 1000).toFixed(0)}:R>`
            })
          )

        let pos = 0

        if (!Number.isNaN(page) && page > 1) pos = page * 10 - 10

        for (const user of users) {
          pos++

          const u = await app.getUser(user.id)

          let field = `${pos} - ${!u ? '*unknown*' : u.username}`

          if (pos === 1) field = `🥇 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 2) field = `🥈 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 3) field = `🥉 - ${!u ? '*unknown*' : u.username}`

          embed.addField(
            field,
            t('commands.leaderboard.predictions.field', {
              t: user.correct_predictions
            })
          )
        }

        embed.setFooter({
          text: t('commands.leaderboard.predictions.footer', {
            pos: array.findIndex((user: any) => user.id === ctx.interaction.user.id) + 1
          })
        })

        const previous = new ButtonBuilder()
          .setEmoji('1404176223621611572')
          .setCustomId(
            `leaderboard;${ctx.interaction.user.id};${page - 1 < 1 ? 1 : page - 1};previous;local;predictions`
          )
          .defineStyle('blue')

        const next = new ButtonBuilder()
          .setEmoji('1404176291829121028')
          .setCustomId(
            `leaderboard;${ctx.interaction.user.id};${page + 1 > Math.ceil(array.length / 10) ? Math.ceil(array.length / 10) : page + 1};next;local;predictions`
          )
          .defineStyle('blue')

        if (page <= 1) previous.setDisabled()

        if (page >= Math.ceil(array.length / 10)) next.setDisabled()

        await ctx.reply({
          embeds: [embed],
          components: [
            {
              type: 1,
              components: [previous, next]
            }
          ]
        })
      } else if (ctx.args[1] === 'coins') {
        const value = JSON.parse((await app.redis.get('leaderboard:coins'))!)

        let users = value.data.filter((user: any) => ctx.guild!.members.cache.get(user.id))

        const array = users

        let page = Number(ctx.args[1])

        if (!page || page === 1 || Number.isNaN(page)) {
          users = users.slice(0, 10)
          page = 1
        } else users = users.slice(page * 10 - 10, page * 10)

        if (!users.length) {
          return await ctx.reply('commands.leaderboard.no_users')
        }

        const embed = new EmbedBuilder()
          .setAuthor({
            name: t('commands.leaderboard.coins.author', {
              page,
              pages: Math.ceil(array.length / 10)
            })
          })
          .setTitle(t('commands.leaderboard.coins.title'))
          .setThumb((await app.getUser(array[0].id!))?.avatarURL({ size: 2048 }) ?? '')
          .setDesc(
            t('commands.leaderboard.desc', {
              last: `<t:${(value.updated_at / 1000).toFixed(0)}:R>`
            })
          )

        let pos = 0

        if (!Number.isNaN(page) && page > 1) pos = page * 10 - 10

        for (const user of users) {
          pos++

          const u = await app.getUser(user.id)

          let field = `${pos} - ${!u ? '*unknown*' : u.username}`

          if (pos === 1) field = `🥇 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 2) field = `🥈 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 3) field = `🥉 - ${!u ? '*unknown*' : u.username}`

          embed.addField(
            field,
            t('commands.leaderboard.coins.field', {
              t: BigInt(user.coins).toLocaleString('en')
            })
          )
        }

        embed.setFooter({
          text: t('commands.leaderboard.coins.footer', {
            pos: array.findIndex((user: any) => user.id === ctx.interaction.user.id) + 1
          })
        })

        const previous = new ButtonBuilder()
          .setEmoji('1404176223621611572')
          .setCustomId(
            `leaderboard;${ctx.interaction.user.id};${page - 1 < 1 ? 1 : page - 1};previous;local;coins`
          )
          .defineStyle('blue')

        const next = new ButtonBuilder()
          .setEmoji('1404176291829121028')
          .setCustomId(
            `leaderboard;${ctx.interaction.user.id};${page + 1 > Math.ceil(array.length / 10) ? Math.ceil(array.length / 10) : page + 1};next;local;coins`
          )
          .defineStyle('blue')

        if (page <= 1) previous.setDisabled()

        if (page >= Math.ceil(array.length / 10)) next.setDisabled()

        await ctx.reply({
          embeds: [embed],
          components: [
            {
              type: 1,
              components: [previous, next]
            }
          ]
        })
      } else if (ctx.args[1] === 'rating') {
        const value = JSON.parse((await app.redis.get('leaderboard:rating'))!)

        let users = value.data.filter((user: any) => ctx.guild!.members.cache.get(user.id))

        const array = users

        let page = Number(ctx.args[1])

        if (!page || page === 1 || Number.isNaN(page)) {
          users = users.slice(0, 10)
          page = 1
        } else users = users.slice(page * 10 - 10, page * 10)

        if (!users.length) {
          return await ctx.reply('commands.leaderboard.no_users')
        }

        const embed = new EmbedBuilder()
          .setAuthor({
            name: t('commands.leaderboard.rating.author', {
              page,
              pages: Math.ceil(array.length / 10)
            })
          })
          .setTitle(t('commands.leaderboard.rating.title'))
          .setThumb((await app.getUser(array[0].id!))?.avatarURL({ size: 2048 }) ?? '')
          .setDesc(
            t('commands.leaderboard.desc', {
              last: `<t:${(value.updated_at / 1000).toFixed(0)}:R>`
            })
          )

        let pos = 0

        if (!Number.isNaN(page) && page > 1) pos = page * 10 - 10

        for (const user of users) {
          pos++

          const u = await app.getUser(user.id)

          let field = `${pos} - ${!u ? '*unknown*' : u.username}`

          if (pos === 1) field = `🥇 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 2) field = `🥈 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 3) field = `🥉 - ${!u ? '*unknown*' : u.username}`

          embed.addField(
            field,
            t('commands.leaderboard.rating.field', {
              rr: user.rank_rating
            })
          )
        }
        embed.setFooter({
          text: t('commands.leaderboard.rating.footer', {
            pos: array.findIndex((user: any) => user.id === ctx.interaction.user.id) + 1
          })
        })

        const previous = new ButtonBuilder()
          .setEmoji('1404176223621611572')
          .setCustomId(
            `leaderboard;${ctx.interaction.user.id};${page - 1 < 1 ? 1 : page - 1};previous;local;rating`
          )
          .defineStyle('blue')

        const next = new ButtonBuilder()
          .setEmoji('1404176291829121028')
          .setCustomId(
            `leaderboard;${ctx.interaction.user.id};${page + 1 > Math.ceil(array.length / 10) ? Math.ceil(array.length / 10) : page + 1};next;local;rating`
          )
          .defineStyle('blue')

        if (page <= 1) previous.setDisabled()

        if (page >= Math.ceil(array.length / 10)) next.setDisabled()

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
    } else {
      if (ctx.args[1] === 'predictions') {
        const value = JSON.parse((await app.redis.get('leaderboard:predictions'))!)

        let users = value.data

        const array = users

        let page = Number(ctx.args[1])

        if (!page || page === 1 || Number.isNaN(page)) {
          users = users.slice(0, 10)
          page = 1
        } else users = users.slice(page * 10 - 10, page * 10)

        if (!users.length) {
          return await ctx.reply('commands.leaderboard.no_users')
        }

        const embed = new EmbedBuilder()
          .setAuthor({
            name: t('commands.leaderboard.predictions.author', {
              page,
              pages: Math.ceil(array.length / 10)
            })
          })
          .setTitle(t('commands.leaderboard.predictions.title'))
          .setThumb((await app.getUser(array[0].id!))?.avatarURL({ size: 2048 }) ?? '')
          .setDesc(
            t('commands.leaderboard.desc', {
              last: `<t:${(value.updated_at / 1000).toFixed(0)}:R>`
            })
          )

        let pos = 0

        if (!Number.isNaN(page) && page > 1) pos = page * 10 - 10

        for (const user of users) {
          pos++

          const u = await app.getUser(user.id)

          let field = `${pos} - ${!u ? '*unknown*' : u.username}`
          if (pos === 1) field = `🥇 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 2) field = `🥈 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 3) field = `🥉 - ${!u ? '*unknown*' : u.username}`

          embed.addField(
            field,
            t('commands.leaderboard.predictions.field', {
              t: user.correct_predictions
            })
          )
        }

        embed.setFooter({
          text: t('commands.leaderboard.predictions.footer', {
            pos: array.findIndex((user: any) => user.id === ctx.interaction.user.id) + 1
          })
        })

        const previous = new ButtonBuilder()
          .setEmoji('1404176223621611572')
          .setCustomId(
            `leaderboard;${ctx.interaction.user.id};${page - 1 < 1 ? 1 : page - 1};previous;global;predictions`
          )
          .defineStyle('blue')

        const next = new ButtonBuilder()
          .setEmoji('1404176291829121028')
          .setCustomId(
            `leaderboard;${ctx.interaction.user.id};${page + 1 > Math.ceil(array.length / 10) ? Math.ceil(array.length / 10) : page + 1};next;global;predictions`
          )
          .defineStyle('blue')

        if (page <= 1) previous.setDisabled()

        if (page >= Math.ceil(array.length / 10)) next.setDisabled()

        await ctx.reply({
          embeds: [embed],
          components: [
            {
              type: 1,
              components: [previous, next]
            }
          ]
        })
      } else if (ctx.args[1] === 'coins') {
        const value = JSON.parse((await app.redis.get('leaderboard:coins'))!)

        let users = value.data

        const array = users

        let page = Number(ctx.args[1])

        if (!page || page === 1 || Number.isNaN(page)) {
          users = users.slice(0, 10)
          page = 1
        } else users = users.slice(page * 10 - 10, page * 10)

        if (!users.length) {
          return await ctx.reply('commands.leaderboard.no_users')
        }

        const embed = new EmbedBuilder()
          .setAuthor({
            name: t('commands.leaderboard.coins.author', {
              page,
              pages: Math.ceil(array.length / 10)
            })
          })
          .setTitle(t('commands.leaderboard.coins.title'))
          .setThumb((await app.getUser(array[0].id!))?.avatarURL({ size: 2048 }) ?? '')
          .setDesc(
            t('commands.leaderboard.desc', {
              last: `<t:${(value.updated_at / 1000).toFixed(0)}:R>`
            })
          )

        let pos = 0

        if (!Number.isNaN(page) && page > 1) pos = page * 10 - 10

        for (const user of users) {
          pos++

          const u = await app.getUser(user.id)

          let field = `${pos} - ${!u ? '*unknown*' : u.username}`
          if (pos === 1) field = `🥇 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 2) field = `🥈 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 3) field = `🥉 - ${!u ? '*unknown*' : u.username}`

          embed.addField(
            field,
            t('commands.leaderboard.coins.field', {
              t: BigInt(user.coins).toLocaleString('en')
            })
          )
        }

        embed.setFooter({
          text: t('commands.leaderboard.coins.footer', {
            pos: array.findIndex((user: any) => user.id === ctx.interaction.user.id) + 1
          })
        })

        const previous = new ButtonBuilder()
          .setEmoji('1404176223621611572')
          .setCustomId(
            `leaderboard;${ctx.interaction.user.id};${page - 1 < 1 ? 1 : page - 1};previous;global;coins`
          )
          .defineStyle('blue')

        const next = new ButtonBuilder()
          .setEmoji('1404176291829121028')
          .setCustomId(
            `leaderboard;${ctx.interaction.user.id};${page + 1 > Math.ceil(array.length / 10) ? Math.ceil(array.length / 10) : page + 1};next;global;coins`
          )
          .defineStyle('blue')

        if (page <= 1) previous.setDisabled()

        if (page >= Math.ceil(array.length / 10)) next.setDisabled()

        await ctx.reply({
          embeds: [embed],
          components: [
            {
              type: 1,
              components: [previous, next]
            }
          ]
        })
      } else if (ctx.args[1] === 'rating') {
        const value = JSON.parse((await app.redis.get('leaderboard:rating'))!)

        let users = value.data

        const array = users

        let page = Number(ctx.args[1])

        if (!page || page === 1 || Number.isNaN(page)) {
          users = users.slice(0, 10)
          page = 1
        } else users = users.slice(page * 10 - 10, page * 10)

        if (!users.length) {
          return await ctx.reply('commands.leaderboard.no_users')
        }

        const embed = new EmbedBuilder()
          .setAuthor({
            name: t('commands.leaderboard.rating.author', {
              page,
              pages: Math.ceil(array.length / 10)
            })
          })
          .setTitle(t('commands.leaderboard.rating.title'))
          .setThumb((await app.getUser(array[0].id!))?.avatarURL({ size: 2048 }) ?? '')
          .setDesc(
            t('commands.leaderboard.desc', {
              last: `<t:${(value.updated_at / 1000).toFixed(0)}:R>`
            })
          )

        let pos = 0

        if (!Number.isNaN(page) && page > 1) pos = page * 10 - 10

        for (const user of users) {
          pos++

          const u = await app.getUser(user.id)

          let field = `${pos} - ${!u ? '*unknown*' : u.username}`
          if (pos === 1) field = `🥇 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 2) field = `🥈 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 3) field = `🥉 - ${!u ? '*unknown*' : u.username}`

          embed.addField(
            field,
            t('commands.leaderboard.rating.field', {
              rr: user.rank_rating
            })
          )
        }

        embed.setFooter({
          text: t('commands.leaderboard.rating.footer', {
            pos: array.findIndex((user: any) => user.id === ctx.interaction.user.id) + 1
          })
        })

        const previous = new ButtonBuilder()
          .setEmoji('1404176223621611572')
          .setCustomId(
            `leaderboard;${ctx.interaction.user.id};${page - 1 < 1 ? 1 : page - 1};previous;global;rating`
          )
          .defineStyle('blue')

        const next = new ButtonBuilder()
          .setEmoji('1404176291829121028')
          .setCustomId(
            `leaderboard;${ctx.interaction.user.id};${page + 1 > Math.ceil(array.length / 10) ? Math.ceil(array.length / 10) : page + 1};next;global;rating`
          )
          .defineStyle('blue')

        if (page <= 1) previous.setDisabled()

        if (page >= Math.ceil(array.length / 10)) next.setDisabled()

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
    }
  },
  async createMessageComponentInteraction({ ctx, t, app }) {
    if (ctx.args[4] === 'local' && ctx.guild) {
      if (ctx.args[5] === 'predictions') {
        const value = JSON.parse((await app.redis.get('leaderboard:predictions'))!)

        let users = value.data.filter((user: any) => ctx.guild!.members.cache.get(user.id))

        const array = users

        const page = Number(ctx.args[2]) || 1

        const pages = Math.ceil(array.length / 10)

        users = users.slice(page * 10 - 10, page * 10)

        if (!users.length) {
          return await ctx.reply('commands.leaderboard.no_users')
        }

        const embed = new EmbedBuilder()
          .setAuthor({
            name: t('commands.leaderboard.predictions.author', {
              page,
              pages: Math.ceil(array.length / 10)
            })
          })
          .setTitle(t('commands.leaderboard.predictions.title'))
          .setThumb((await app.getUser(array[0].id!))?.avatarURL({ size: 2048 }) ?? '')
          .setDesc(
            t('commands.leaderboard.desc', {
              last: `<t:${(value.updated_at / 1000).toFixed(0)}:R>`
            })
          )

        let pos = 0

        if (!Number.isNaN(page) && page > 1) pos = page * 10 - 10

        for (const user of users) {
          pos++

          const u = await app.getUser(user.id)

          let field = `${pos} - ${!u ? '*unknown*' : u.username}`

          if (pos === 1) field = `🥇 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 2) field = `🥈 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 3) field = `🥉 - ${!u ? '*unknown*' : u.username}`

          embed.addField(
            field,
            t('commands.leaderboard.predictions.field', {
              t: user.correct_predictions
            })
          )
        }

        embed.setFooter({
          text: t('commands.leaderboard.predictions.footer', {
            pos: array.findIndex((user: any) => user.id === ctx.interaction.user.id) + 1
          })
        })

        const previous = new ButtonBuilder()
          .setEmoji('1404176223621611572')
          .setCustomId(
            `leaderboard;${ctx.interaction.user.id};${page - 1};previous;local;predictions`
          )
          .defineStyle('blue')

        const next = new ButtonBuilder()
          .setEmoji('1404176291829121028')
          .setCustomId(`leaderboard;${ctx.interaction.user.id};${page + 1};next;local;predictions`)
          .defineStyle('blue')

        if (page <= 1) previous.setDisabled()

        if (page >= pages) next.setDisabled()

        return await ctx.edit({
          embeds: [embed],
          components: [
            {
              type: 1,
              components: [previous, next]
            }
          ]
        })
      } else if (ctx.args[5] === 'coins') {
        const value = JSON.parse((await app.redis.get('leaderboard:coins'))!)

        let users = value.data.filter((user: any) => ctx.guild!.members.cache.get(user.id))

        const array = users

        const page = Number(ctx.args[2]) || 1

        const pages = Math.ceil(array.length / 10)

        users = users.slice(page * 10 - 10, page * 10)

        if (!users.length) {
          return await ctx.reply('commands.leaderboard.no_users')
        }

        const embed = new EmbedBuilder()
          .setAuthor({
            name: t('commands.leaderboard.coins.author', {
              page,
              pages: Math.ceil(array.length / 10)
            })
          })
          .setTitle(t('commands.leaderboard.coins.title'))
          .setThumb((await app.getUser(array[0].id!))?.avatarURL({ size: 2048 }) ?? '')
          .setDesc(
            t('commands.leaderboard.desc', {
              last: `<t:${(value.updated_at / 1000).toFixed(0)}:R>`
            })
          )

        let pos = 0

        if (!Number.isNaN(page) && page > 1) pos = page * 10 - 10

        for (const user of users) {
          pos++

          const u = await app.getUser(user.id)

          let field = `${pos} - ${!u ? '*unknown*' : u.username}`

          if (pos === 1) field = `🥇 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 2) field = `🥈 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 3) field = `🥉 - ${!u ? '*unknown*' : u.username}`

          embed.addField(
            field,
            t('commands.leaderboard.coins.field', {
              t: BigInt(user.coins).toLocaleString('en')
            })
          )
        }

        embed.setFooter({
          text: t('commands.leaderboard.coins.footer', {
            pos: array.findIndex((user: any) => user.id === ctx.interaction.user.id) + 1
          })
        })

        const previous = new ButtonBuilder()
          .setEmoji('1404176223621611572')
          .setCustomId(`leaderboard;${ctx.interaction.user.id};${page - 1};previous;local;coins`)
          .defineStyle('blue')

        const next = new ButtonBuilder()
          .setEmoji('1404176291829121028')
          .setCustomId(`leaderboard;${ctx.interaction.user.id};${page + 1};next;local;coins`)
          .defineStyle('blue')

        if (page <= 1) previous.setDisabled()

        if (page >= pages) next.setDisabled()

        return await ctx.edit({
          embeds: [embed],
          components: [
            {
              type: 1,
              components: [previous, next]
            }
          ]
        })
      } else if (ctx.args[5] === 'rating') {
        const value = JSON.parse((await app.redis.get('leaderboard:rating'))!)

        let users = value.data.filter((user: any) => ctx.guild!.members.cache.get(user.id))

        const array = users

        const page = Number(ctx.args[2]) || 1

        const pages = Math.ceil(array.length / 10)

        users = users.slice(page * 10 - 10, page * 10)

        if (!users.length) {
          return await ctx.reply('commands.leaderboard.no_users')
        }

        const embed = new EmbedBuilder()
          .setAuthor({
            name: t('commands.leaderboard.rating.author', {
              page,
              pages: Math.ceil(array.length / 10)
            })
          })
          .setTitle(t('commands.leaderboard.rating.title'))
          .setThumb((await app.getUser(array[0].id!))?.avatarURL({ size: 2048 }) ?? '')
          .setDesc(
            t('commands.leaderboard.desc', {
              last: `<t:${(value.updated_at / 1000).toFixed(0)}:R>`
            })
          )

        let pos = 0

        if (!Number.isNaN(page) && page > 1) pos = page * 10 - 10

        for (const user of users) {
          pos++

          const u = await app.getUser(user.id)

          let field = `${pos} - ${!u ? '*unknown*' : u.username}`

          if (pos === 1) field = `🥇 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 2) field = `🥈 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 3) field = `🥉 - ${!u ? '*unknown*' : u.username}`

          embed.addField(
            field,
            t('commands.leaderboard.rating.field', {
              rr: user.rank_rating
            })
          )
        }

        embed.setFooter({
          text: t('commands.leaderboard.rating.footer', {
            pos: array.findIndex((user: any) => user.id === ctx.interaction.user.id) + 1
          })
        })

        const previous = new ButtonBuilder()
          .setEmoji('1404176223621611572')
          .setCustomId(`leaderboard;${ctx.interaction.user.id};${page - 1};previous;local;rating`)
          .defineStyle('blue')

        const next = new ButtonBuilder()
          .setEmoji('1404176291829121028')
          .setCustomId(`leaderboard;${ctx.interaction.user.id};${page + 1};next;local;rating`)
          .defineStyle('blue')

        if (page <= 1) previous.setDisabled()

        if (page >= pages) next.setDisabled()

        return await ctx.edit({
          embeds: [embed],
          components: [
            {
              type: 1,
              components: [previous, next]
            }
          ]
        })
      }
    } else {
      if (ctx.args[5] === 'predictions') {
        const value = JSON.parse((await app.redis.get('leaderboard:predictions'))!)

        let users = value.data

        const array = users

        const page = Number(ctx.args[2]) || 1

        const pages = Math.ceil(array.length / 10)

        users = users.slice(page * 10 - 10, page * 10)

        if (!users.length) {
          return await ctx.reply('commands.leaderboard.no_users')
        }

        const embed = new EmbedBuilder()
          .setAuthor({
            name: t('commands.leaderboard.predictions.author', {
              page,
              pages: Math.ceil(array.length / 10)
            })
          })
          .setTitle(t('commands.leaderboard.predictions.title'))
          .setThumb((await app.getUser(array[0].id!))?.avatarURL({ size: 2048 }) ?? '')
          .setDesc(
            t('commands.leaderboard.desc', {
              last: `<t:${(value.updated_at / 1000).toFixed(0)}:R>`
            })
          )

        let pos = 0

        if (!Number.isNaN(page) && page > 1) pos = page * 10 - 10

        for (const user of users) {
          pos++

          const u = await app.getUser(user.id)

          let field = `${pos} - ${!u ? '*unknown*' : u.username}`

          if (pos === 1) field = `🥇 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 2) field = `🥈 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 3) field = `🥉 - ${!u ? '*unknown*' : u.username}`

          embed.addField(
            field,
            t('commands.leaderboard.predictions.field', {
              t: user.correct_predictions
            })
          )
        }

        embed.setFooter({
          text: t('commands.leaderboard.predictions.footer', {
            pos: array.findIndex((user: any) => user.id === ctx.interaction.user.id) + 1
          })
        })

        const previous = new ButtonBuilder()
          .setEmoji('1404176223621611572')
          .setCustomId(
            `leaderboard;${ctx.interaction.user.id};${page - 1};previous;global;predictions`
          )
          .defineStyle('blue')

        const next = new ButtonBuilder()
          .setEmoji('1404176291829121028')
          .setCustomId(`leaderboard;${ctx.interaction.user.id};${page + 1};next;global;predictions`)
          .defineStyle('blue')

        if (page <= 1) previous.setDisabled()

        if (page >= pages) next.setDisabled()

        return await ctx.edit({
          embeds: [embed],
          components: [
            {
              type: 1,
              components: [previous, next]
            }
          ]
        })
      } else if (ctx.args[5] === 'coins') {
        const value = JSON.parse((await app.redis.get('leaderboard:coins'))!)

        let users = value.data

        const array = users

        const page = Number(ctx.args[2]) || 1

        const pages = Math.ceil(array.length / 10)

        users = users.slice(page * 10 - 10, page * 10)

        if (!users.length) {
          return await ctx.reply('commands.leaderboard.no_users')
        }

        const embed = new EmbedBuilder()
          .setAuthor({
            name: t('commands.leaderboard.coins.author', {
              page,
              pages: Math.ceil(array.length / 10)
            })
          })
          .setTitle(t('commands.leaderboard.coins.title'))
          .setThumb((await app.getUser(array[0].id!))?.avatarURL({ size: 2048 }) ?? '')
          .setDesc(
            t('commands.leaderboard.desc', {
              last: `<t:${(value.updated_at / 1000).toFixed(0)}:R>`
            })
          )

        let pos = 0

        if (!Number.isNaN(page) && page > 1) pos = page * 10 - 10

        for (const user of users) {
          pos++

          const u = await app.getUser(user.id)

          let field = `${pos} - ${!u ? '*unknown*' : u.username}`

          if (pos === 1) field = `🥇 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 2) field = `🥈 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 3) field = `🥉 - ${!u ? '*unknown*' : u.username}`

          embed.addField(
            field,
            t('commands.leaderboard.coins.field', {
              t: BigInt(user.coins).toLocaleString('en')
            })
          )
        }

        embed.setFooter({
          text: t('commands.leaderboard.coins.footer', {
            pos: array.findIndex((user: any) => user.id === ctx.interaction.user.id) + 1
          })
        })

        const previous = new ButtonBuilder()
          .setEmoji('1404176223621611572')
          .setCustomId(`leaderboard;${ctx.interaction.user.id};${page - 1};previous;global;coins`)
          .defineStyle('blue')

        const next = new ButtonBuilder()
          .setEmoji('1404176291829121028')
          .setCustomId(`leaderboard;${ctx.interaction.user.id};${page + 1};next;global;coins`)
          .defineStyle('blue')

        if (page <= 1) previous.setDisabled()

        if (page >= pages) next.setDisabled()

        return await ctx.edit({
          embeds: [embed],
          components: [
            {
              type: 1,
              components: [previous, next]
            }
          ]
        })
      } else if (ctx.args[5] === 'rating') {
        const value = JSON.parse((await app.redis.get('leaderboard:rating'))!)

        let users = value.data

        const array = users

        const page = Number(ctx.args[2]) || 1

        const pages = Math.ceil(array.length / 10)

        users = users.slice(page * 10 - 10, page * 10)

        if (!users.length) {
          return await ctx.reply('commands.leaderboard.no_users')
        }

        const embed = new EmbedBuilder()
          .setAuthor({
            name: t('commands.leaderboard.rating.author', {
              page,
              pages: Math.ceil(array.length / 10)
            })
          })
          .setTitle(t('commands.leaderboard.rating.title'))
          .setThumb((await app.getUser(array[0].id!))?.avatarURL({ size: 2048 }) ?? '')
          .setDesc(
            t('commands.leaderboard.desc', {
              last: `<t:${(value.updated_at / 1000).toFixed(0)}:R>`
            })
          )

        let pos = 0

        if (!Number.isNaN(page) && page > 1) pos = page * 10 - 10

        for (const user of users) {
          pos++

          const u = await app.getUser(user.id)

          let field = `${pos} - ${!u ? '*unknown*' : u.username}`

          if (pos === 1) field = `🥇 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 2) field = `🥈 - ${!u ? '*unknown*' : u.username}`
          else if (pos === 3) field = `🥉 - ${!u ? '*unknown*' : u.username}`

          embed.addField(
            field,
            t('commands.leaderboard.rating.field', {
              rr: user.rank_rating
            })
          )
        }

        embed.setFooter({
          text: t('commands.leaderboard.rating.footer', {
            pos: array.findIndex((user: any) => user.id === ctx.interaction.user.id) + 1
          })
        })

        const previous = new ButtonBuilder()
          .setEmoji('1404176223621611572')
          .setCustomId(`leaderboard;${ctx.interaction.user.id};${page - 1};previous;global;rating`)
          .defineStyle('blue')

        const next = new ButtonBuilder()
          .setEmoji('1404176291829121028')
          .setCustomId(`leaderboard;${ctx.interaction.user.id};${page + 1};next;global;rating`)
          .defineStyle('blue')

        if (page <= 1) previous.setDisabled()

        if (page >= pages) next.setDisabled()

        return await ctx.edit({
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
  }
})
