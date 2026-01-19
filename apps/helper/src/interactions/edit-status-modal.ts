import { prisma } from '@db'
import { ButtonStyle, ChannelType } from 'discord.js'
import { colors, emoji } from '@/commands/status'
import { env } from '@/env'
import ButtonBuilder from '@/structures/builders/ButtonBuilder'
import EmbedBuilder from '@/structures/builders/EmbedBuilder'
import createModalSubmitInteraction from '@/structures/interaction/createModalSubmitInteraction'

export default createModalSubmitInteraction({
  name: 'edit-status-modal',
  ephemeral: true,
  async run({ ctx }) {
    if (ctx.author.id !== '441932495693414410') return

    ctx.setFlags(64)

    const title = ctx.interaction.fields.getTextInputValue('edit-status-modal-response-1')
    const description = ctx.interaction.fields.getTextInputValue('edit-status-modal-response-2')
    const type = ctx.interaction.fields
      .getTextInputValue('edit-status-modal-response-3')
      .toUpperCase() as keyof typeof emoji
    const msg = ctx.interaction.fields.getTextInputValue('edit-status-modal-response-4')

    const status = await prisma.status.findUnique({
      where: {
        id: BigInt(ctx.args[1])
      }
    })

    if (!status) {
      ctx.setFlags(64)
      return await ctx.reply('Status not found.')
    }

    const channel = ctx.guild.channels.cache.get(env.STATUS_CHANNEL)

    if (channel?.type !== ChannelType.GuildAnnouncement) return

    const embed = new EmbedBuilder()
      .setTitle(`${emoji[type]} ${title}`)
      .setDesc(description)
      .setColor(colors[type])

    const button = new ButtonBuilder()
      .setCustomId('join-thread')
      .setLabel('Join thread')
      .setStyle(ButtonStyle.Secondary)

    const message = await channel.messages.fetch(status.messageId)
    if (!message) {
      ctx.setFlags(64)
      return await ctx.reply('Invalid message.')
    }

    const promises = [
      message.edit(embed.build(button.build('<@&1321226585290051717>')) as any),
      prisma.status.update({
        where: {
          id: status.id
        },
        data: {
          title,
          description,
          type
        }
      })
    ]

    if (msg.length) {
      const embed = new EmbedBuilder()
        .setTitle(`${emoji[type]} ${title}`)
        .setDesc(msg)
        .setColor(colors[type])

      const thread = await message.thread?.fetch()
      if (thread) {
        promises.push(
          thread.send(
            embed.build({
              content: '@here',
              allowedMentions: {
                parse: ['everyone']
              }
            }) as any
          )
        )
      }
    }

    await Promise.allSettled(promises)
    await ctx.reply(`Status edited. Check: ${message.url}`)
  }
})
