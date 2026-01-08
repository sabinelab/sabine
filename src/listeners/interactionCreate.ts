import { GuildSchema, UserSchema } from '@db'
import locales, { type Args } from '@i18n'
import { type Interaction, InteractionType, ModalSubmitInteraction } from 'discord.js'
import type App from '../structures/app/App'
import createListener from '../structures/app/createListener'
import CommandRunner from '../structures/command/CommandRunner'
import ComponentInteractionRunner from '../structures/interaction/ComponentInteractionRunner'
import ModalSubmitInteractionRunner from '../structures/interaction/ModalSubmitInteractionRunner'

const interactionType: Record<number, (app: App, i: Interaction) => Promise<unknown>> = {
  [InteractionType.ApplicationCommand]: async (app, interaction) => {
    if (!interaction.isChatInputCommand()) return

    return await new CommandRunner().run(app, interaction)
  },
  [InteractionType.ApplicationCommandAutocomplete]: async (app, interaction) => {
    if (!interaction.isAutocomplete()) return

    const command = app.commands.get(interaction.commandName)

    if (!command) return
    if (!command.createAutocompleteInteraction) return

    const user =
      (await UserSchema.fetch(interaction.user.id)) ?? new UserSchema(interaction.user.id)

    let guild: GuildSchema | undefined

    if (interaction.guildId) {
      guild = (await GuildSchema.fetch(interaction.guildId)) ?? new GuildSchema(interaction.guildId)
    }

    const t = (content: string, args?: Args) => {
      return locales(user.lang ?? guild?.lang, content, args)
    }

    const args: string[] = []

    const sub = interaction.options.getSubcommand(false)
    const group = interaction.options.getSubcommandGroup(false)

    if (group) args.push(group)
    if (sub) args.push(sub)

    return await command.createAutocompleteInteraction({ i: interaction, t, app, args })
  },
  [InteractionType.MessageComponent]: async (app, interaction) => {
    if (!interaction.isMessageComponent()) return

    return await new ComponentInteractionRunner().run(app, interaction)
  },
  [InteractionType.ModalSubmit]: async (app, interaction) => {
    if (!(interaction instanceof ModalSubmitInteraction)) return

    return await new ModalSubmitInteractionRunner().run(app, interaction)
  }
}
export default createListener({
  name: 'interactionCreate',
  async run(app, interaction) {
    await interactionType[interaction.type](app, interaction)
  }
})
