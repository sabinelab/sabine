import { GuildSchema, ProfileSchema } from '@db'
import type { Blacklist } from '@generated'
import locales, { type Args, type Content } from '@i18n'
import type { MessageComponentInteraction } from 'discord.js'
import type App from '../app/App'
import ComponentInteractionContext from './ComponentInteractionContext'
import type ModalSubmitInteractionContext from './ModalSubmitInteractionContext'

export default class ComponentInteractionRunner {
  public async run(app: App, interaction: MessageComponentInteraction): Promise<unknown> {
    if (!interaction.guild || !interaction.guildId) return

    const args = interaction.customId.split(';')
    const i = app.interactions.get(args[0])
    const command = app.commands.get(args[0])

    const rawBlacklist = await app.redis.get('blacklist')
    const value: Blacklist[] = rawBlacklist ? JSON.parse(rawBlacklist) : []
    const blacklist = new Map<string | null, Blacklist>(value.map(b => [b.id, b]))

    const guild =
      (await GuildSchema.fetch(interaction.guildId)) ?? new GuildSchema(interaction.guildId)
    let profile = await ProfileSchema.fetch(interaction.user.id, interaction.guildId)

    if (blacklist.get(interaction.user.id)) return
    if (blacklist.get(interaction.guildId)) return

    if (i?.global && !command) {
      if (!interaction.guild || !interaction.guildId) return
      if (!profile) {
        profile = new ProfileSchema(interaction.user.id, interaction.guild.id)
      }

      const ctx = new ComponentInteractionContext({
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

      const t = <T extends Content>(content: T, args?: Args) => {
        return locales(ctx.locale, content, args)
      }

      if (i.ephemeral) {
        await interaction.deferReply({ flags: 64 })
      } else if (i.isThinking) {
        await interaction.deferReply()
      } else if (i.flags) {
        ctx.setFlags(64)
      }

      return await i.run({
        ctx: ctx as ComponentInteractionContext & ModalSubmitInteractionContext,
        t,
        app
      })
    }

    if (command) {
      if (!command.createMessageComponentInteraction) return
      if (!profile) {
        return await interaction.reply(
          locales(guild?.lang ?? 'en', 'helper.you_need_to_register', {
            cmd: `</register:${app.commands.get('register')?.id}>`
          })
        )
      }

      const ctx = new ComponentInteractionContext({
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

      if (
        command.messageComponentInteractionTime &&
        interaction.message.createdAt.getTime() + command.messageComponentInteractionTime <
          Date.now()
      ) {
        ctx.setFlags(64)

        return await ctx.reply('helper.unknown_interaction')
      }

      if (args[1] !== 'all' && args[1] !== interaction.user.id) {
        ctx.setFlags(64)

        return await ctx.reply('helper.this_isnt_for_you')
      }

      const t = <T extends Content>(content: T, args?: Args) => {
        return locales(ctx.locale, content, args)
      }

      return await command.createMessageComponentInteraction({
        ctx,
        t,
        i: interaction,
        app
      })
    }

    if (!i) return

    if (!profile) {
      return await interaction.reply(
        locales(guild?.lang ?? 'en', 'helper.you_need_to_register', {
          cmd: `</register:${app.commands.get('register')?.id}>`
        })
      )
    }

    const ctx = new ComponentInteractionContext({
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

    if (i.time && interaction.message.createdAt.getTime() + i.time < Date.now()) {
      ctx.setFlags(64)

      return await ctx.reply('helper.unknown_interaction')
    }

    if (args[1] !== interaction.user.id) {
      ctx.setFlags(64)

      return await ctx.reply('helper.this_isnt_for_you')
    }

    const t = <T extends Content>(content: T, args?: Args) => {
      return locales(ctx.locale, content, args)
    }

    if (i.flags) {
      ctx.setFlags(i.flags)
    } else if (i.ephemeral) {
      await interaction.deferReply({ flags: 64 })
    } else if (i.isThinking) {
      await interaction.deferReply()
    }

    await i.run({ ctx, t, app })
  }
}
