import { getTranslations } from 'next-intl/server'

export default async function Privacy() {
  const t = await getTranslations()

  return (
    <>
      <div>
        <h1 className='flex flex-col font-bold text-4xl md:text-5xl items-center pt-15'>
          {t('guidelines.title')}
        </h1>
      </div>
      <div className='flex flex-col items-center justify-center pt-10 px-10 md:px-40'>
        <p
          style={{
            whiteSpace: 'pre-line'
          }}
        >
          {t('guidelines.description')}
        </p>
      </div>
      <div className='px-10 md:px-40 pt-10 py-10'>
        <h2 className='flex flex-col font-bold text-4xl md:text-4xl'>{t('guidelines.subtitle')}</h2>
        <ul className='list-disc pl-5 pt-5'>
          {t.rich('guidelines.guidelines', {
            li: chunks => <li>{chunks}</li>
          })}
        </ul>
      </div>
    </>
  )
}
