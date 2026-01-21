import { ApplicationCommandOptionType } from 'discord.js'
import createCommand from '@/structures/command/createCommand'

export default createCommand({
  name: 'maintenance',
  aliases: ['m'],
  description: 'maintenance command',
  onlyDev: true,
  args: {
    bot: {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'bot',
      description: 'Set the bot status',
      args: {
        type: {
          type: ApplicationCommandOptionType.String,
          name: 'type',
          description: 'type',
          choices: [
            {
              name: 'update',
              value: 'update'
            },
            {
              name: 'maintenance',
              value: 'maintenance'
            }
          ]
        }
      }
    },
    cmd: {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'cmd',
      description: 'Set the command status',
      args: {
        cmd: {
          type: ApplicationCommandOptionType.String,
          name: 'cmd',
          description: 'the command',
          required: true
        }
      }
    },
    rm: {
      type: ApplicationCommandOptionType.SubcommandGroup,
      name: 'rm',
      description: 'Remove the status',
      args: {
        cmd: {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'cmd',
          description: 'the command',
          args: {
            cmd: {
              type: ApplicationCommandOptionType.String,
              name: 'cmd',
              description: 'the command',
              required: true
            }
          }
        },
        bot: {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'bot',
          description: 'the command'
        }
      }
    }
  },
  async run({ ctx }) {
    if (ctx.args.bot) {
      if (ctx.args.bot.type === 'update') {
        await Bun.redis.set('status:bot:update', '1')
        await ctx.send('The bot is now temporarily unavailable for updates.')
      } else {
        await Bun.redis.set('status:bot:maintenance', '1')
        await ctx.send('The bot is now temporarily unavailable for a maintenance.')
      }
    } else if (ctx.args.cmd) {
      await Bun.redis.set(`status:cmd:${ctx.args.cmd.cmd}`, '1')
      await ctx.send(`The command \`${ctx.args.cmd.cmd}\` is now unavailable for a maintenance.`)
    } else if (ctx.args.rm) {
      if (ctx.args.rm.bot) {
        const keys = await Bun.redis.keys('status:bot:*')

        if (!keys.length) {
          return await ctx.send('The bot is already available.')
        }

        await Bun.redis.unlink(...keys)
        await ctx.send('The bot is available again.')
      } else if (ctx.args.rm.cmd) {
        const exists = await Bun.redis.exists(`status:cmd:${ctx.args.rm.cmd.cmd}`)

        if (!exists) {
          return await ctx.send('This command is already available.')
        }

        await Bun.redis.unlink(`status:cmd:${ctx.args.rm.cmd.cmd}`)
        await ctx.send(`The command \`${ctx.args.rm.cmd.cmd}\` is available again.`)
      }
    }
  }
})
