'use client'

import { Transition } from '@headlessui/react'
import { Languages } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import type { locales } from '../../config'

export default function LanguageMenu() {
  const [isOpen, setIsOpen] = useState(false)

  const router = useRouter()

  const openMenu = useCallback(() => setIsOpen(true), [])
  const closeMenu = useCallback(() => setIsOpen(false), [])

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
    <>
      <div
        onMouseEnter={openMenu}
        onMouseLeave={closeMenu}
        className='relative inline-block'
      >
        <button
          type='button'
          onClick={openMenu}
          aria-label='Language menu'
          aria-expanded={isOpen}
          className='cursor-pointer'
        >
          <Languages size={25} />
        </button>

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
              <li>
                <button
                  type='button'
                  className='flex w-full items-center px-4 py-2 cursor-pointer gap-4 hover:bg-[#3A3A3A]/30 rounded-md'
                  onClick={changeToPortuguese}
                >
                  <span>Português</span>
                </button>
              </li>
              <li>
                <button
                  type='button'
                  className='flex w-full items-center px-4 py-2 cursor-pointer gap-4 hover:bg-[#3A3A3A]/30 rounded-md'
                  onClick={changeToEnglish}
                >
                  <span>English</span>
                </button>
              </li>
            </ul>
          </div>
        </Transition>
      </div>
    </>
  )
}