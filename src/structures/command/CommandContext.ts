import type { GuildSchema, ProfileSchema } from '@db'
import locales, { type Args, type Content } from '@i18n'
import * as Discord from 'discord.js'
import type App from '../app/App'

type Database = {
  guild: GuildSchema
  profile: ProfileSchema
}

type CommandContextOptions<T> = {
  app: App
  guild: Discord.Guild
  data: Discord.ChatInputCommandInteraction | Discord.Message<true>
  locale: string
  db: Database
  args: T
  author: Discord.User
}

export default class CommandContext<T> {
  public app: App
  public guild: Discord.Guild
  public data: Discord.ChatInputCommandInteraction | Discord.Message<true>
  public locale: string
  public db: Database
  public args: T
  public author: Discord.User

  public constructor(options: CommandContextOptions<T>) {
    this.app = options.app
    this.guild = options.guild
    this.data = options.data
    this.locale = options.locale
    this.db = options.db
    this.args = options.args
    this.author = options.author
  }

  public t<T extends Content>(content: T, args?: Args) {
    return locales<T>(this.locale, content, args)
  }

  public async reply<T extends Content>(
    content: T | Discord.InteractionReplyOptions | Discord.MessageReplyOptions,
    options?: Args
  ): Promise<Discord.Message | null | undefined> {
    if (this.data instanceof Discord.BaseInteraction) {
      const payload =
        typeof content === 'string'
          ? {
              content: locales(this.locale, content, options)
            }
          : (content as Discord.InteractionReplyOptions)

      if (options?.files) {
        payload.files = options.files as Discord.AttachmentPayload[]
      }

      if (this.data.replied || this.data.deferred) {
        return await this.data.followUp(payload)
      } else {
        return (
          await this.data.reply({
            ...payload,
            withResponse: true
          })
        ).resource?.message
      }
    } else {
      const payload =
        typeof content === 'string'
          ? {
              content: locales(this.locale, content, options)
            }
          : (content as Discord.MessageReplyOptions)

      if (options?.files) {
        payload.files = options.files as Discord.AttachmentPayload[]
      }

      return await this.data.reply(payload)
    }
  }

  public async edit<T extends Content>(
    content: T | Discord.InteractionEditReplyOptions | Discord.MessageEditOptions,
    options?: Args
  ): Promise<Discord.Message | null | undefined> {
    if (this.data instanceof Discord.BaseInteraction) {
      const payload =
        typeof content === 'string'
          ? {
              content: locales(this.locale, content, options)
            }
          : (content as Discord.InteractionEditReplyOptions)

      if (options?.files) {
        payload.files = options.files as Discord.AttachmentPayload[]
      }

      return await this.data.editReply(payload)
    } else {
      const payload =
        typeof content === 'string'
          ? {
              content: locales(this.locale, content, options)
            }
          : (content as Discord.MessageEditOptions)

      if (options?.files) {
        payload.files = options.files as Discord.AttachmentPayload[]
      }

      return await this.data.edit(payload)
    }
  }
}
