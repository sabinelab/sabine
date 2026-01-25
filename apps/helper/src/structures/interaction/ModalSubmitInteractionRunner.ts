import { GuildSchema, UserSchema } from '@db'
import type { ModalSubmitInteraction } from 'discord.js'
import type { CreateModalSubmitInteractionOptions } from '@/structures/interaction/createModalSubmitInteraction'
import type App from '../app/App'
import ModalSubmitInteractionContext from './ModalSubmitInteractionContext'

export default class ModalSubmitInteractionRunner {
  public async run(app: App, interaction: ModalSubmitInteraction): Promise<unknown> {
    if (!interaction.guild || !interaction.guildId) return

    const args = interaction.customId.split(';')
    const i = app.interactions.get(args[0])

    const guild =
      (await GuildSchema.fetch(interaction.guildId)) ?? new GuildSchema(interaction.guildId)
    const user =
      (await UserSchema.fetch(interaction.user.id)) ?? new UserSchema(interaction.user.id)

    if (!i) return

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

    await (i as CreateModalSubmitInteractionOptions).run({ ctx })
  }
}
