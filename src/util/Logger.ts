import { type APIUser, type APIWebhook, REST, Routes } from 'discord.js'
import pino from 'pino'
import { env } from '@/env'
import type App from '../structures/app/App'
import EmbedBuilder from '../structures/builders/EmbedBuilder'

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
})

const rest = new REST().setToken(env.BOT_TOKEN)

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
    const ignoredErrors = ['Missing Permissions', 'AbortError: This operation was aborted']

    if (ignoredErrors.some(e => error.toString().includes(e))) return

    if (typeof error === 'string') {
      logger.error(error)

      const embed = new EmbedBuilder()
        .setTitle('An error has occurred')
        .setDesc(`Shard ID: \`${shardId}\`\n\`\`\`js\n${error}\`\`\``)

      const client = (await rest.get(Routes.user('@me'))) as APIUser
      const webhooks = (await rest.get(Routes.channelWebhooks(env.ERROR_LOG))) as APIWebhook[]
      let webhook = webhooks.find(w => w.name === `${client.username} Logger`)

      if (!webhook) {
        webhook = (await rest.post(Routes.channelWebhooks(env.ERROR_LOG), {
          body: {
            name: `${client.username} Logger`
          }
        })) as APIWebhook
      }

      await rest.post(Routes.webhook(webhook.id, webhook.token), {
        body: {
          embeds: [embed],
          avatar_url: `https://cdn.discordapp.com/avatars/${client.id}/${client.avatar}.png`
        }
      })
    } else {
      logger.error(error.stack ?? error)

      const embed = new EmbedBuilder()
        .setTitle('An error has occurred')
        .setDesc(`Shard ID: \`${shardId}\`\n\`\`\`js\n${error.stack}\`\`\``)

      const client = (await rest.get(Routes.user('@me'))) as APIUser
      const webhooks = (await rest.get(Routes.channelWebhooks(env.ERROR_LOG))) as APIWebhook[]
      let webhook = webhooks.find(w => w.name === `${client.username} Logger`)

      if (!webhook) {
        webhook = (await rest.post(Routes.channelWebhooks(env.ERROR_LOG), {
          body: {
            name: `${client.username} Logger`
          }
        })) as APIWebhook
      }

      await rest.post(Routes.webhook(webhook.id, webhook.token), {
        body: {
          embeds: [embed],
          avatar_url: `https://cdn.discordapp.com/avatars/${client.id}/${client.avatar}.png`
        }
      })
    }
  }
}
