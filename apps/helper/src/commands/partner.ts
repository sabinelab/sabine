import { GuildSchema, prisma } from '@db'
import * as Discord from 'discord.js'
import createCommand from '@/structures/command/createCommand'

export default createCommand({
  name: 'partner',
  description: 'Manage guild partnerships',
  onlyDev: true,
  args: {
    add: {
      type: Discord.ApplicationCommandOptionType.Subcommand,
      name: 'add',
      description: 'Add a guild as partner',
      args: {
        id: {
          type: Discord.ApplicationCommandOptionType.String,
          name: 'id',
          description: 'Guild ID',
          required: true
        },
        invite: {
          type: Discord.ApplicationCommandOptionType.String,
          name: 'invite',
          description: 'Guild Invite URL/Code',
          required: true
        }
      }
    },
    remove: {
      type: Discord.ApplicationCommandOptionType.Subcommand,
      name: 'remove',
      description: 'Remove a guild as partner',
      args: {
        id: {
          type: Discord.ApplicationCommandOptionType.String,
          name: 'id',
          description: 'Guild ID',
          required: true
        }
      }
    }
  },
  async run({ ctx }) {
    if (ctx.args.add) {
      const guild = await GuildSchema.fetch(ctx.args.add.id)

      if (!guild) {
        return await ctx.send('This guild does not exists in database')
      }

      await prisma.guild.update({
        where: {
          id: guild.id
        },
        data: {
          partner: true,
          invite: ctx.args.add.invite
        }
      })
      await ctx.send('Guild added!')
    } else if (ctx.args.remove) {
      const guild = await GuildSchema.fetch(ctx.args.remove.id)

      if (!guild) {
        return await ctx.send('This guild does not exists in database')
      }

      await prisma.guild.update({
        where: {
          id: guild.id
        },
        data: {
          partner: null,
          invite: null
        }
      })
      await ctx.send('Guild removed!')
    }
  }
})
