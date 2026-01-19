import { readFileSync } from 'node:fs'
import path from 'node:path'
import { GuildSchema, ProfileSchema } from '@db'
import type { Blacklist } from '@generated'
import locales from '@i18n'
import { voidCatch } from '@sabinelab/prisma'
import {
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  type Guild,
  Message,
  type PermissionResolvable,
  REST,
  type User
} from 'discord.js'
import { env } from '@/env'
import type App from '@/structures/app/App'
import CommandContext from '@/structures/command/CommandContext'
import type { CommandArguments, ResolveArguments } from '@/structures/command/createCommand'
import Logger from '@/util/Logger'

const nullCatch = () => null
const _rest = new REST().setToken(env.BOT_TOKEN)

type Props = {
  app: App
  guild: Guild
  type: number
  value: string | undefined
  interaction?: ChatInputCommandInteraction
}

type LocaleData = {
  permissions: Record<string, string>
  [key: string]: unknown
}

const raw: Record<string, LocaleData> = {
  pt: JSON.parse(readFileSync(path.resolve('src/i18n/pt.json'), 'utf-8')),
  en: JSON.parse(readFileSync(path.resolve('src/i18n/en.json'), 'utf-8')),
  es: JSON.parse(readFileSync(path.resolve('src/i18n/es.json'), 'utf-8'))
}

export class CommandManager {
  private async parseTextArgument(props: Props) {
    if (!props.value) return undefined

    switch (props.type) {
      case ApplicationCommandOptionType.String: {
        return props.value
      }
      case ApplicationCommandOptionType.Integer: {
        return Number(props.value)
      }
      case ApplicationCommandOptionType.Number: {
        return Number(props.value)
      }
      case ApplicationCommandOptionType.Boolean: {
        return props.value === 'true'
      }
      case ApplicationCommandOptionType.User: {
        const id = props.value.replace(/[<@!>]/g, '')
        return props.app.users.cache.get(id) ?? (await props.app.users.fetch(id).catch(nullCatch))
      }
      case ApplicationCommandOptionType.Channel: {
        const id = props.value.replace(/[<#>]/g, '')
        return (
          props.guild.channels.cache.get(id) ??
          (await props.guild.channels.fetch(id).catch(nullCatch))
        )
      }
      case ApplicationCommandOptionType.Role: {
        const id = props.value.replace(/[<@&>]/g, '')
        return (
          props.guild.roles.cache.get(id) ?? (await props.guild.roles.fetch(id).catch(nullCatch))
        )
      }
      default: {
        return props.value
      }
    }
  }

  private async parseMessageArguments(
    app: App,
    guild: Guild,
    argsDef: CommandArguments,
    inputArgs: string[],
    parsedNamespace: Record<string, unknown>,
    message: Message
  ): Promise<boolean> {
    const keys = Object.keys(argsDef)
    const isSubcommandLevel = keys.some(
      k =>
        argsDef[k].type === ApplicationCommandOptionType.Subcommand ||
        argsDef[k].type === ApplicationCommandOptionType.SubcommandGroup
    )

    if (isSubcommandLevel) {
      const subName = inputArgs[0]?.toLowerCase()
      if (!subName) {
        await message.reply({
          content: locales('en', 'helper.missing_argument', {
            arg: keys.join('/'),
            cmd: `</help:${app.commands.get('help')?.id}>`
          })
        })
        return false
      }

      const matchedKey = keys.find(k => argsDef[k].name === subName)
      if (matchedKey) {
        const def = argsDef[matchedKey]
        inputArgs.shift()
        parsedNamespace[matchedKey] = {}

        if (def.args) {
          return await this.parseMessageArguments(
            app,
            guild,
            def.args,
            inputArgs,
            parsedNamespace[matchedKey] as Record<string, unknown>,
            message
          )
        }
      }
      return true
    }

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const def = argsDef[key]

      const value = await this.parseTextArgument({
        app,
        guild,
        type: def.type,
        value: inputArgs[i]
      })

      if (value === undefined && def.required) {
        await message.reply({
          content: locales(
            'en',
            typeof def.required === 'string' ? def.required : 'helper.missing_argument',
            {
              arg: def.name,
              cmd: `</help:${app.commands.get('help')?.id}>`
            }
          )
        })
        return false
      }

      parsedNamespace[key] = value
    }
    return true
  }

  public async exec(app: App, data: ChatInputCommandInteraction | Message<true>) {
    if (!data.guild || !data.guildId) return

    let commandName = ''
    const args: string[] = []
    let user: User

    const guild = (await GuildSchema.fetch(data.guildId)) ?? new GuildSchema(data.guildId)

    if (data instanceof ChatInputCommandInteraction) {
      commandName = data.commandName
      user = data.user
    } else {
      if (!data.content.startsWith(guild.prefix ?? env.PREFIX)) return

      const messageArray = data.content.split(' ')
      const command = messageArray.shift()!.toLowerCase()
      const messageArgs = messageArray.slice(0)

      args.push(...messageArgs)
      user = data.author
      commandName = command.slice((guild.prefix ?? env.PREFIX).length)
    }

    const command =
      app.commands.get(commandName) || app.commands.get(app.aliases.get(commandName) ?? '')

    if (!command) return

    const rawBlacklist = await app.redis.get('blacklist')
    const blacklist: Blacklist[] = rawBlacklist ? JSON.parse(rawBlacklist) : []

    let profile = await ProfileSchema.fetch(user.id, data.guildId)

    const ban = blacklist.find(b => b.id === user.id)
    if (ban) {
      return await data.reply({
        content: locales(guild?.lang ?? 'en', 'helper.banned', {
          reason: ban.reason,
          ends: !ban.endsAt
            ? Infinity
            : `<t:${(new Date(ban.endsAt).getTime() / 1000).toFixed(0)}:F> | <t:${(new Date(ban.endsAt).getTime() / 1000).toFixed(0)}:R>`,
          when: `<t:${(new Date(ban.when).getTime() / 1000).toFixed(0)}:F> | <t:${(new Date(ban.when).getTime() / 1000).toFixed(0)}:R>`
        }),
        components: [
          {
            type: 1,
            components: [
              new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel(locales(guild?.lang ?? 'en', 'commands.help.community'))
                .setURL('https://discord.gg/g5nmc376yh')
            ]
          }
        ]
      })
    }
    if (blacklist.find(b => b.id === data.guildId)) {
      return await data.guild.leave()
    }

    if (
      !profile &&
      command.name !== 'register' &&
      ['economy', 'simulator', 'pvp', 'esports'].includes(command.category)
    ) {
      return await data.reply(
        locales(guild.lang, 'helper.you_need_to_register', {
          cmd: `</register:${app.commands.get('register')?.id}>`
        })
      )
    }
    if (!profile) {
      profile = new ProfileSchema(user.id, data.guildId)
    }

    const parsedArgs: Record<string, unknown> = {}

    const ctx = new CommandContext({
      app,
      data,
      locale: profile.lang,
      guild: data.guild,
      args: parsedArgs as ResolveArguments<CommandArguments>,
      db: {
        profile,
        guild
      },
      author: user,
      prefix: guild.prefix ?? env.PREFIX
    })

    const { permissions } = raw[ctx.locale]

    if (command.permissions) {
      const perms: PermissionResolvable[] = []

      for (const perm of command.permissions) {
        if (data instanceof ChatInputCommandInteraction && !data.memberPermissions?.has(perm)) {
          perms.push(perm)
        } else if (data instanceof Message && !data.member?.permissions.has(perm)) {
          perms.push(perm)
        }
      }

      if (perms[0])
        return await ctx.reply('helper.permissions.user', {
          permissions: perms.map(p => `\`${permissions[p.toString()]}\``).join(', ')
        })
    }

    if (command.botPermissions) {
      const perms: PermissionResolvable[] = []

      const member = app.guilds.cache.get(guild.id)?.members.cache.get(app.user?.id ?? '')

      for (const perm of command.botPermissions) {
        if (!member?.permissions.has(perm)) perms.push(perm)
      }

      if (perms[0])
        return await ctx.reply('helper.permissions.bot', {
          permissions: perms.map(p => `\`${permissions[p.toString()]}\``).join(', ')
        })
    }

    if (command.args) {
      if (data instanceof ChatInputCommandInteraction) {
        const group = data.options.getSubcommandGroup(false)
        const sub = data.options.getSubcommand(false)

        let currentArgs = command.args
        let currentParsedArgs = parsedArgs

        if (group) {
          const groupArgKey = Object.keys(currentArgs).find(k => currentArgs[k].name === group)
          if (
            groupArgKey &&
            currentArgs[groupArgKey].type === ApplicationCommandOptionType.SubcommandGroup
          ) {
            currentParsedArgs[groupArgKey] = {}
            currentParsedArgs = currentParsedArgs[groupArgKey] as Record<string, unknown>
            currentArgs = currentArgs[groupArgKey].args || {}
          }
        }

        if (sub) {
          const subArgKey = Object.keys(currentArgs).find(k => currentArgs[k].name === sub)
          if (
            subArgKey &&
            currentArgs[subArgKey].type === ApplicationCommandOptionType.Subcommand
          ) {
            currentParsedArgs[subArgKey] = {}
            currentParsedArgs = currentParsedArgs[subArgKey] as Record<string, unknown>
            currentArgs = currentArgs[subArgKey].args || {}
          }
        }

        const keys = Object.keys(currentArgs)

        for (const key of keys) {
          const argDef = currentArgs[key]
          if (
            argDef.type === ApplicationCommandOptionType.Subcommand ||
            argDef.type === ApplicationCommandOptionType.SubcommandGroup
          )
            continue

          let value: unknown

          switch (argDef.type) {
            case ApplicationCommandOptionType.String: {
              value = data.options.getString(argDef.name)
              break
            }
            case ApplicationCommandOptionType.Integer: {
              value = data.options.getInteger(argDef.name)
              break
            }
            case ApplicationCommandOptionType.Number: {
              value = data.options.getNumber(argDef.name)
              break
            }
            case ApplicationCommandOptionType.Boolean: {
              value = data.options.getBoolean(argDef.name)
              break
            }
            case ApplicationCommandOptionType.User: {
              value = data.options.getUser(argDef.name)
              break
            }
            case ApplicationCommandOptionType.Channel: {
              value = data.options.getChannel(argDef.name)
              break
            }
            case ApplicationCommandOptionType.Role: {
              value = data.options.getRole(argDef.name)
              break
            }
            case ApplicationCommandOptionType.Attachment: {
              value = data.options.getAttachment(argDef.name)
              break
            }
            default: {
              value = data.options.get(argDef.name)?.value
            }
          }

          if (!value && argDef.required) {
            return await data.reply({
              content: locales(
                'en',
                typeof argDef.required === 'string' ? argDef.required : 'helper.missing_argument',
                {
                  arg: argDef.name,
                  cmd: `</help:${app.commands.get('help')?.id}>`
                }
              )
            })
          }

          currentParsedArgs[key] = value
        }
      } else {
        const success = await this.parseMessageArguments(
          app,
          data.guild,
          command.args,
          args,
          parsedArgs,
          data
        )
        if (!success) return
      }
    }

    if (command.ephemeral) {
      if (data instanceof ChatInputCommandInteraction) {
        await data.deferReply({ flags: 64, withResponse: true }).catch(voidCatch)
      } else if (data.deletable) {
        await data.delete().catch(voidCatch)
      }
    } else if (command.isThinking) {
      if (data instanceof ChatInputCommandInteraction) {
        await data.deferReply({ withResponse: true }).catch(voidCatch)
      } else {
        await data.channel.sendTyping()
      }
    }

    const t = ctx.t.bind(ctx)

    if (command.cooldown) {
      const cooldown = await app.redis.get(`cooldown:${data.guild.id}:${user.id}`)

      if (cooldown) {
        return await ctx.reply('helper.cooldown', {
          cooldown: `<t:${(Number(cooldown) / 1000).toFixed(0)}:R>`
        })
      }

      await app.redis.set(
        `cooldown:${data.guild.id}:${user.id}`,
        (Date.now() + 5000).toString(),
        'EX',
        5
      )
    }

    command
      .run({ ctx, app, t, id: command.id })
      .then(async () => {})
      .catch(async e => {
        await ctx.reply('helper.error', { e })
        await new Logger(app).error(e)
      })
  }
}
