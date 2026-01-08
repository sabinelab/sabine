import { GuildSchema, ProfileSchema } from '@db'
import type { Blacklist } from '@generated'
import locales, { type Args, type Content } from '@i18n'
import type { ModalSubmitInteraction } from 'discord.js'
import type App from '../app/App'
import ModalSubmitInteractionContext from './ModalSubmitInteractionContext'

export default class ModalSubmitInteractionRunner {
  public async run(app: App, interaction: ModalSubmitInteraction): Promise<unknown> {
    if (!interaction.guild || !interaction.guildId) return

    const args = interaction.customId.split(';')
    const i = app.interactions.get(args[0])
    const command = app.commands.get(args[0])

    const rawBlacklist = await app.redis.get('blacklist')
    const value: Blacklist[] = rawBlacklist ? JSON.parse(rawBlacklist) : []
    const blacklist = new Map<string | null, Blacklist>(value.map(b => [b.id, b]))

    const guild = (await GuildSchema.fetch(interaction.guildId)) ?? new GuildSchema(interaction.guildId)
    const profile =
      (await ProfileSchema.fetch(interaction.user.id, interaction.guildId)) ??
      new ProfileSchema(interaction.user.id, interaction.guildId)

    if (blacklist.get(interaction.user.id)) return
    if (blacklist.get(interaction.guildId)) return

    if (i?.global && !command) {
      if (!interaction.guild || !interaction.guildId) return

      const ctx = new ModalSubmitInteractionContext({
        args,
        app: app,
        guild: interaction.guild,
        locale: profile.lang,
        db: {
          profile,
          guild
        },
        interaction
      })

      for (const component of interaction.fields.fields.values()) {
        const value = interaction.fields.getTextInputValue(component.customId)

        args.push(value)
      }

      const t = <T extends Content>(content: T, args?: Args) => {
        return locales(ctx.locale, content, args)
      }

      if (i.ephemeral) {
        await interaction.deferReply({ flags: 64 })
      } else if (i.isThinking) {
        await interaction.deferReply()
      } else if (i.flags) {
        ctx.setFlags(i.flags)
      }

      return await i.run({ ctx, t })
    }

    if (!command || !command.createModalSubmitInteraction) return

    const ctx = new ModalSubmitInteractionContext({
      args,
      app,
      guild: interaction.guild,
      locale: profile.lang,
      db: {
        profile,
        guild
      },
      interaction
    })

    const t = <T extends Content>(content: T, args?: Args) => {
      return locales(ctx.locale, content, args)
    }

    await command.createModalSubmitInteraction({ ctx, t, app, i: interaction })
  }
}
