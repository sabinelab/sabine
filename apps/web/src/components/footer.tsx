import { Copyright } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { env } from '@/env'

export default async function Footer() {
  const t = await getTranslations()

  return (
    <footer
      className='
          bg-[#0F0F0F]/40 md:px-30 h-110 md:h-50
          flex flex-col md:flex-row justify-between
          px-4 p-1 md:items-center mt-30
        '
    >
      <div className='flex px-4 p-1 md:px-0 items-center gap-5 text-3xl font-extrabold'>
        <Image src='/sabine.png' width={70} height={70} alt='sabine' className='rounded-2xl' />
        <span>Sabine</span>
      </div>
      <div className='flex px-4 p-1 md:px-0 md:items-center gap-2'>
        <Copyright className='hidden md:block' size={20} />
        <Copyright className='md:hidden' size={15} />
        <span className='md:text-sm text-xs'>Sabine 2025 - All rights reserved.</span>
      </div>
      <div className='flex flex-col md:flex-row gap-5 md:gap-20'>
        <div className='flex flex-col px-4 p-1 md:px-0 md:items-center'>
          <h3 className='font-extrabold text-xl'>{t('footer.contact')}</h3>
          <Link href={env.SUPPORT} className='text-base text-[#9CA3AF] underline'>
            Discord
          </Link>
        </div>
        <div className='flex flex-col px-4 p-1 md:px-0 md:items-center'>
          <h3 className='font-extrabold text-xl'>{t('footer.learn')}</h3>
          <Link href='/wiki' className='text-base text-[#9CA3AF] underline'>
            Wiki
          </Link>
          <Link href='/commands' className='text-base text-[#9CA3AF] underline'>
            {t('footer.commands')}
          </Link>
          <Link href='/guidelines' className='text-base text-[#9CA3AF] underline'>
            {t('footer.guidelines')}
          </Link>
        </div>
        <div className='flex flex-col px-4 p-1 md:px-0 md:items-center'>
          <h3 className='font-extrabold text-xl'>{t('footer.legal')}</h3>
          <Link href='/terms' className='text-base text-[#9CA3AF] underline'>
            {t('footer.terms')}
          </Link>
          <Link href='/privacy' className='text-base text-[#9CA3AF] underline'>
            {t('footer.privacy')}
          </Link>
        </div>
      </div>
    </footer>
  )
}
