'use client'

import { Transition } from '@headlessui/react'
import { Languages } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { locales } from '../../config'

export default function LanguageMenu() {
  const [isOpen, setIsOpen] = useState(false)

  const router = useRouter()

  const changeLanguage = (lang: (typeof locales)[number]) => {
    document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000; SameSite=Lax`
    router.refresh()
  }

  return (
    <>
      <div
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className='relative inline-block'
      >
        <Languages className='cursor-pointer' size={25} />

        <Transition
          show={isOpen}
          enter='transition-opacity duration-500 ease-out'
          enterFrom='opacity-0 translate-y-2'
          enterTo='opacity-100 translate-y-0'
          leave='transition-opacity duration-250 ease-in'
          leaveFrom='opacity-100 translate-y-0'
          leaveTo='opacity-0 translate-y-2'
        >
          <div className='absolute top-12 right-0 bg-[#2A2A2A]/50 rounded-md shadow-md w-50 z-20'>
            <ul className='text-sm'>
              <li
                className='flex items-center px-4 py-2 cursor-pointer gap-4 hover:bg-[#3A3A3A]/30 rounded-md'
                onClick={() => changeLanguage('pt-BR')}
              >
                <span>Português</span>
              </li>
              <li
                className='flex items-center px-4 py-2 cursor-pointer gap-4 hover:bg-[#3A3A3A]/30 rounded-md'
                onClick={() => changeLanguage('en-US')}
              >
                <span>English</span>
              </li>
            </ul>
          </div>
        </Transition>
      </div>
    </>
  )
}
