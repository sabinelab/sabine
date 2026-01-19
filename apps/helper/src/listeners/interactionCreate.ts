import { InteractionType } from 'discord.js'
import createListener from '@/structures/app/createListener'
import { CommandManager } from '@/structures/command/CommandManager'
import ComponentInteractionRunner from '@/structures/interaction/ComponentInteractionRunner'
import ModalSubmitInteractionRunner from '@/structures/interaction/ModalSubmitInteractionRunner'

export default createListener({
  name: 'interactionCreate',
  async run(app, interaction) {
    if (interaction.type === InteractionType.ApplicationCommand) {
      if (!interaction.isChatInputCommand()) return
      return await new CommandManager().exec(app, interaction)
    }

    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      if (!interaction.isAutocomplete()) return

      const command = app.commands.get(interaction.commandName)
      if (!command || !command.createAutocompleteInteraction || !interaction.guildId) return

      const args: string[] = []
      const sub = interaction.options.getSubcommand(false)
      const group = interaction.options.getSubcommandGroup(false)

      if (group) args.push(group)
      if (sub) args.push(sub)

      return await command.createAutocompleteInteraction({ i: interaction, app, args })
    }

    if (interaction.type === InteractionType.MessageComponent) {
      return await new ComponentInteractionRunner().run(app, interaction)
    }

    if (interaction.isModalSubmit()) {
      return await new ModalSubmitInteractionRunner().run(app, interaction)
    }
  }
})
