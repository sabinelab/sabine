import * as Discord from 'discord.js'
import { GuildSchema, UserSchema } from '@/database'
import { env } from '@/env'
import type App from '@/structures/app/App'
import CommandContext from '@/structures/command/CommandContext'
import type { CommandArguments, ResolveArguments } from '@/structures/command/createCommand'
import Logger from '@/util/Logger'

type Props = {
  app: App
  guild: Discord.Guild
  type: number
  val?: string
}

export class CommandManager {
  private async parseTextArgument(props: Props) {
    if (!props.val) return undefined

    switch (props.type) {
      case Discord.ApplicationCommandOptionType.String: {
        return props.val
      }
      case Discord.ApplicationCommandOptionType.Integer: {
        return Number(props.val)
      }
      case Discord.ApplicationCommandOptionType.Number: {
        return Number(props.val)
      }
      case Discord.ApplicationCommandOptionType.Boolean: {
        return props.val === 'true'
      }
      case Discord.ApplicationCommandOptionType.User: {
        const id = props.val.replace(/[<@!>]/g, '')
        return props.app.users.cache.get(id) ?? (await props.app.users.fetch(id).catch(() => null))
      }
      case Discord.ApplicationCommandOptionType.Channel: {
        const id = props.val.replace(/[<#>]/g, '')
        return (
          props.guild.channels.cache.get(id) ??
          (await props.guild.channels.fetch(id).catch(() => null))
        )
      }
      case Discord.ApplicationCommandOptionType.Role: {
        const id = props.val.replace(/[<@&>]/g, '')
        return (
          props.guild.roles.cache.get(id) ?? (await props.guild.roles.fetch(id).catch(() => null))
        )
      }
      default: {
        return props.val
      }
    }
  }

  private async parseMessageArguments(
    app: App,
    guild: Discord.Guild,
    argsDef: CommandArguments,
    inputArgs: string[],
    parsedNamespace: Record<string, unknown>,
    message: Discord.Message
  ): Promise<boolean> {
    const keys = Object.keys(argsDef)
    const isSubcommandLevel = keys.some(
      k =>
        argsDef[k].type === Discord.ApplicationCommandOptionType.Subcommand ||
        argsDef[k].type === Discord.ApplicationCommandOptionType.SubcommandGroup
    )

    if (isSubcommandLevel) {
      const subName = inputArgs[0]?.toLowerCase()
      if (!subName) {
        await message.reply({
          content: `Missing argument: ${keys.join('/')}`
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

      const val = await this.parseTextArgument({
        app,
        guild,
        type: def.type,
        val: inputArgs[i]
      })

      if (val === undefined && def.required) {
        await message.reply({
          content: `Missing argument: ${def.name}`
        })
        return false
      }

      parsedNamespace[key] = val
    }
    return true
  }

  public async exec(app: App, data: Discord.ChatInputCommandInteraction | Discord.Message<true>) {
    if (!data.guild || !data.guildId) return

    let commandName = ''
    const args: string[] = []
    let user: Discord.User

    if (data instanceof Discord.ChatInputCommandInteraction) {
      commandName = data.commandName
      user = data.user
    } else {
      if (data.author.bot) return
      if (data.channel?.type !== Discord.ChannelType.GuildText) return
      if (!data.member) return
      if (!data.content.toLowerCase().startsWith(env.PREFIX)) return

      const messageArray = data.content.split(' ')
      const commandLabel = messageArray.shift()!.toLowerCase()
      args.push(...messageArray)
      user = data.author
      commandName = commandLabel.slice(env.PREFIX.length)
    }

    const cmd =
      app.commands.get(commandName) || app.commands.get(app.aliases.get(commandName) ?? '')

    if (!cmd) return

    if (cmd.onlyDev && user.id !== '441932495693414410') return

    if (cmd.onlyMod) {
      const member =
        data instanceof Discord.Message
          ? data.member
          : await data.guild.members.fetch(user.id).catch(() => null)
      if (
        !member ||
        !['1237458600046104617', '1237458505196114052', '1237457762502574130'].some(r =>
          member.roles.cache.has(r)
        )
      ) {
        return
      }
    }

    if (cmd.onlyBooster) {
      const member =
        data instanceof Discord.Message
          ? data.member
          : await data.guild.members.fetch(user.id).catch(() => null)
      if (!member?.premiumSince) return
    }

    if (cmd.onlyBoosterAndPremium) {
      const member =
        data instanceof Discord.Message
          ? data.member
          : await data.guild.members.fetch(user.id).catch(() => null)
      if (
        !member ||
        ![
          '1265770785893515285',
          '1314272663316856863',
          '1314272739917303888',
          '1314272766891003945'
        ].some(r => member.roles.cache.has(r))
      ) {
        return
      }
    }

    const dbUser = (await UserSchema.fetch(user.id)) ?? new UserSchema(user.id)
    const dbGuild = (await GuildSchema.fetch(data.guildId)) ?? new GuildSchema(data.guildId)

    const parsedArgs: Record<string, unknown> = {}

    if (cmd.args) {
      if (data instanceof Discord.ChatInputCommandInteraction) {
        const group = data.options.getSubcommandGroup(false)
        const sub = data.options.getSubcommand(false)

        let currentArgsDef = cmd.args
        let currentParsedArgs = parsedArgs

        if (group) {
          const groupKey = Object.keys(currentArgsDef).find(k => currentArgsDef[k].name === group)
          if (
            groupKey &&
            currentArgsDef[groupKey].type === Discord.ApplicationCommandOptionType.SubcommandGroup
          ) {
            currentParsedArgs[groupKey] = {}
            currentParsedArgs = currentParsedArgs[groupKey] as Record<string, unknown>
            currentArgsDef = currentArgsDef[groupKey].args || {}
          }
        }

        if (sub) {
          const subKey = Object.keys(currentArgsDef).find(k => currentArgsDef[k].name === sub)
          if (
            subKey &&
            currentArgsDef[subKey].type === Discord.ApplicationCommandOptionType.Subcommand
          ) {
            currentParsedArgs[subKey] = {}
            currentParsedArgs = currentParsedArgs[subKey] as Record<string, unknown>
            currentArgsDef = currentArgsDef[subKey].args || {}
          }
        }

        for (const key of Object.keys(currentArgsDef)) {
          const def = currentArgsDef[key]
          if (
            def.type === Discord.ApplicationCommandOptionType.Subcommand ||
            def.type === Discord.ApplicationCommandOptionType.SubcommandGroup
          )
            continue

          let val: unknown
          switch (def.type) {
            case Discord.ApplicationCommandOptionType.String:
              val = data.options.getString(def.name)
              break
            case Discord.ApplicationCommandOptionType.Integer:
              val = data.options.getInteger(def.name)
              break
            case Discord.ApplicationCommandOptionType.Number:
              val = data.options.getNumber(def.name)
              break
            case Discord.ApplicationCommandOptionType.Boolean:
              val = data.options.getBoolean(def.name)
              break
            case Discord.ApplicationCommandOptionType.User:
              val = data.options.getUser(def.name)
              break
            case Discord.ApplicationCommandOptionType.Channel:
              val = data.options.getChannel(def.name)
              break
            case Discord.ApplicationCommandOptionType.Role:
              val = data.options.getRole(def.name)
              break
            case Discord.ApplicationCommandOptionType.Attachment:
              val = data.options.getAttachment(def.name)
              break
            default:
              val = data.options.get(def.name)?.value
          }
          currentParsedArgs[key] = val
        }
      } else {
        const success = await this.parseMessageArguments(
          app,
          data.guild,
          cmd.args,
          args,
          parsedArgs,
          data
        )
        if (!success) return
      }
    }

    const ctx = new CommandContext({
      app,
      guild: data.guild,
      data,
      locale: dbUser.lang,
      db: {
        user: dbUser,
        guild: dbGuild
      },
      args: parsedArgs as ResolveArguments<CommandArguments>,
      author: user
    })

    const getMember = (mId: string) => {
      return data.guild!.members.cache.get(mId.replace(/[<@!>]/g, ''))
    }

    if (cmd.ephemeral) {
      if (data instanceof Discord.ChatInputCommandInteraction) {
        await data.deferReply({ flags: 64 }).catch(() => null)
      }
    } else if (cmd.isThinking) {
      if (data instanceof Discord.ChatInputCommandInteraction) {
        await data.deferReply().catch(() => null)
      } else {
        await data.channel.sendTyping()
      }
    }

    cmd.run({ ctx, app, id: cmd.name, getMember } as any).catch(e => {
      new Logger(app).error(e)
      ctx.send(`An unexpected error has occurred...\n\`${e}\``)
    })
  }
}
