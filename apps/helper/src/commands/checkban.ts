import * as Discord from 'discord.js'
import createCommand from '@/structures/command/createCommand'

export default createCommand({
  name: 'checkban',
  description: 'Check if a user or guild is banned',
  onlyMod: true,
  args: {
    user: {
      type: Discord.ApplicationCommandOptionType.Subcommand,
      name: 'user',
      description: 'Check if a user is banned',
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
      description: 'Check if a guild is banned',
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
  async run({ ctx, app }) {
    if (ctx.args.user) {
      const u = await app.users.fetch(ctx.args.user.id).catch(() => null)

      if (!u) return await ctx.send('Enter a valid user ID.')

      const ban = await app.prisma.blacklist.findUnique({
        where: {
          id: u.id,
          type: 'USER'
        }
      })

      if (!ban) return await ctx.send(`\`${u.tag}\` is not banned from the bot.`)

      const timestamp = ban.endsAt ? (ban.endsAt.getTime() / 1000).toFixed(0) : undefined
      const when = (ban.when.getTime() / 1000).toFixed(0)

      await ctx.send(
        `\`${u.tag}\` is banned from the bot.\n**Reason:** \`${ban.reason}\`\n**Date:** <t:${when}:f> | <t:${when}:R>\n**Ends at:** ${!timestamp ? 'Never' : `<t:${timestamp}:F> | <t:${timestamp}:R>`}`
      )
    } else if (ctx.args.guild) {
      const ban = await app.prisma.blacklist.findUnique({
        where: {
          id: ctx.args.guild.id,
          type: 'GUILD'
        }
      })

      if (!ban) return await ctx.send(`\`${ctx.args.guild.id}\` is not banned from the bot.`)

      const timestamp = ban.endsAt ? (ban.endsAt.getTime() / 1000).toFixed(0) : undefined
      const when = (ban.when.getTime() / 1000).toFixed(0)

      await ctx.send(
        `\`${ban.name ?? ctx.args.guild.id}\` is banned from the bot.\n**Reason:** \`${ban.reason}\`\n**Date:** <t:${when}:f> | <t:${when}:R>\n**Ends at:** ${!timestamp ? 'Never' : `<t:${timestamp}:F> | <t:${timestamp}:R>`}`
      )
    }
  }
})
