import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from '@db'
import { calcPlayerPrice, getPlayers, type Player } from '@sabinelab/players'
import Queue from 'bull'
import * as Discord from 'discord.js'
import { env } from '@/env'
import { emojis } from '@/util/emojis'
import Logger from '../../util/Logger'
import type { Command } from '../command/createCommand'
import type { CreateInteractionOptions } from '../interaction/createComponentInteraction'
import type { CreateModalSubmitInteractionOptions } from '../interaction/createModalSubmitInteraction'
import type { Listener } from './createListener'

type Reminder = {
  user: string
  channel: string
  guild: string
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const queue = new Queue<Reminder>('reminder', {
  redis: env.REDIS_URL
})

const rest = new Discord.REST().setToken(env.BOT_TOKEN)

export default class App extends Discord.Client {
  public commands: Map<string, Command> = new Map()
  public prisma!: typeof prisma
  public redis: typeof Bun.redis
  public queue: typeof queue
  public interactions: Map<string, CreateInteractionOptions & CreateModalSubmitInteractionOptions> = new Map()
  public players = new Map<string, Player>()
  public emoji = new Map<string, string>()
  public emojiAliases = new Map<string, string>()

  public constructor(options: Discord.ClientOptions) {
    super(options)
    this.redis = Bun.redis
    this.queue = queue
  }

  public async load() {
    for (const file of readdirSync(path.resolve(__dirname, '../../listeners'))) {
      const listener: Listener = (await import(`../../listeners/${file}`)).default

      if (listener.name === 'ready')
        this.once('ready', () => listener.run(this).catch((e: Error) => new Logger(this).error(e)))
      else
        this.on(listener.name, (...args) => listener.run(this, ...args).catch((e: Error) => new Logger(this).error(e)))
    }

    for (const folder of readdirSync(path.resolve(__dirname, '../../commands'))) {
      for (const file of readdirSync(path.resolve(__dirname, `../../commands/${folder}`))) {
        const command: Command = (await import(`../../commands/${folder}/${file}`)).default

        if (this.commands.get(command.name)) {
          Logger.warn(`There is already a command named '${command.name}'`)
        }

        this.commands.set(command.name, command)
      }
    }

    for (const folder of readdirSync(path.resolve(__dirname, '../../interactions'))) {
      for (const file of readdirSync(path.resolve(__dirname, `../../interactions/${folder}`))) {
        const interaction = (await import(`../../interactions/${folder}/${file}`)).default

        if (this.interactions.get(interaction.name)) {
          Logger.warn(`There is already an interaction named '${interaction.name}'`)
        }

        this.interactions.set(interaction.name, interaction)
      }
    }
  }

  public loadPlayers() {
    for (const player of getPlayers()) {
      this.players.set(player.id.toString(), {
        ...player,
        price: calcPlayerPrice(player)
      })
    }

    return this
  }

  public loadEmojis() {
    for (const emoji of emojis) {
      this.emoji.set(emoji.name, emoji.emoji)

      if (emoji.aliases) {
        for (const alias of emoji.aliases) {
          this.emojiAliases.set(alias, emoji.name)
        }
      }
    }

    return this
  }

  public async connect() {
    this.prisma = prisma

    await this.load()
    await super.login(env.BOT_TOKEN)
  }
  public async postCommands() {
    const commands: Discord.ApplicationCommandData[] = []

    this.commands.forEach(cmd => {
      const integrationTypes = [Discord.ApplicationIntegrationType.GuildInstall]

      const contexts = [Discord.InteractionContextType.Guild]

      if (cmd.userInstall) {
        integrationTypes.push(Discord.ApplicationIntegrationType.UserInstall)
        contexts.push(Discord.InteractionContextType.BotDM, Discord.InteractionContextType.PrivateChannel)
      }

      commands.push({
        name: cmd.name,
        nameLocalizations: cmd.nameLocalizations,
        description: cmd.description,
        descriptionLocalizations: cmd.descriptionLocalizations,
        options: cmd.options,
        type: 1,
        integrationTypes,
        contexts
      })
    })

    await rest.put(Discord.Routes.applicationCommands(this.user!.id), {
      body: commands
    })
  }

  public async getUser(id: string) {
    let user = this.users.cache.get(id)

    if (!user) {
      user = await this.users.fetch(id, { cache: true })
    }

    return user
  }
}

export const app = new App({
  intents: ['GuildMessages', 'Guilds', 'GuildMembers'],
  allowedMentions: {
    repliedUser: true,
    parse: ['users', 'roles']
  }
})
  .loadEmojis()
  .loadPlayers()
