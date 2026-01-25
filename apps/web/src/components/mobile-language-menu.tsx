'use client'

import { Languages } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { locales } from '../../config'

export default function MobileLanguageMenu() {
  const [isOpen, setIsOpen] = useState(false)

  const router = useRouter()

  const changeLanguage = (lang: (typeof locales)[number]) => {
    document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000; SameSite=Lax`
    router.refresh()
  }

  return (
    <div onClick={() => setIsOpen(true)} className='relative inline-block'>
      <Languages className='cursor-pointer' />
      {isOpen && (
        <div className='absolute top-12 -right-13.25 bg-[#2A2A2A] rounded-md shadow-md w-50 z-20'>
          <ul>
            <li
              className='flex items-center px-4 py-2 cursor-pointer gap-4 hover:bg-[#3A3A3A] rounded-md transition'
              onClick={() => changeLanguage('pt-BR')}
            >
              <span>Português</span>
            </li>
            <li
              className='flex items-center px-4 py-2 cursor-pointer gap-4 hover:bg-[#3A3A3A] rounded-md transition'
              onClick={() => changeLanguage('en-US')}
            >
              <span>English</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
