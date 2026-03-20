import { getTranslations } from 'next-intl/server'

export default async function Privacy() {
  const t = await getTranslations()

  return (
    <>
      <div>
        <h1 className='flex flex-col font-bold text-4xl md:text-5xl items-center pt-15'>
          {t('terms.title')}
        </h1>
      </div>
      <div className='flex flex-col items-center justify-center pt-10 px-10 md:px-40'>
        <p
          style={{
            whiteSpace: 'pre-line'
          }}
        >
          {t('terms.description')}
        </p>
      </div>
      <div className='px-10 md:px-40 pt-10'>
        <h2 className='flex flex-col font-bold text-4xl md:text-4xl'>
          {t('terms.acceptance.title')}
        </h2>
        <p
          style={{
            whiteSpace: 'pre-line'
          }}
          className='pt-5'
        >
          {t('terms.acceptance.description')}
        </p>
      </div>
      <div className='px-10 md:px-40 pt-10'>
        <h2 className='flex flex-col font-bold text-4xl md:text-4xl'>{t('terms.usage.title')}</h2>
        <ul className='list-disc pl-5 pt-5'>
          {t.rich('terms.usage.description', {
            li: chunks => <li>{chunks}</li>
          })}
        </ul>
      </div>
      <div className='px-10 md:px-40 pt-10'>
        <h2 className='flex flex-col font-bold text-4xl md:text-4xl'>{t('terms.content.title')}</h2>
        <ul className='list-disc pl-5 pt-5'>
          {t.rich('terms.content.description', {
            li: chunks => <li>{chunks}</li>
          })}
        </ul>
      </div>
      <div className='px-10 md:px-40 pt-10'>
        <h2 className='flex flex-col font-bold text-4xl md:text-4xl'>
          {t('terms.restrictions.title')}
        </h2>
        <ul className='list-disc pl-5 pt-5'>
          {t.rich('terms.restrictions.description', {
            li: chunks => <li>{chunks}</li>
          })}
        </ul>
      </div>
      <div className='px-10 md:px-40 pt-10'>
        <h2 className='flex flex-col font-bold text-4xl md:text-4xl'>{t('terms.privacy.title')}</h2>
        <ul className='list-disc pl-5 pt-5'>
          {t.rich('terms.privacy.description', {
            li: chunks => <li>{chunks}</li>
          })}
        </ul>
      </div>
      <div className='px-10 md:px-40 pt-10'>
        <h2 className='flex flex-col font-bold text-4xl md:text-4xl'>
          {t('terms.disclaimer.title')}
        </h2>
        <ul className='list-disc pl-5 pt-5'>
          {t.rich('terms.disclaimer.description', {
            li: chunks => <li>{chunks}</li>
          })}
        </ul>
      </div>
      <div className='px-10 md:px-40 pt-10 py-10'>
        <h2 className='flex flex-col font-bold text-4xl md:text-4xl'>{t('terms.changes.title')}</h2>
        <ul className='list-disc pl-5 pt-5'>
          {t.rich('terms.changes.description', {
            li: chunks => <li>{chunks}</li>
          })}
        </ul>
      </div>
    </>
  )
}
