import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from '@db'
import type { Blacklist } from '@generated'
import { calcPlayerPrice, getPlayers, type Player } from '@sabinelab/players'
import Queue from 'bull'
import * as Discord from 'discord.js'
import { env } from '@/env'
import { emojis } from '@/util/emojis'
import Logger from '../../util/Logger'
import { type Command, parseArguments } from '../command/createCommand'
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
  public commands = new Map<string, Command & { id: string }>()
  public aliases = new Map<string, string>()
  public prisma!: typeof prisma
  public redis: typeof Bun.redis
  public queue: typeof queue
  public interactions = new Map<
    string,
    CreateInteractionOptions & CreateModalSubmitInteractionOptions
  >()
  public players = new Map<string, Player>()
  public playerNameIndex = new Map<string, Set<string>>()
  public emoji = new Map<string, string>()
  public emojiAliases = new Map<string, string>()
  public blacklist = new Map<string, Blacklist>()
  public status = new Set<string>()

  public constructor(options: Discord.ClientOptions) {
    super(options)
    this.redis = Bun.redis
    this.queue = queue
  }

  public async load() {
    for (const file of readdirSync(path.resolve(__dirname, '../../listeners'))) {
      const listener: Listener = (await import(`../../listeners/${file}`)).default

      if (listener.name === 'clientReady') {
        this.once('clientReady', () =>
          listener.run(this).catch((e: Error) => new Logger(this).error(e))
        )
      } else {
        this.on(listener.name, (...args) =>
          listener.run(this, ...args).catch((e: Error) => new Logger(this).error(e))
        )
      }
    }

    for (const folder of readdirSync(path.resolve(__dirname, '../../commands'))) {
      for (const file of readdirSync(path.resolve(__dirname, `../../commands/${folder}`))) {
        const command: Command = (await import(`../../commands/${folder}/${file}`)).default

        if (this.commands.get(command.name)) {
          Logger.warn(`There is already a command named '${command.name}'`)
        }

        this.commands.set(command.name, {
          ...command,
          id: ''
        })

        if (command.aliases) {
          for (const alias of command.aliases) {
            this.aliases.set(alias, command.name)
          }
        }
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
    const allPlayers = getPlayers()

    for (const player of allPlayers) {
      this.players.set(player.id.toString(), {
        ...player,
        price: calcPlayerPrice(player)
      })
    }

    for (const player of allPlayers) {
      const playerName = player.name.toLowerCase()
      const similarIds = new Set<string>()

      for (const otherPlayer of allPlayers) {
        const otherPlayerName = otherPlayer.name.toLowerCase()
        if (playerName.includes(otherPlayerName) || otherPlayerName.includes(playerName)) {
          similarIds.add(otherPlayer.id.toString())
        }
      }

      this.playerNameIndex.set(playerName, similarIds)
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

  public async syncCache() {
    const [blacklist, keys] = await Promise.all([
      prisma.blacklist.findMany(),
      Bun.redis.keys('status:*')
    ])

    for (const ban of blacklist) {
      this.blacklist.set(ban.id, ban)
    }

    this.status.clear()
    for (const key of keys) {
      this.status.add(key)
    }

    setTimeout(async () => await this.syncCache().catch(e => new Logger(this).error(e)), 300_000)
  }

  public async connect() {
    this.prisma = prisma

    await this.load()
    await this.syncCache()
    await super.login(env.BOT_TOKEN)
  }
  public async postCommands() {
    const commands: Discord.ApplicationCommandData[] = []

    this.commands.forEach(cmd => {
      commands.push({
        name: cmd.name,
        nameLocalizations: cmd.nameLocalizations,
        description: cmd.description,
        descriptionLocalizations: cmd.descriptionLocalizations,
        options: parseArguments(cmd.args),
        type: 1
      })
    })

    const transformKeys = (obj: unknown): unknown => {
      if (obj === null || typeof obj !== 'object') return obj
      if (Array.isArray(obj)) return obj.map(transformKeys)

      const transformed: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(obj)) {
        const newKey =
          key === 'nameLocalizations'
            ? 'name_localizations'
            : key === 'descriptionLocalizations'
              ? 'description_localizations'
              : key
        transformed[newKey] = transformKeys(value)
      }

      return transformed
    }

    const res = (await rest.put(Discord.Routes.applicationCommands(this.user!.id), {
      body: transformKeys(commands)
    })) as {
      name: string
      id: string
    }[]

    for (const command of res) {
      const cmd = this.commands.get(command.name)
      if (!cmd) continue

      this.commands.set(command.name, {
        ...cmd,
        id: command.id
      })
    }
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
  intents: ['GuildMessages', 'Guilds', 'GuildMembers', 'MessageContent'],
  allowedMentions: {
    repliedUser: true,
    parse: ['users', 'roles']
  }
})
  .loadEmojis()
  .loadPlayers()
