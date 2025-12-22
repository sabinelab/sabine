import type { ClientEvents } from 'discord.js'
import type App from './App'

export type Listener<T extends keyof ClientEvents = keyof ClientEvents> = {
  name: T
  run: (client: App, ...args: ClientEvents[T]) => Promise<any>
}

export default function <T extends keyof ClientEvents>(listener: Listener<T>) {
  return listener
}
