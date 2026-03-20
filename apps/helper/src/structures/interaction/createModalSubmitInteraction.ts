import type ModalSubmitInteractionContext from './ModalSubmitInteractionContext'

type CreateModalSubmitInteractionProps = {
  ctx: ModalSubmitInteractionContext
}

export type CreateModalSubmitInteractionOptions = {
  name: string
  isThinking?: boolean
  ephemeral?: boolean
  flags?: number
  global?: boolean
  run: (props: CreateModalSubmitInteractionProps) => Promise<any>
}

export default function (options: CreateModalSubmitInteractionOptions) {
  return options
}
