import type { GuildSchema, UserSchema } from '@db'
import type * as Discord from 'discord.js'
import type App from '../app/App'

type Database = {
  guild: GuildSchema
  user: UserSchema
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

  public async reply(
    content: string | Discord.InteractionReplyOptions
  ): Promise<Discord.Message | null | undefined> {
    if (typeof content === 'string') {
      content = {
        content
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

  public async edit(
    content: string | Discord.InteractionEditReplyOptions
  ): Promise<Discord.Message> {
    if (typeof content === 'string') {
      content = {
        content
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
        content: 'Interaction failed',
        flags: 64
      })
  }
}
