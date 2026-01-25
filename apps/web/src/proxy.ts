import type { ProxyConfig } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config: ProxyConfig = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\.(?:css|js|png|jpg|jpeg|svg|ico|webp|xml|txt)).*)'
}
