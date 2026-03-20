import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function Wiki() {
  const t = await getTranslations()

  return (
    <>
      <div>
        <h1 className='flex flex-col font-bold text-3xl md:text-5xl items-center pt-15'>
          {t('wiki.title')}
        </h1>
      </div>
      <div>
        <ul className='flex flex-col items-center justify-center pt-10'>
          <Link href='/wiki/predictions' className='hover:brightness-110'>
            <li className='bg-[#2A2A2A]/30 p-5 rounded-lg max-w-xs md:max-w-2xl mb-6 w-[700] transition duration-500 hover:scale-105  md:text-3xl'>
              {t('wiki.module.predictions.title')}
            </li>
          </Link>
          <Link href='/wiki/simulator' className='hover:brightness-110'>
            <li className='bg-[#2A2A2A]/30 p-5 rounded-lg max-w-xs md:max-w-2xl mb-6 w-[700] transition duration-500 hover:scale-105 md:text-3xl'>
              {t('wiki.module.simulator.title')}
            </li>
          </Link>
          <Link href='/wiki/cards' className='hover:brightness-110'>
            <li className='bg-[#2A2A2A]/30 p-5 rounded-lg max-w-xs md:max-w-2xl mb-6 w-[700] transition duration-500 hover:scale-105 md:text-3xl'>
              {t('wiki.module.cards.title')}
            </li>
          </Link>
          <Link href='/wiki/meta' className='hover:brightness-110'>
            <li className='bg-[#2A2A2A]/30 p-5 rounded-lg max-w-xs md:max-w-2xl w-[700] transition duration-500 hover:scale-105 md:text-3xl'>
              {t('wiki.module.meta.title')}
            </li>
          </Link>
        </ul>
      </div>
    </>
  )
}
