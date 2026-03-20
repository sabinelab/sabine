import * as Discord from 'discord.js'
import ms from 'enhanced-ms'
import createCommand from '@/structures/command/createCommand'

export default createCommand({
  name: 'blacklist',
  aliases: ['bl'],
  description: 'Manage the blacklist for users and guilds',
  onlyDev: true,
  args: {
    add: {
      type: Discord.ApplicationCommandOptionType.SubcommandGroup,
      name: 'add',
      description: 'Add an ID to the blacklist',
      args: {
        user: {
          type: Discord.ApplicationCommandOptionType.Subcommand,
          name: 'user',
          description: 'Blacklist a user',
          args: {
            id: {
              type: Discord.ApplicationCommandOptionType.String,
              name: 'id',
              description: 'User ID',
              required: true
            },
            reason: {
              type: Discord.ApplicationCommandOptionType.String,
              name: 'reason',
              description: 'Reason for the blacklist',
              required: true
            },
            time: {
              type: Discord.ApplicationCommandOptionType.String,
              name: 'time',
              description: 'Duration (e.g., 1d, 1h)'
            }
          }
        },
        guild: {
          type: Discord.ApplicationCommandOptionType.Subcommand,
          name: 'guild',
          description: 'Blacklist a guild',
          args: {
            id: {
              type: Discord.ApplicationCommandOptionType.String,
              name: 'id',
              description: 'Guild ID',
              required: true
            },
            reason: {
              type: Discord.ApplicationCommandOptionType.String,
              name: 'reason',
              description: 'Reason for the blacklist',
              required: true
            },
            time: {
              type: Discord.ApplicationCommandOptionType.String,
              name: 'time',
              description: 'Duration (e.g., 1d, 1h)'
            }
          }
        }
      }
    },
    remove: {
      type: Discord.ApplicationCommandOptionType.SubcommandGroup,
      name: 'remove',
      description: 'Remove an ID from the blacklist',
      args: {
        user: {
          type: Discord.ApplicationCommandOptionType.Subcommand,
          name: 'user',
          description: 'Unblacklist a user',
          args: {
            id: {
              type: Discord.ApplicationCommandOptionType.String,
              name: 'id',
              description: 'User ID',
              required: true
            }
          }
        },
        guild: {
          type: Discord.ApplicationCommandOptionType.Subcommand,
          name: 'guild',
          description: 'Unblacklist a guild',
          args: {
            id: {
              type: Discord.ApplicationCommandOptionType.String,
              name: 'id',
              description: 'Guild ID',
              required: true
            }
          }
        }
      }
    }
  },
  async run({ ctx, app }) {
    if (ctx.args.add) {
      if (ctx.args.add.user) {
        const time = ctx.args.add.user.time ? ms(ctx.args.add.user.time) : null

        const blacklist = await app.prisma.blacklist.findUnique({
          where: {
            id: ctx.args.add.user.id,
            type: 'USER'
          }
        })

        if (blacklist) return await ctx.send('This user is already banned.')

        await app.prisma.user.delete({ where: { id: ctx.args.add.user.id } }).catch(() => null)
        const u = await app.users.fetch(ctx.args.add.user.id).catch(() => null)

        await app.prisma.blacklist.create({
          data: {
            id: ctx.args.add.user.id,
            reason: ctx.args.add.user.reason,
            endsAt: time ? new Date(Date.now() + time) : null,
            type: 'USER'
          }
        })

        await ctx.send(
          `\`${u?.tag ?? 'Unknown'}\` (\`${ctx.args.add.user.id}\`) has been banned from the bot ${time ? 'for ' + ms(time) : 'forever'} for \`${ctx.args.add.user.reason}\``
        )
      } else if (ctx.args.add.guild) {
        const time = ctx.args.add.guild.time ? ms(ctx.args.add.guild.time) : null

        const blacklist = await app.prisma.blacklist.findUnique({
          where: {
            id: ctx.args.add.guild.id,
            type: 'GUILD'
          }
        })

        if (blacklist) return await ctx.send('This guild is already banned.')

        await app.prisma.guild.delete({ where: { id: ctx.args.add.guild.id } }).catch(() => null)
        const g = app.guilds.cache.get(ctx.args.add.guild.id)

        await app.prisma.blacklist.create({
          data: {
            id: ctx.args.add.guild.id,
            reason: ctx.args.add.guild.reason,
            endsAt: time ? new Date(Date.now() + time) : null,
            type: 'GUILD',
            name: g?.name
          }
        })

        await ctx.send(
          `\`${g?.name ?? 'Unknown'}\` (\`${ctx.args.add.guild.id}\`) has been banned from the bot ${time ? 'for ' + ms(time) : 'forever'} for \`${ctx.args.add.guild.reason}\``
        )
      }
    } else if (ctx.args.remove) {
      if (ctx.args.remove.user) {
        const blacklist = await app.prisma.blacklist.findUnique({
          where: {
            id: ctx.args.remove.user.id,
            type: 'USER'
          }
        })

        if (!blacklist) return await ctx.send('This user is not banned.')

        const u = await app.users.fetch(ctx.args.remove.user.id).catch(() => null)
        await app.prisma.blacklist.delete({
          where: {
            id: ctx.args.remove.user.id,
            type: 'USER'
          }
        })

        await ctx.send(
          `\`${u?.tag ?? 'Unknown'}\` (\`${ctx.args.remove.user.id}\`) has been unbanned from the bot.`
        )
      } else if (ctx.args.remove.guild) {
        const blacklist = await app.prisma.blacklist.findUnique({
          where: {
            id: ctx.args.remove.guild.id,
            type: 'GUILD'
          }
        })

        if (!blacklist) return await ctx.send('This guild is not banned.')

        await app.prisma.blacklist.delete({
          where: {
            id: ctx.args.remove.guild.id,
            type: 'GUILD'
          }
        })
        await ctx.send(`\`${ctx.args.remove.guild.id}\` has been unbanned from the bot.`)
      }
    }
  }
})
