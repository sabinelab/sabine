import type { GuildSchema, ProfileSchema } from '@db'
import locales, { type Args, type Content } from '@i18n'
import type * as Discord from 'discord.js'
import type App from '../app/App'

type Database = {
  guild: GuildSchema
  profile: ProfileSchema
}

type CommandContextOptions = {
  app: App
  guild: Discord.Guild
  interaction: Discord.ChatInputCommandInteraction
  locale: string
  db: Database
  args: (string | number | boolean)[]
}

export default class CommandContext {
  public app: App
  public guild: Discord.Guild
  public interaction: Discord.ChatInputCommandInteraction
  public locale: string
  public db: Database
  public args: (string | number | boolean)[]

  public constructor(options: CommandContextOptions) {
    this.app = options.app
    this.guild = options.guild
    this.interaction = options.interaction
    this.locale = options.locale
    this.db = options.db
    this.args = options.args
  }

  public t<T extends Content>(content: T, args?: Args) {
    return locales<T>(this.locale, content, args)
  }

  public async reply<T extends Content>(
    content: T | Discord.InteractionReplyOptions,
    options?: Args
  ): Promise<Discord.Message | null | undefined> {
    if (typeof content === 'string') {
      content = {
        content: locales(this.locale, content, options)
      }
    }

    if (options?.files) {
      content = {
        ...content,
        files: options.files as (Discord.AttachmentBuilder | Discord.AttachmentPayload)[]
      }
    }

    if (this.interaction.replied || this.interaction.deferred) {
      return await this.interaction.followUp(content)
    } else
      return (await this.interaction.reply({ ...content, withResponse: true })).resource?.message
  }

  public async edit<T extends Content>(
    content: T | Discord.InteractionEditReplyOptions,
    options?: Args
  ): Promise<Discord.Message | null | undefined> {
    if (typeof content === 'string') {
      content = {
        content: locales(this.locale, content, options)
      }
    }

    if (options?.files) {
      content = {
        ...content,
        files: options.files as (Discord.AttachmentBuilder | Discord.AttachmentPayload)[]
      }
    }

    if (!content.components) {
      content = {
        ...content,
        components: []
      }
    }

    if (this.interaction.replied || this.interaction.deferred) {
      return await this.interaction.editReply(content)
    } else
      return (
        await this.interaction.reply({
          content: locales(this.locale, 'helper.interaction_failed'),
          flags: 64,
          withResponse: true
        })
      ).resource?.message
  }
}
