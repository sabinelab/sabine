import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import CommandsList from './commands-list'
import CommandsSkeleton from './commands-skeleton'

export default async function Commands() {
  const t = await getTranslations()

  return (
    <>
      <div>
        <h1 className='flex flex-col font-bold text-4xl md:text-5xl items-center pt-15'>
          {t('commands.title')}
        </h1>
      </div>

      <Suspense fallback={<CommandsSkeleton />}>
        <CommandsList />
      </Suspense>
    </>
  )
}
