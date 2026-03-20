import type { Message } from 'discord.js'
import createListener from '@/structures/app/createListener'
import { CommandManager } from '@/structures/command/CommandManager'

export default createListener({
  name: 'messageCreate',
  async run(app, message) {
    if (message.author.bot) return
    new CommandManager().exec(app, message as Message<true>)
  }
})
