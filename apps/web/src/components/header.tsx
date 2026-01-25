import { BookCheck, CopySlash, NotebookText, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { FaDiscord } from 'react-icons/fa'
import { env } from '@/env'
import LanguageMenu from './language-menu'
import MobileMenuWrapper from './mobile-menu-wrapper'

export default async function Header() {
  const t = await getTranslations()

  return (
    <header className='flex justify-between p-4'>
      <div className='flex items-center md:px-10 gap-10'>
        <Link href='/' className='transition duration-300 hover:scale-125'>
          <Image
            src='/header/sabine.png'
            width={80}
            height={80}
            alt='sabine'
            className='rounded-full'
          />
        </Link>

        <ul className='hidden text-lg md:flex'>
          <li className='transition duration-300 hover:scale-105 hover:bg-[#333333]/30 rounded-lg'>
            <Link href='/commands' className='flex items-center gap-2 px-4 py-2'>
              <CopySlash size={20} />
              {t('header.commands')}
            </Link>
          </li>

          <li className='transition duration-300 hover:scale-105 hover:bg-[#333333]/30 rounded-lg'>
            <Link href='/wiki' className='flex items-center gap-2 px-4 py-2'>
              <BookCheck size={20} />
              Wiki
            </Link>
          </li>

          <li className='transition duration-300 hover:scale-105 hover:bg-[#333333]/30 rounded-lg'>
            <Link href='/changelog' className='flex items-center gap-2 px-4 py-2'>
              <NotebookText size={20} />
              {t('header.changelog')}
            </Link>
          </li>
          <li className='transition duration-300 hover:scale-105 hover:bg-[#333333]/30 rounded-lg'>
            <Link href='/cards' className='flex items-center gap-2 px-4 py-2'>
              <Users size={20} />
              {t('header.cards')}
            </Link>
          </li>
        </ul>
      </div>
      <div className='flex items-center md:px-10'>
        <ul className='hidden text-2xl md:flex items-center gap-2'>
          <li className='transition duration-300 hover:scale-105 hover:bg-[#333333]/30 rounded-lg'>
            <Link href={env.SUPPORT} className='flex gap-2 px-4 py-2'>
              <FaDiscord size={30} />
            </Link>
          </li>
          <li>
            <LanguageMenu />
          </li>
        </ul>
      </div>
      <div className='flex md:hidden'>
        <MobileMenuWrapper />
      </div>
    </header>
  )
}
