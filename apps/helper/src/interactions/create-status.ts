import { TextInputStyle } from 'discord.js'
import { emoji } from '@/commands/status'
import createComponentInteraction from '@/structures/interaction/createComponentInteraction'

export default createComponentInteraction({
  name: 'create-status',
  async run({ ctx }) {
    if (ctx.author.id !== '441932495693414410') return

    await ctx.interaction.showModal({
      customId: 'create-status-modal',
      title: 'Create status',
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              customId: 'create-status-modal-response-1',
              label: 'Title',
              style: TextInputStyle.Short,
              minLength: 2,
              required: true
            }
          ]
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              customId: 'create-status-modal-response-2',
              label: 'Description',
              style: TextInputStyle.Paragraph,
              minLength: 2,
              required: true
            }
          ]
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              customId: 'create-status-modal-response-3',
              label: 'Type',
              placeholder: `Ex.: ${Object.keys(emoji).join(' | ')}`,
              style: TextInputStyle.Paragraph,
              minLength: 2,
              required: true
            }
          ]
        }
      ]
    })
  }
})
