import { GuildSchema, UserSchema } from '@db'
import type { MessageComponentInteraction } from 'discord.js'
import type App from '../app/App'
import ComponentInteractionContext from './ComponentInteractionContext'

export default class ComponentInteractionRunner {
  public async run(app: App, interaction: MessageComponentInteraction): Promise<unknown> {
    if (!interaction.guild || !interaction.guildId) return

    const args = interaction.customId.split(';')
    const i = app.interactions.get(args[0])

    const guild =
      (await GuildSchema.fetch(interaction.guildId)) ?? new GuildSchema(interaction.guildId)
    const user = await UserSchema.fetch(interaction.user.id)

    if (!i) return

    if (!user) {
      return await interaction.reply({
        content: 'You need to register first.',
        flags: 64
      })
    }

    const ctx = new ComponentInteractionContext({
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

    if (i.flags) {
      ctx.setFlags(i.flags)
    } else if (i.ephemeral) {
      await interaction.deferReply({ flags: 64 })
    } else if (i.isThinking) {
      await interaction.deferReply()
    }

    await i.run({ ctx, app })
  }
}
