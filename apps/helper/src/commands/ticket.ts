import type { TextChannel } from 'discord.js'
import ButtonBuilder from '@/structures/builders/ButtonBuilder'
import createCommand from '@/structures/command/createCommand'

export default createCommand({
  name: 'ticket',
  description: 'ticket',
  onlyDev: true,
  ephemeral: true,
  async run({ app }) {
    const channel = app.channels.cache.get('1277285687074357313') as TextChannel

    const messages = await channel.messages.fetch()
    const message = messages.find(m => m.author.id === app.user?.id)

    if (!message) {
      const button = new ButtonBuilder()
        .defineStyle('blue')
        .setLabel('Create a Ticket')
        .setEmoji('🤝')
        .setCustomId('ticket')

      await channel.send({
        content:
          '## Customer Support Center\nIn this area, you can ask questions and solve issues with the bot by contacting the Sabine team.',
        components: [
          {
            type: 1,
            components: [button.toJSON()]
          }
        ]
      })
    } else {
      const button = new ButtonBuilder()
        .defineStyle('blue')
        .setLabel('Create a Ticket')
        .setEmoji('🤝')
        .setCustomId('ticket')

      await message.edit({
        content:
          '## Customer Support Center\nIn this area, you can ask questions and solve issues with the bot by contacting the Sabine team.',
        components: [
          {
            type: 1,
            components: [button.toJSON()]
          }
        ]
      })
    }
  }
})
