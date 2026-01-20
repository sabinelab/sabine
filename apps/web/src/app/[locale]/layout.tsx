import '../globals.css'
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Script from 'next/script'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import NextTopLoader from 'nextjs-toploader'
import Footer from '@/components/footer'
import Header from '@/components/header'
import Motion from '@/components/motion'

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { locale } = await params
  const t = await getTranslations({ locale })

  return {
    title: t('metadata.title'),
    description: t('metadata.desc'),
    twitter: {
      card: 'summary',
      images: ['/sabine.png']
    },
    metadataBase: new URL('https://sabinebot.xyz/'),
    other: {
      'google-adsense-account': 'ca-pub-3346744916189692'
    }
  }
}

type Props = {
  children?: React.ReactNode
  params: Promise<{
    locale: string
  }>
}

const geist = Geist({
  subsets: ['latin']
})

export default async function RootLayout({ children, params }: Props) {
  const messages = await getMessages()
  const { locale } = await params

  return (
    <html lang={locale}>
      <body className={`${geist.className} min-h-screen flex flex-col background`}>
        <Header />
        <NextIntlClientProvider messages={messages} locale={locale}>
          <main className='grow'>
            <Script
              async
              src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3346744916189692'
              crossOrigin='anonymous'
              strategy='afterInteractive'
            />
            <NextTopLoader color='#78B14B' />
            <Motion children={children} />
          </main>
        </NextIntlClientProvider>
        <Footer />
      </body>
    </html>
  )
}
