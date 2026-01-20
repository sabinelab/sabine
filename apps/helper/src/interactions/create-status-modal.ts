import { prisma } from '@db'
import { ButtonStyle, ChannelType } from 'discord.js'
import { colors, emoji } from '@/commands/status'
import { env } from '@/env'
import ButtonBuilder from '@/structures/builders/ButtonBuilder'
import EmbedBuilder from '@/structures/builders/EmbedBuilder'
import createModalSubmitInteraction from '@/structures/interaction/createModalSubmitInteraction'

export default createModalSubmitInteraction({
  name: 'create-status-modal',
  ephemeral: true,
  async run({ ctx }) {
    if (ctx.author.id !== '441932495693414410') return

    const title = ctx.interaction.fields.getTextInputValue('create-status-modal-response-1')
    const description = ctx.interaction.fields.getTextInputValue('create-status-modal-response-2')
    const type = ctx.interaction.fields
      .getTextInputValue('create-status-modal-response-3')
      .toUpperCase() as keyof typeof emoji

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

    const message = await channel.send(embed.build(button.build({
      content: '<@&1321226585290051717> @here',
      allowedMentions: {
        parse: ['everyone']
      }
    })) as any)
    await message.crosspost()

    const thread = await message.startThread({
      name: title
    })

    await prisma.status.create({
      data: {
        title,
        description,
        type,
        messageId: message.id,
        threadId: thread.id
      }
    })

    await ctx.reply(`Status created. Check: ${thread.toString()}`)
  }
})
