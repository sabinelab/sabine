import { getTranslations } from 'next-intl/server'

export default async function Privacy() {
  const t = await getTranslations()

  return (
    <>
      <div>
        <h1 className='flex flex-col font-bold text-4xl md:text-5xl items-center pt-15'>
          {t('privacy.title')}
        </h1>
      </div>
      <div className='flex flex-col items-center justify-center pt-10'>
        <p
          style={{
            whiteSpace: 'pre-line'
          }}
        >
          {t('privacy.description')}
        </p>
      </div>
    </>
  )
}
