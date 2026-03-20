import type { Args, Content } from '@i18n'
import * as Discord from 'discord.js'
import type App from '../app/App'
import type ComponentInteractionContext from '../interaction/ComponentInteractionContext'
import type ModalSubmitInteractionContext from '../interaction/ModalSubmitInteractionContext'
import type CommandContext from './CommandContext'

type CommandArgumentType = {
  [Discord.ApplicationCommandOptionType.Subcommand]: null
  [Discord.ApplicationCommandOptionType.SubcommandGroup]: null
  [Discord.ApplicationCommandOptionType.String]: string
  [Discord.ApplicationCommandOptionType.Integer]: number
  [Discord.ApplicationCommandOptionType.Number]: number
  [Discord.ApplicationCommandOptionType.Boolean]: boolean
  [Discord.ApplicationCommandOptionType.User]: Discord.User
  [Discord.ApplicationCommandOptionType.Channel]: Discord.Channel
  [Discord.ApplicationCommandOptionType.Role]: Discord.Role
  [Discord.ApplicationCommandOptionType.Mentionable]: Discord.User | Discord.Role
  [Discord.ApplicationCommandOptionType.Attachment]: Discord.Attachment
}

type CommandArgument = {
  type: keyof CommandArgumentType
  name: string
  nameLocalizations?: Discord.LocalizationMap
  description: string
  descriptionLocalizations?: Discord.LocalizationMap
  required?: Content | boolean
  autocomplete?: boolean
  choices?: Discord.ApplicationCommandOptionChoiceData[]
  min_value?: number
  max_value?: number
  min_length?: number
  max_length?: number
  args?: CommandArguments
}

export type CommandArguments = {
  [key: string]: CommandArgument
}

export type ResolveArguments<T extends CommandArguments> = {
  [K in keyof T]: T[K]['type'] extends Discord.ApplicationCommandOptionType.Subcommand
    ?
        | (T[K]['args'] extends CommandArguments
            ? ResolveArguments<T[K]['args']>
            : Record<string, never>)
        | undefined
    : T[K]['type'] extends Discord.ApplicationCommandOptionType.SubcommandGroup
      ?
          | (T[K]['args'] extends CommandArguments
              ? ResolveArguments<T[K]['args']>
              : Record<string, never>)
          | undefined
      : T[K]['required'] extends string | boolean
        ? CommandArgumentType[T[K]['type']]
        : CommandArgumentType[T[K]['type']] | undefined
}

type CommandOptions<T extends CommandArguments> = {
  ctx: CommandContext<ResolveArguments<T>>
  app: App
  t: <K extends Content>(content: K, args?: Args) => string
  id: string
}

type CreateAutocompleteInteractionOptions = {
  i: Discord.AutocompleteInteraction
  t: <T extends Content>(content: T, args?: Args) => string
  app: App
  args?: string[]
}

type CreateComponentInteractionOptions = {
  ctx: ComponentInteractionContext
  t: <T extends Content>(content: T, args?: Args) => string
  i: Discord.MessageComponentInteraction
  app: App
}

type CreateModalSubmitInteractionOptions = {
  ctx: ModalSubmitInteractionContext
  app: App
  t: <T extends Content>(content: T, args?: Args) => string
  i: Discord.ModalSubmitInteraction
}

export type Command<T extends CommandArguments = CommandArguments> = {
  name: string
  aliases?: string[]
  nameLocalizations?: Discord.LocalizationMap
  description: string
  category: 'economy' | 'admin' | 'esports' | 'misc' | 'premium' | 'pvp'
  descriptionLocalizations?: Discord.LocalizationMap
  args?: T
  syntax?: string
  syntaxes?: string[]
  examples?: string[]
  client?: App
  permissions?: Discord.PermissionResolvable[]
  botPermissions?: Discord.PermissionResolvable[]
  onlyDev?: boolean
  ephemeral?: boolean
  isThinking?: boolean
  messageComponentInteractionTime?: number
  modalSubmitInteractionTime?: number
  cooldown?: boolean
  run: (props: CommandOptions<T>) => Promise<unknown>
  createAutocompleteInteraction?: (
    options: CreateAutocompleteInteractionOptions
  ) => Promise<unknown>
  createMessageComponentInteraction?: (
    options: CreateComponentInteractionOptions
  ) => Promise<unknown>
  createModalSubmitInteraction?: (options: CreateModalSubmitInteractionOptions) => Promise<unknown>
}

export const parseArguments = (
  args?: CommandArguments
): Discord.ApplicationCommandOptionData[] | undefined => {
  if (!args) return undefined

  return Object.values(args).map(arg => {
    const base = {
      name: arg.name,
      nameLocalizations: arg.nameLocalizations,
      description: arg.description,
      descriptionLocalizations: arg.descriptionLocalizations,
      required: typeof arg.required === 'boolean' ? arg.required : !!arg.required
    }

    if (
      arg.type === Discord.ApplicationCommandOptionType.Subcommand ||
      arg.type === Discord.ApplicationCommandOptionType.SubcommandGroup
    ) {
      return {
        ...base,
        type: arg.type,
        options: arg.args ? parseArguments(arg.args) : undefined
      } as Discord.ApplicationCommandOptionData
    }

    if (arg.type === Discord.ApplicationCommandOptionType.String) {
      return {
        ...base,
        type: arg.type,
        choices: arg.choices as Discord.ApplicationCommandOptionChoiceData<string>[] | undefined,
        minLength: arg.min_length,
        maxLength: arg.max_length,
        autocomplete: arg.autocomplete
      }
    }

    if (
      arg.type === Discord.ApplicationCommandOptionType.Integer ||
      arg.type === Discord.ApplicationCommandOptionType.Number
    ) {
      return {
        ...base,
        type: arg.type,
        choices: arg.choices as Discord.ApplicationCommandOptionChoiceData<number>[] | undefined,
        minValue: arg.min_value,
        maxValue: arg.max_value,
        autocomplete: arg.autocomplete
      }
    }

    if (arg.type === Discord.ApplicationCommandOptionType.Channel) {
      return {
        ...base,
        type: arg.type
      }
    }

    return {
      ...base,
      type: arg.type
    } as Discord.ApplicationCommandOptionData
  })
}

export default function <T extends CommandArguments>(command: Command<T>) {
  return command
}
