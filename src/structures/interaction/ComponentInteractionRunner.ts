import type { MessageComponentInteraction } from 'discord.js'
import App from '../app/App'
import ComponentInteractionContext from './ComponentInteractionContext'
import { SabineGuild, SabineUser } from '@db'
import locales, { type Args, type Content } from '@i18n'
import type { Blacklist } from '@generated'
import type ModalSubmitInteractionContext from './ModalSubmitInteractionContext'

export default class ComponentInteractionRunner {
  public async run(
    app: App,
    interaction: MessageComponentInteraction
  ): Promise<unknown> {
    const args = interaction.customId.split(';')
    const i = app.interactions.get(args[0])
    const command = app.commands.get(args[0])

    const rawBlacklist = await app.redis.get('blacklist')
    const value: Blacklist[] = rawBlacklist ? JSON.parse(rawBlacklist) : []
    const blacklist = new Map<string | null, Blacklist>(value.map(b => [b.id, b]))

    if(blacklist.get(interaction.user.id)) return
    if(blacklist.get(interaction.guildId)) return

    if(i?.global && !command) {
      if(!interaction.guild || !interaction.guildId) return

      const guild = await SabineGuild.fetch(interaction.guildId) ?? new SabineGuild(interaction.guildId)
      const user = await SabineUser.fetch(interaction.user.id) ?? new SabineUser(interaction.user.id)

      const ctx = new ComponentInteractionContext({
        args,
        app: app,
        guild: interaction.guild,
        locale: user.lang,
        db: {
          user,
          guild
        },
        interaction
      })

      const t = <T extends Content>(content: T, args?: Args) => {
        return locales(ctx.locale, content, args)
      }

      if(i.ephemeral) {
        await interaction.deferReply({ flags: 64 })
      }

      else if(i.isThinking) {
        await interaction.deferReply()
      }

      else if(i.flags) {
        ctx.setFlags(64)
      }

      return await i.run({
        ctx: ctx as ComponentInteractionContext & ModalSubmitInteractionContext,
        t,
        app
      })
    }

    if(command) {
      if(!command.createMessageComponentInteraction) return

      let guild: SabineGuild | undefined

      if(interaction.guildId) {
        guild = await SabineGuild.fetch(interaction.guildId) ?? new SabineGuild(interaction.guildId)
      }

      const user = await SabineUser.fetch(interaction.user.id)

      if(!user) {
        return await interaction.reply(locales(guild?.lang ?? 'en', 'helper.you_need_to_register'))
      }

      const ctx = new ComponentInteractionContext({
        args,
        app: app,
        guild: interaction.guild,
        locale: user.lang,
        db: {
          user,
          guild
        },
        interaction
      })

      if(
        command.messageComponentInteractionTime &&
        interaction.message.createdAt.getTime() + command.messageComponentInteractionTime < Date.now()
      ) {
        ctx.setFlags(64)

        return await ctx.reply('helper.unknown_interaction')
      }

      if(args[1] !== 'all' && args[1] !== interaction.user.id) {
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

    if(!i) return

    const user = await SabineUser.fetch(interaction.user.id)

    let guild: SabineGuild | undefined

    if(interaction.guildId) {
      guild = await SabineGuild.fetch(interaction.guildId) ?? new SabineGuild(interaction.guildId)
    }

    if(!user) {
      return await interaction.reply(locales(guild?.lang ?? 'en', 'helper.you_need_to_register'))
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
      interaction
    })

    if(
      i.time &&
      (interaction.message.createdAt.getTime() + i.time) < Date.now()
    ) {
      ctx.setFlags(64)

      return await ctx.reply('helper.unknown_interaction')
    }

    if(args[1] !== interaction.user.id) {
      ctx.setFlags(64)

      return await ctx.reply('helper.this_isnt_for_you')
    }

    const t = <T extends Content>(content: T, args?: Args) => {
      return locales(ctx.locale, content, args)
    }

    if(i.flags) {
      ctx.setFlags(i.flags)
    }

    else if(i.ephemeral) {
      await interaction.deferReply({ flags: 64 })
    }

    else if(i.isThinking) {
      await interaction.deferReply()
    }

    await i.run({ ctx, t, app })
  }
}