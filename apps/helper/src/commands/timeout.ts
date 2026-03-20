import translate from '@iamtraction/google-translate'
import { ApplicationCommandOptionType, type TextChannel } from 'discord.js'
import ms from 'enhanced-ms'
import { env } from '@/env'
import createCommand from '@/structures/command/createCommand'

export default createCommand({
  name: 'timeout',
  aliases: ['t'],
  description: 'Timeout a member',
  onlyMod: true,
  args: {
    member: {
      type: ApplicationCommandOptionType.User,
      name: 'member',
      description: 'Provide a member',
      required: true
    },
    time: {
      type: ApplicationCommandOptionType.String,
      name: 'time',
      description: 'Duration (e.g., 30m, 1h, 1d)',
      required: true
    },
    reason: {
      type: ApplicationCommandOptionType.String,
      name: 'reason',
      description: 'Provide a reason',
      required: true
    }
  },
  ephemeral: true,
  async run({ ctx, app }) {
    const member = ctx.guild.members.cache.get(ctx.args.member.id)
    if (!member) {
      return await ctx.send('Provide a valid member')
    }

    if (!ms(ctx.args.time)) {
      return await ctx.send('Provide a valid time (`30m`, `1h`, `1d`)')
    }

    let reason = ctx.args.reason

    switch (reason) {
      case 'div':
        reason = 'Unauthorized promotion in text or voice channels.'
        break
      case 'divdm':
        reason = 'Unauthorized promotion via direct message.'
        break
      case 'toxic':
        reason = 'Disrespectful behavior in text or voice channels.'
        break
      case 'owo':
        reason = '1, 2, 3 testing... OwO'
        break
      case 'nsfw':
        reason = 'Sharing NSFW content in text or voice channels.'
        break
    }

    await member.user
      .createDM()
      .then(dm =>
        dm.send({
          content: `You have been muted **${ms(ms(ctx.args.time))}** in \`${ctx.guild.name}\` for \`${reason}\``
        })
      )
      .catch(() => {})

    await member.edit({
      communicationDisabledUntil: new Date(Date.now() + ms(ctx.args.time)).toISOString()
    })

    const translatedTime = (
      await translate(ms(ms(ctx.args.time))!, {
        to: 'pt'
      })
    ).text

    await ctx.send(
      `\`${member.user.username}\` (\`${member.id}\`) has been timed out for **${translatedTime}** for \`${reason}\``
    )

    const channel = app.channels.cache.get(env.MOD_LOG) as TextChannel

    if (channel) {
      await channel
        .send({
          content: `\`${member.user.username}\` (\`${member.id}\`) has been muted for **${translatedTime}** for \`${reason}\``
        })
        .then(msg => {
          msg
            .startThread({
              name: `Timeout ${member.user.username} (${member.id})`
            })
            .then(t =>
              t.send({
                content: `${ctx.author.toString()}, send the evidence of the punishment here.`
              })
            )
        })
    }
  }
})
