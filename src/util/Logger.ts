import { ChannelType } from 'discord.js'
import pino from 'pino'
import App from '../structures/app/App'
import EmbedBuilder from '../structures/builders/EmbedBuilder'
import { env } from '@/env'

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
})

export default class Logger {
  private client: App

  public constructor(client: App) {
    this.client = client
  }

  public static info(message: string) {
    logger.info(message)
  }

  public static warn(message: string) {
    logger.warn(message)
  }

  public static error(error: Error) {
    logger.error(error.stack ?? error)
  }

  public async error(error: Error | string, shardId?: number) {
    const ignoredErrors = [
      'Missing Permissions',
      'AbortError: This operation was aborted'
    ]

    if(ignoredErrors.some(e => error.toString().includes(e))) return

    if(typeof error === 'string') {
      logger.error(error)

      const embed = new EmbedBuilder()
        .setTitle('An error has occurred')
        .setDesc(`Shard ID: \`${shardId}\`\n\`\`\`js\n${error}\`\`\``)

      const channel = await this.client.channels.fetch(env.GUILDS_LOG!)

      if(!channel || channel.type !== ChannelType.GuildText) return

      const webhooks = await channel.fetchWebhooks()

      let webhook = webhooks.find(w => w.name === `${this.client.user?.username} Logger`)

      if(!webhook) webhook = await channel.createWebhook({ name: `${this.client.user?.username} Logger` })

      await webhook.send({
        embeds: [embed],
        avatarURL: this.client.user?.displayAvatarURL({ size: 2048 })
      })
    }
    else {
      logger.error(error.stack ?? error)

      const embed = new EmbedBuilder()
        .setTitle('An error has occurred')
        .setDesc(`Shard ID: \`${shardId}\`\n\`\`\`js\n${error.stack}\`\`\``)

      const channel = await this.client.channels.fetch(env.ERROR_LOG!)

      if(!channel || channel.type !== ChannelType.GuildText) return

      const webhooks = await channel.fetchWebhooks()

      let webhook = webhooks.find(w => w.name === `${this.client.user?.username} Logger`)

      if(!webhook) webhook = await channel.createWebhook({ name: `${this.client.user?.username} Logger` })

      await webhook.send({
        embeds: [embed],
        avatarURL: this.client.user?.displayAvatarURL({ size: 2048 })
      })
    }
  }
}