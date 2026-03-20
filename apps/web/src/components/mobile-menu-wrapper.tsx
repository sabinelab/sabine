import { getTranslations } from 'next-intl/server'
import { env } from '@/env'
import MobileMenu from './mobile-menu'

export default async function MobileMenuWrapper() {
  const t = await getTranslations()

  return (
    <MobileMenu
      commands={t('header.commands')}
      changelog={t('header.changelog')}
      cards={t('header.cards')}
      url={env.SUPPORT}
    />
  )
}
