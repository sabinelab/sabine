import { GuildSchema, UserSchema } from '@db'
import type { ModalSubmitInteraction } from 'discord.js'
import type App from '../app/App'
import ModalSubmitInteractionContext from './ModalSubmitInteractionContext'

export default class ModalSubmitInteractionRunner {
  public async run(app: App, interaction: ModalSubmitInteraction): Promise<unknown> {
    if (!interaction.guild || !interaction.guildId) return

    const args = interaction.customId.split(';')
    const i = app.interactions.get(args[0])
    const command = app.commands.get(args[0])

    const guild =
      (await GuildSchema.fetch(interaction.guildId)) ?? new GuildSchema(interaction.guildId)
    const user =
      (await UserSchema.fetch(interaction.user.id)) ?? new UserSchema(interaction.user.id)

    if (i?.global && !command) {
      if (!interaction.guild || !interaction.guildId) return

      const ctx = new ModalSubmitInteractionContext({
        args,
        app: app,
        guild: interaction.guild,
        locale: user.lang,
        db: {
          user,
          guild
        },
        interaction,
        author: interaction.user
      })

      for (const component of interaction.fields.fields.values()) {
        const value = interaction.fields.getTextInputValue(component.customId)

        args.push(value)
      }

      if (i.ephemeral) {
        await interaction.deferReply({ flags: 64 })
      } else if (i.isThinking) {
        await interaction.deferReply()
      } else if (i.flags) {
        ctx.setFlags(i.flags)
      }

      return await i.run({ ctx })
    }

    if (!command || !command.createModalSubmitInteraction) return

    const ctx = new ModalSubmitInteractionContext({
      args,
      app,
      guild: interaction.guild,
      locale: user.lang,
      db: {
        user,
        guild
      },
      interaction,
      author: interaction.user
    })

    await command.createModalSubmitInteraction({ ctx, app, i: interaction })
  }
}
