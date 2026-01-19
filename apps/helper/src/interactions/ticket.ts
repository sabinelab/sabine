import { ChannelType, OverwriteType, PermissionFlagsBits } from 'discord.js'
import createComponentInteraction from '@/structures/interaction/createComponentInteraction'

export default createComponentInteraction({
  name: 'ticket',
  async run({ ctx }) {
    if (!ctx.guild) return

    await ctx.interaction.deferReply({
      flags: 64
    })

    const channels = ctx.guild.channels.cache.filter(c => c.parentId === '1277285123070361673')

    if (channels.some(ch => ch.name.includes(ctx.interaction.user.id))) {
      return await ctx.interaction.editReply({
        content: 'You already have an open ticket. Please wait until a moderator deletes it.'
      })
    }

    const channel = await ctx.guild.channels.create({
      name: `ticket_${ctx.interaction.user.id}`,
      type: ChannelType.GuildText,
      parent: '1277285123070361673',
      permissionOverwrites: [
        {
          id: ctx.guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
          type: OverwriteType.Role
        },
        {
          id: '1237457762502574130',
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.AttachFiles
          ],
          type: OverwriteType.Role
        },
        {
          id: ctx.interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.AttachFiles
          ],
          type: OverwriteType.Member
        }
      ]
    })

    const msg = await channel.send({
      content: `${ctx.interaction.user.toString()} Ticket successfully created! Someone will reach out to you soon.\n- While you wait, describe what you need help with.\n- Don't mention anyone — just be patient.`,
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: 'Close',
              style: 4, // Danger
              customId: 'close-ticket',
              emoji: {
                name: '🔒'
              }
            }
          ]
        }
      ]
    })

    await ctx.interaction.editReply({ content: `Ticket created successfully!\n${msg.url}` })
  }
})
