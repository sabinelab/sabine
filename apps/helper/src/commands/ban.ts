import { ApplicationCommandOptionType, type TextChannel } from 'discord.js'
import { env } from '@/env'
import createCommand from '@/structures/command/createCommand'

export default createCommand({
  name: 'ban',
  aliases: ['b'],
  description: 'Ban a user',
  args: {
    user: {
      type: ApplicationCommandOptionType.User,
      name: 'user',
      description: 'Provide a user',
      required: 'Provide a valid user'
    },
    reason: {
      type: ApplicationCommandOptionType.String,
      name: 'reason',
      description: 'Provide a reason',
      required: 'Provide a valid reason'
    }
  },
  ephemeral: true,
  async run({ ctx }) {
    switch (ctx.args.reason) {
      case 'div':
        ctx.args.reason = 'Unauthorized promotion in text or voice channels.'
        break
      case 'divdm':
        ctx.args.reason = 'Unauthorized promotion via direct message.'
        break
      case 'toxic':
        ctx.args.reason = 'Disrespectful behavior in text or voice channels.'
        break
      case 'owo':
        ctx.args.reason = '1, 2, 3 testing... OwO'
        break
      case 'nsfw':
        ctx.args.reason = 'Sharing NSFW content in text or voice channels.'
    }

    await ctx.args.user
      .createDM()
      .then(dm =>
        dm.send({
          content: `You have been banned from \`${ctx.guild.name}\` for \`${ctx.args.reason}\``
        })
      )
      .catch(() => {})

    await ctx.guild.bans.create(ctx.args.user.id, {
      reason: ctx.args.reason
    })

    await ctx.send(
      `\`${ctx.args.user.tag}\` (\`${ctx.args.user.id}\`) have been banned for \`${ctx.args.reason}\``
    )

    const channel = ctx.app.channels.cache.get(env.MOD_LOG) as TextChannel

    channel
      .send({
        content: `\`${ctx.args.user.tag}\` (\`${ctx.args.user.id}\`) have been banned for \`${ctx.args.reason}\``
      })
      .then(msg => {
        msg
          .startThread({
            name: `Ban ${ctx.args.user.tag} (${ctx.args.user.id})`
          })
          .then(t =>
            t.send({
              content: `${ctx.author.toString()}, send the evidence of the punishment here.`
            })
          )
      })
  }
})
