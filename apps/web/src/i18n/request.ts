import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'
import us from '@/messages/en-US.json'
import br from '@/messages/pt-BR.json'
import { routing } from './routing'

const locales = {
  'pt-BR': br,
  'en-US': us
} as const

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  return {
    messages: locales[locale],
    locale
  }
})
