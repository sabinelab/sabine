import { NextResponse } from 'next/server'
import { env } from '@/env'

export const GET = async () => {
  const res = await fetch(env.API_URL + '/updates', {
    headers: {
      authorization: env.AUTH
    }
  })
  const data = await res.json()

  return NextResponse.json(data)
}
