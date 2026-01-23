import type { Args, Content } from '@i18n'
import type ModalSubmitInteractionContext from './ModalSubmitInteractionContext'

type CreateModalSubmitInteractionProps = {
  ctx: ModalSubmitInteractionContext
  t: <T extends Content>(content: T, args?: Args) => string
}

export type CreateModalSubmitInteractionOptions = {
  name: string
  isThinking?: boolean
  ephemeral?: boolean
  flags?: number
  global?: boolean
  run: (props: CreateModalSubmitInteractionProps) => Promise<unknown>
}

export default function (options: CreateModalSubmitInteractionOptions) {
  return options
}
