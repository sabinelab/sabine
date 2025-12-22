import type { Args } from '@i18n'
import type * as Discord from 'discord.js'
import type App from '../app/App'
import type ComponentInteractionContext from '../interaction/ComponentInteractionContext'
import type ModalSubmitInteractionContext from '../interaction/ModalSubmitInteractionContext'
import type CommandContext from './CommandContext'

type CommandOptions = {
  ctx: CommandContext
  app: App
  t: (content: string, args?: Args) => string
  id: string
}

type CreateAutocompleteInteractionOptions = {
  i: Discord.AutocompleteInteraction
  t: (content: string, args?: Args) => string
  app: App
  args?: string[]
}

type CreateComponentInteractionOptions = {
  ctx: ComponentInteractionContext
  t: (content: string, args?: Args) => string
  i: Discord.MessageComponentInteraction
  app: App
}

type CreateModalSubmitInteractionOptions = {
  ctx: ModalSubmitInteractionContext
  app: App
  t: (content: string, args?: Args) => string
  i: Discord.ModalSubmitInteraction
}

export type Command = {
  name: string
  nameLocalizations?: Discord.LocalizationMap
  description: string
  category: 'economy' | 'admin' | 'esports' | 'misc' | 'premium' | 'pvp'
  descriptionLocalizations?: Discord.LocalizationMap
  options?: Discord.ApplicationCommandOptionData[]
  syntax?: string
  syntaxes?: string[]
  examples?: string[]
  client?: App
  permissions?: Discord.PermissionResolvable[]
  botPermissions?: Discord.PermissionResolvable[]
  onlyDev?: boolean
  ephemeral?: boolean
  userInstall?: boolean
  isThinking?: boolean
  messageComponentInteractionTime?: number
  modalSubmitInteractionTime?: number
  cooldown?: boolean
  run: (props: CommandOptions) => Promise<unknown>
  createAutocompleteInteraction?: (options: CreateAutocompleteInteractionOptions) => Promise<unknown>
  createMessageComponentInteraction?: (options: CreateComponentInteractionOptions) => Promise<unknown>
  createModalSubmitInteraction?: (options: CreateModalSubmitInteractionOptions) => Promise<unknown>
}

export default function (command: Command) {
  return command
}
