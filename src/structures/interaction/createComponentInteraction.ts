import type { Args } from '@i18n'
import type App from '../app/App'
import type ComponentInteractionContext from './ComponentInteractionContext'

type CreateInteractionProps = {
  ctx: ComponentInteractionContext
  t: (content: string, args?: Args) => string
  app: App
}

export type CreateInteractionOptions = {
  name: string
  isThinking?: boolean
  ephemeral?: boolean
  flags?: number
  run: (props: CreateInteractionProps) => Promise<any>
  time?: number
  global?: boolean
}

export default function (component: CreateInteractionOptions) {
  return component
}
