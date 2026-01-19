import type * as Discord from 'discord.js'
import en from './en.json'
import es from './es.json'
import pt from './pt.json'

export type Args = {
  [key: string]:
    | string
    | Error
    | number
    | (Discord.AttachmentBuilder | Discord.AttachmentPayload)[]
    | undefined
    | null
    | bigint
}

export type Content = Keys<Locale> | (string & {})

type Locale = typeof en

type Keys<T> = T extends object
  ? {
      [K in keyof T]: K extends string ? (T[K] extends object ? `${K}.${Keys<T[K]>}` : K) : never
    }[keyof T]
  : never

const locale: Record<string, unknown> = {
  en,
  pt,
  es
}

export default function t<T extends Content>(lang: string, content: T, args?: Args): string {
  let json: unknown = locale[lang]

  for (const param of content.split('.')) {
    if (json && typeof json === 'object') {
      json = (json as Record<string, unknown>)[param]
    } else {
      return content
    }

    if (!json) return content
  }

  if (Array.isArray(json)) {
    json = json.map(c => c).join('\n')
  }

  if (typeof json !== 'string') {
    return content
  }

  let result = json

  if (args) {
    for (const arg of Object.keys(args)) {
      result = result.replaceAll(`{${arg}}`, args[arg] as string)
    }
  }

  return result
}
