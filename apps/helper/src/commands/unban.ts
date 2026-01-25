import { ApplicationCommandOptionType, type TextChannel } from 'discord.js'
import { env } from '@/env'
import createCommand from '@/structures/command/createCommand'

export default createCommand({
  name: 'unban',
  aliases: ['unb'],
  description: 'Unban a user',
  onlyMod: true,
  args: {
    user: {
      type: ApplicationCommandOptionType.User,
      name: 'user',
      description: 'Provide a user',
      required: true
    }
  },
  ephemeral: true,
  async run({ ctx, app }) {
    await ctx.guild.bans.remove(ctx.args.user.id)

    await ctx.send(
      `\`${ctx.args.user.tag}\` (\`${ctx.args.user.id}\`) has been unbanned for ${ctx.author.toString()}`
    )

    const channel = app.channels.cache.get(env.MOD_LOG) as TextChannel

    if (channel) {
      await channel.send({
        content: `\`${ctx.args.user.tag}\` (\`${ctx.args.user.id}\`) has been unbanned for ${ctx.author.toString()}`
      })
    }
  }
})
