import { env } from '@/env'
import { error } from './logger'

export default async function (data: unknown[], path: string) {
  try {
    const res = await fetch(env.WEBHOOK_URL + path, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        authorization: env.AUTH
      },
      body: JSON.stringify(data)
    })

    if (!res.ok) {
      throw new Error(res.statusText)
    }
  } catch (e) {
    error(e as Error)
  }
}
