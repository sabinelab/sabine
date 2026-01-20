import { Search } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import Cards from './cards'
import CardsSkeleton from './cards-skeleton'

type Props = {
  searchParams?: Promise<Record<string, string>>
}

const searchAction = async (formData: FormData) => {
  'use server'

  const q = formData.get('q')?.toString()

  redirect(!q ? '/cards' : `/cards/?q=${encodeURIComponent(q)}`)
}

export default async function CardsPage({ searchParams }: Props) {
  const t = await getTranslations()

  const q = (await searchParams)?.q?.toLowerCase() ?? ''

  return (
    <>
      <div className='flex flex-col items-center gap-5'>
        <h1 className='font-bold text-4xl md:text-5xl pt-15'>{t('cards.title')}</h1>
        <form action={searchAction} className='relative md:w-full max-w-md'>
          <input
            type='text'
            placeholder={t('cards.search')}
            className='w-full rounded-lg border border-[#9CA3AF] pl-4 py-3'
            name='q'
          />
          <button type='submit'>
            <Search className='absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer' />
          </button>
        </form>
      </div>

      <Suspense fallback={<CardsSkeleton />}>
        <Cards query={q} />
      </Suspense>
    </>
  )
}
