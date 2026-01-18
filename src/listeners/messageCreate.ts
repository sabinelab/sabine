import { ChannelType, type Message } from 'discord.js'
import { env } from '@/env'
import createListener from '@/structures/app/createListener'
import { CommandManager } from '@/structures/command/CommandManager'

export default createListener({
  name: 'messageCreate',
  async run(app, message) {
    if (
      message.author.bot ||
      message.channel.type !== ChannelType.GuildText ||
      !message.content.startsWith(env.PREFIX)
    )
      return

    new CommandManager().exec(app, message as Message<true>)
  }
})
