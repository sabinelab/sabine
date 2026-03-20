'use client'

import { Menu } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { FaDiscord } from 'react-icons/fa'
import MobileLanguageMenu from './mobile-language-menu'

type Props = {
  commands: string
  changelog: string
  cards: string
  url: string
}

export default function MobileMenu({ cards, commands, changelog, url }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className='flex items-center justify-between relative'>
        <button onClick={() => setIsOpen(prev => !prev)}>
          <Menu />
        </button>

        {isOpen && (
          <div className='absolute top-15 right-1 bg-[#2A2A2A]/30 rounded-sm shadow-md z-50'>
            <ul className='flex flex-col gap-2 justify-center items-center p-2'>
              <li>
                <Link href='/commands' className='inline-block py-1 px-4'>
                  {commands}
                </Link>
              </li>
              <li>
                <Link href='/wiki' className='inline-block py-1 px-4'>
                  Wiki
                </Link>
              </li>
              <li>
                <Link href='/changelog' className='inline-block py-1 px-4'>
                  {changelog}
                </Link>
              </li>
              <li>
                <Link href='/cards' className='inline-block py-1 px-4'>
                  {cards}
                </Link>
              </li>
              <li>
                <Link href={url} className='inline-block py-1 px-4'>
                  <FaDiscord size={30} />
                </Link>
              </li>
              <li>
                <MobileLanguageMenu />
              </li>
            </ul>
          </div>
        )}
      </div>
    </>
  )
}
