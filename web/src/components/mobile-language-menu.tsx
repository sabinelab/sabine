'use client'

import { Languages } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import type { locales } from '../../config'

export default function MobileLanguageMenu() {
  const [isOpen, setIsOpen] = useState(false)

  const router = useRouter()

  const openMenu = useCallback(() => setIsOpen(true), [])

  const changeLanguage = useCallback(
    (lang: (typeof locales)[number]) => {
      document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000; SameSite=Lax`
      setIsOpen(false)
      router.refresh()
    },
    [router]
  )

  const changeToPortuguese = useCallback(() => {
    changeLanguage('pt-BR')
  }, [changeLanguage])

  const changeToEnglish = useCallback(() => {
    changeLanguage('en-US')
  }, [changeLanguage])

  return (
    <div className='relative inline-block'>
      <button
        type='button'
        onClick={openMenu}
        aria-label='Language menu'
        aria-expanded={isOpen}
        className='cursor-pointer'
      >
        <Languages />
      </button>
      {isOpen && (
        <div className='absolute top-12 -right-13.25 bg-[#2A2A2A] rounded-md shadow-md w-50 z-20'>
          <ul>
            <li>
              <button
                type='button'
                className='flex w-full items-center px-4 py-2 cursor-pointer gap-4 hover:bg-[#3A3A3A] rounded-md transition'
                onClick={changeToPortuguese}
              >
                <span>Português</span>
              </button>
            </li>
            <li>
              <button
                type='button'
                className='flex w-full items-center px-4 py-2 cursor-pointer gap-4 hover:bg-[#3A3A3A] rounded-md transition'
                onClick={changeToEnglish}
              >
                <span>English</span>
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}