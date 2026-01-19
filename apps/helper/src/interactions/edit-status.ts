import { TextInputStyle } from 'discord.js'
import { emoji } from '@/commands/status'
import createComponentInteraction from '@/structures/interaction/createComponentInteraction'
import { prisma } from '@db'

export default createComponentInteraction({
  name: 'edit-status',
  async run({ ctx }) {
    if (ctx.author.id !== '441932495693414410') return

    const status = await prisma.status.findUnique({
      where: {
        id: BigInt(ctx.args[1])
      }
    })

    if (!status) {
      ctx.setFlags(64)
      return await ctx.reply('Status not found.')
    }

    await ctx.interaction.showModal({
      customId: `edit-status-modal;${status.id}`,
      title: 'Edit status',
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              customId: 'edit-status-modal-response-1',
              label: 'Title',
              style: TextInputStyle.Short,
              minLength: 2,
              required: true,
              value: status.title
            }
          ]
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              customId: 'edit-status-modal-response-2',
              label: 'Description',
              style: TextInputStyle.Paragraph,
              minLength: 2,
              required: true,
              value: status.description
            }
          ]
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              customId: 'edit-status-modal-response-3',
              label: 'Type',
              placeholder: `Ex.: ${Object.keys(emoji).join(' | ')}`,
              style: TextInputStyle.Paragraph,
              minLength: 2,
              required: true,
              value: status.type
            }
          ]
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              customId: 'edit-status-modal-response-4',
              label: 'Message',
              style: TextInputStyle.Paragraph,
              minLength: 2,
              required: false
            }
          ]
        }
      ]
    })
  }
})
