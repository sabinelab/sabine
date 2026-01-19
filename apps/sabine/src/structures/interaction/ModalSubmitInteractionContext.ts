import type { GuildSchema, ProfileSchema } from '@db'
import locales, { type Args, type Content } from '@i18n'
import type * as Discord from 'discord.js'
import type App from '../app/App'

type Database = {
  guild: GuildSchema
  profile: ProfileSchema
}

type ModalSubmitInteractionContextOptions = {
  app: App
  guild: Discord.Guild
  interaction: Discord.ModalSubmitInteraction
  locale: string
  db: Database
  args: string[]
  author: Discord.User
}

export default class ModalSubmitInteractionContext {
  public app: App
  public guild: Discord.Guild
  public interaction: Discord.ModalSubmitInteraction
  public locale: string
  public db: Database
  public args: string[]
  public flags?: number
  public author: Discord.User

  public constructor(options: ModalSubmitInteractionContextOptions) {
    this.app = options.app
    this.guild = options.guild
    this.interaction = options.interaction
    this.locale = options.locale
    this.db = options.db
    this.args = options.args
    this.author = options.author
  }

  public setFlags(flags: number) {
    this.flags = flags
    return this
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

    if (this.flags) {
      content = {
        ...content,
        flags: this.flags
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
  ): Promise<Discord.Message> {
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
      return await this.interaction.followUp({
        content: locales(this.locale, 'helper.interaction_failed'),
        flags: 64
      })
  }
}
