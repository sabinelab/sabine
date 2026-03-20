import type { GuildMemberRoleManager, TextChannel } from 'discord.js'
import transcript from 'discord-html-transcripts'
import createComponentInteraction from '@/structures/interaction/createComponentInteraction'

export default createComponentInteraction({
  name: 'close-ticket',
  async run({ ctx, app }) {
    if (!ctx.guild || !ctx.interaction.member) return

    const roles = ['1237458600046104617', '1237458505196114052', '1237457762502574130']
    const hasRole = (ctx.interaction.member.roles as GuildMemberRoleManager).cache.some((r: any) =>
      roles.includes(r.id)
    )

    if (!hasRole) return

    await ctx.interaction.deferReply({
      flags: 64
    })

    const channel = ctx.interaction.channel as TextChannel
    await channel.send({
      content: `Closing ticket <t:${((Date.now() + 10000) / 1000).toFixed(0)}:R>`
    })

    const attach = await transcript.createTranscript(channel, {
      poweredBy: false,
      saveImages: true,
      hydrate: true,
      filename: `transcript-${channel.name.replace('ticket_', '')}.html`
    })

    setTimeout(async () => {
      const ownerId = channel.name.replace('ticket_', '')
      await channel.delete()

      const logChannel = app.channels.cache.get('1313845851998781562') as TextChannel
      if (logChannel) {
        await logChannel.send({
          content: `Ticket requested by: <@${ownerId}>`,
          allowedMentions: {
            parse: ['roles']
          },
          files: [attach]
        })
      }
    }, 10000)

    await ctx.interaction.editReply({ content: 'Ticket is being closed...' })
  }
})
