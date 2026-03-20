'use client'

import type { Player } from '@sabinelab/players'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

type Props = {
  src: string
  collection: string
  alt: string
  player: Player
}

export default function CardLoading({ src, collection, alt, player }: Props) {
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)

  const t = useTranslations()

  return (
    <>
      <div
        className='
          flex flex-col justify-between gap-5
          bg-[#2A2A2A]/30 overflow-x-hidden p-5 text-xl
          rounded-lg text-center transition hover:scale-110 duration-300 relative
        '
      >
        <div className='font-bold'>
          {!loaded && (
            <div
              className='
                absolute inset-0 z-10 flex items-center justify-center
                bg-linear-to-tr from-neutral-800/40 to-neutral-700/40 animate-pulse rounded-xl
              '
            >
              <svg
                className='w-12 h-12 text-neutral-600'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                />
              </svg>
            </div>
          )}

          <Image
            src={src}
            height={250}
            width={250}
            alt={alt}
            className={`rounded-3xl text-center ${loaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setLoaded(true)}
          />

          <span>{collection}</span>
        </div>

        <button
          className='
            bg-indigo-500 rounded-md cursor-pointer
          '
          onClick={() => setOpen(true)}
        >
          <span className='flex p-1 justify-center'>{t('cards.more_information')}</span>
        </button>
      </div>

      {open && (
        <div className='fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4'>
          <div
            className='
              flex flex-col items-center
              rounded-lg background
              max-h-full md:max-h-[90vh] overflow-y-auto
            '
          >
            <div className='flex flex-col md:flex-row gap-10 md:gap-40 py-10 px-10 md:px-20'>
              <div className='flex flex-col justify-center items-center'>
                {!loaded && (
                  <div className='absolute inset-0 bg-gray-700 animate-pulse rounded-3xl' />
                )}

                <Image
                  src={src}
                  height={250}
                  width={250}
                  alt={alt}
                  className={`rounded-3xl text-center ${loaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setLoaded(true)}
                />

                <div className='flex flex-col gap-2 pl-5 md:pl-0'>
                  <p className='font-bold text-center text-2xl'>{player.name}</p>

                  <span className='flex items-center gap-2'>
                    <span className='w-1.5 h-1.5 rounded-full bg-current' />
                    {t.rich('cards.collection', {
                      collection: player.collection,
                      strong: chunks => <span className='font-bold text-gray-400'>{chunks}</span>
                    })}
                  </span>

                  <span className='flex items-center gap-2'>
                    <span className='w-1.5 h-1.5 rounded-full bg-current' />
                    {t.rich(`cards.role.${player.role}`, {
                      strong: chunks => <span className='font-bold text-gray-400'>{chunks}</span>
                    })}
                  </span>

                  <span className='flex items-center gap-2'>
                    <span className='w-1.5 h-1.5 rounded-full bg-current' />
                    {t.rich('cards.price', {
                      price: player.price.toLocaleString(),
                      strong: chunks => <span className='font-bold text-gray-400'>{chunks}</span>
                    })}
                  </span>
                </div>
              </div>

              <div className='flex flex-col gap-5 justify-center'>
                <h3 className='font-bold text-2xl text-center'>{t('cards.stats.title')}</h3>
                <div className='flex gap-5'>
                  <div className='flex flex-col gap-2 pl-5 md:pl-0'>
                    <span className='flex items-center gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-current' />
                      {t.rich('cards.stats.aim', {
                        stats: player.aim,
                        strong: chunks => <span className='font-bold text-gray-400'>{chunks}</span>
                      })}
                    </span>

                    <span className='flex items-center gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-current' />
                      {t.rich('cards.stats.hs', {
                        stats: player.hs,
                        strong: chunks => <span className='font-bold text-gray-400'>{chunks}</span>
                      })}
                    </span>

                    <span className='flex items-center gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-current' />
                      {t.rich('cards.stats.movement', {
                        stats: player.movement,
                        strong: chunks => <span className='font-bold text-gray-400'>{chunks}</span>
                      })}
                    </span>
                  </div>

                  <div className='flex flex-col gap-2'>
                    <span className='flex items-center gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-current' />
                      {t.rich('cards.stats.aggression', {
                        stats: player.aggression,
                        strong: chunks => <span className='font-bold text-gray-400'>{chunks}</span>
                      })}
                    </span>

                    <span className='flex items-center gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-current' />
                      {t.rich('cards.stats.acs', {
                        stats: player.acs,
                        strong: chunks => <span className='font-bold text-gray-400'>{chunks}</span>
                      })}
                    </span>

                    <span className='flex items-center gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-current' />
                      {t.rich('cards.stats.gamesense', {
                        stats: player.gamesense,
                        strong: chunks => <span className='font-bold text-gray-400'>{chunks}</span>
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className='p-5'>
              <button
                className='bg-red-500 rounded-md px-10 py-1 cursor-pointer'
                onClick={() => setOpen(false)}
              >
                <span>{t('close')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
