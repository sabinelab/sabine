import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { prisma } from '@db'
import { type ApplicationCommandData, Client, type ClientOptions, REST, Routes } from 'discord.js'
import { env } from '@/env'
import { type Command, parseArguments } from '@/structures/command/createCommand'
import type { CreateInteractionOptions } from '@/structures/interaction/createComponentInteraction'
import type { CreateModalSubmitInteractionOptions } from '@/structures/interaction/createModalSubmitInteraction'
import Logger from '@/util/Logger'

const rest = new REST().setToken(env.BOT_TOKEN)

export default class App extends Client {
  public commands: Map<string, Command> = new Map()
  public aliases: Map<string, string> = new Map()
  public interactions: Map<string, CreateInteractionOptions & CreateModalSubmitInteractionOptions> =
    new Map()
  public prisma: typeof prisma

  public constructor(options: ClientOptions) {
    super(options)

    this.prisma = prisma
  }

  public async connect() {
    for (const file of readdirSync(path.join(__dirname, '../../listeners'))) {
      const listener =
        (await import(`../../listeners/${file}`)).default.default ??
        (await import(`../../listeners/${file}`)).default

      if (listener.name === 'ready')
        this.once('ready', () => listener.run(this).catch((e: Error) => new Logger(this).error(e)))
      else
        this.on(listener.name, (...args) =>
          listener.run(this, ...args).catch((e: Error) => new Logger(this).error(e))
        )
    }

    for (const file of readdirSync(path.join(__dirname, '../../commands'))) {
      const command =
        (await import(`../../commands/${file}`)).default.default ??
        (await import(`../../commands/${file}`)).default

      this.commands.set(command.name, command)

      if (command.aliases) {
        command.aliases.forEach((alias: string) => {
          this.aliases.set(alias, command.name)
        })
      }
    }

    const interactionsPath = path.join(__dirname, '../../interactions')
    if (existsSync(interactionsPath)) {
      for (const file of readdirSync(interactionsPath)) {
        const interaction =
          (await import(`../../interactions/${file}`)).default.default ??
          (await import(`../../interactions/${file}`)).default

        this.interactions.set(interaction.name, interaction)
      }
    }

    await super.login(env.BOT_TOKEN)
  }

  public async postCommands() {
    const commands: ApplicationCommandData[] = []

    this.commands.forEach(cmd => {
      commands.push({
        name: cmd.name,
        description: cmd.description,
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

    await rest.put(Routes.applicationCommands(this.user!.id), {
      body: transformKeys(commands)
    })
  }
}

export const app = new App({
  allowedMentions: {
    parse: ['users', 'roles'],
    repliedUser: true
  },
  intents: ['GuildMessages', 'GuildMembers', 'GuildBans', 'Guilds', 'MessageContent']
})
