import type { GuildSchema, UserSchema } from '@db'
import * as Discord from 'discord.js'
import type App from '../app/App'

type Database = {
  guild: GuildSchema
  user: UserSchema
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

  get message() {
    return this.data instanceof Discord.Message ? this.data : null
  }

  public async send<T extends string>(
    content: T | Discord.InteractionReplyOptions | Discord.MessageReplyOptions,
    files?: Discord.AttachmentPayload[] | Discord.AttachmentBuilder[] | Discord.Attachment[]
  ): Promise<Discord.Message | null | undefined> {
    if (this.data instanceof Discord.BaseInteraction) {
      const payload =
        typeof content === 'string'
          ? {
              content
            }
          : (content as Discord.InteractionReplyOptions)

      if (files) {
        payload.files = files
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
              content
            }
          : (content as Discord.MessageReplyOptions)

      if (files) {
        payload.files = files
      }

      return await this.data.channel.send(payload)
    }
  }

  public async edit<T extends string>(
    content: T | Discord.InteractionEditReplyOptions | Discord.MessageEditOptions,
    files?: Discord.AttachmentPayload[] | Discord.AttachmentBuilder[] | Discord.Attachment[]
  ): Promise<Discord.Message | null | undefined> {
    if (this.data instanceof Discord.BaseInteraction) {
      const payload =
        typeof content === 'string'
          ? {
              content
            }
          : (content as Discord.InteractionEditReplyOptions)

      if (files) {
        payload.files = files
      }

      return await this.data.editReply(payload)
    } else {
      const payload =
        typeof content === 'string'
          ? {
              content
            }
          : (content as Discord.MessageEditOptions)

      if (files) {
        payload.files = files
      }

      return await this.data.edit(payload)
    }
  }
}
