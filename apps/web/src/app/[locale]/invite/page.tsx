import { redirect } from 'next/navigation'
import { env } from '@/env'

export default function Invite() {
  redirect(env.INVITE)
}
