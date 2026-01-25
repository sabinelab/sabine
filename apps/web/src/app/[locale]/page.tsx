import { getPlayers } from '@sabinelab/players'
import { ArrowDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { env } from '@/env'

const players = getPlayers()
const ts = Date.now()

export default async function Home() {
  const t = await getTranslations()

  return (
    <>
      <div className='h-screen flex flex-col justify-center items-center gap-8 md:gap-0'>
        <Image src='/sabine.png' width={180} height={180} alt='sabine' className='rounded-full' />
        <h1 className='md:pt-6 text-6xl font-bold md:text-8xl max-w-full md:max-w-md'>Sabine</h1>
        <h2 className='text-center md:pt-6 text-2xl md:text-4xl max-w-full'>{t('home.title')}</h2>
        <Link
          href='/invite'
          target='_blank'
          className='
            flex items-center text-xl md:text-3xl gap-2 border border-white rounded-lg mt-5 px-6 py-2 transition duration-300
            hover:bg-white hover:text-gray-800
          '
        >
          <span>{t('home.add')}</span>
        </Link>
        <ArrowDown size={50} className='animate-bounce md:mt-25' />
      </div>
      <div className='flex px-6 md:px-20 pt-8 md:pt-15'>
        <div className='flex flex-col gap-25 justify-between'>
          <div className='flex flex-col md:flex-row items-center gap-10'>
            <div className='text-center md:text-left md:flex-1'>
              <h2 className='text-[30px] font-bold pt-10'>{t('home.build.title')}</h2>
              <p style={{ whiteSpace: 'pre-line' }} className='text-lg pt-4 text-[#9CA3AF]'>
                {t.rich('home.build.desc', {
                  strong: chunks => <span className='font-extrabold'>{chunks}</span>,
                  a: chunks => (
                    <a
                      className='font-bold text-blue-400 underline'
                      href={env.SUPPORT}
                      target='_blank'
                      rel='noreferrer'
                    >
                      {chunks}
                    </a>
                  )
                })}
              </p>
            </div>
            <div className='hidden md:flex gap-5 flex-col md:flex-1 md:flex-row justify-center'>
              <Image
                src='/home/claim.png'
                width={300}
                height={300}
                alt='claim'
                className='rounded-md shadow-xl transition duration-300 hover:scale-105 hover:brightness-110'
              />
              <Image
                src='/home/match.png'
                width={300}
                height={300}
                alt='match'
                className='rounded-md shadow-xl transition duration-300 hover:scale-105 hover:brightness-110'
              />
            </div>
          </div>
          <div className='flex flex-col md:flex-row items-center gap-10'>
            <div className='hidden md:flex gap-5 flex-col md:flex-row md:flex-1 justify-center'>
              <Image
                src='/home/live.png'
                width={300}
                height={300}
                alt='claim'
                className='rounded-md shadow-xl transition duration-300 hover:scale-105 hover:brightness-110'
              />
              <Image
                src='/home/image.png'
                width={300}
                height={300}
                alt='match'
                className='rounded-md shadow-xl transition duration-300 hover:scale-105 hover:brightness-110'
              />
            </div>
            <div className='text-center md:text-left md:flex-1'>
              <h2 className='text-[30px] font-bold pt-10'>{t('home.realtime.title')}</h2>
              <p style={{ whiteSpace: 'pre-line' }} className='text-lg pt-4 text-[#9CA3AF]'>
                {t.rich('home.realtime.desc', {
                  strong: chunks => <span className='font-extrabold'>{chunks}</span>,
                  a: chunks => (
                    <a
                      className='font-bold text-blue-400 underline'
                      href={env.SUPPORT}
                      target='_blank'
                      rel='noreferrer'
                    >
                      {chunks}
                    </a>
                  )
                })}
              </p>
            </div>
          </div>
          <div className='flex flex-col md:flex-row items-center gap-10'>
            <div className='text-center md:text-left md:flex-1'>
              <h2 className='text-[30px] font-bold pt-10'>{t('home.cards.title')}</h2>
              <p style={{ whiteSpace: 'pre-line' }} className='text-lg pt-4 text-[#9CA3AF]'>
                {t.rich('home.cards.desc', {
                  strong: chunks => <span className='font-extrabold'>{chunks}</span>,
                  a: chunks => (
                    <a
                      className='font-bold text-blue-400 underline'
                      href={env.SUPPORT}
                      target='_blank'
                      rel='noreferrer'
                    >
                      {chunks}
                    </a>
                  ),
                  size: players.length
                })}
              </p>
            </div>
            <div className='hidden md:flex gap-5 md:flex-1 justify-center'>
              <Image
                src={`${env.CDN_URL}/cards/529.png?ts=${ts}`}
                width={300}
                height={300}
                alt='claim'
                className='transition duration-300 hover:scale-105 hover:brightness-110'
              />
              <Image
                src={`${env.CDN_URL}/cards/509.png?ts=${ts}`}
                width={300}
                height={300}
                alt='match'
                className='transition duration-300 hover:scale-105 hover:brightness-110'
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
