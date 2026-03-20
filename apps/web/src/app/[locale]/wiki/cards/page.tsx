import { getTranslations } from 'next-intl/server'

export default async function Cards() {
  const t = await getTranslations()

  return (
    <>
      <div>
        <h1 className='flex flex-col text-center font-bold text-4xl md:text-5xl items-center pt-15'>
          {t('wiki.module.cards.title')}
        </h1>
      </div>
      <div className='flex items-center justify-center pt-10'>
        <div className='p-5 rounded-2xl max-w-xs md:max-w-5xl mb-6 text-3xl'>
          <ul className='flex flex-col gap-10'>
            <li>
              <h1 className='text-2xl font-bold text-center' id='introduction-to-simulator'>
                {t('wiki.module.cards.introduction.title')}
              </h1>
              <p className='text-lg pt-3'>
                {t.rich('wiki.module.cards.introduction.description', {
                  a: chunks => (
                    <a
                      className='font-bold text-blue-400 underline'
                      href='https://www.thespike.gg/'
                      target='_blank'
                      rel='noreferrer'
                    >
                      {chunks}
                    </a>
                  )
                })}
              </p>
            </li>
            <li>
              <h1 className='text-2xl font-bold text-center' id='introduction-to-simulator'>
                {t('wiki.module.cards.calc.title')}
              </h1>
              <p
                className='text-lg pt-3'
                style={{
                  whiteSpace: 'pre-line'
                }}
              >
                {t.rich('wiki.module.cards.calc.description', {
                  strong: chunks => (
                    <span className='font-bold bg-[#2A2A2A] text-[#9CA3AF] rounded-2xl md:max-w-30'>
                      {chunks}
                    </span>
                  )
                })}
              </p>
            </li>
            <li>
              <h1 className='text-2xl font-bold text-center' id='introduction-to-simulator'>
                {t('wiki.module.cards.attributes.title')}
              </h1>
              <p
                className='text-lg pt-3'
                style={{
                  whiteSpace: 'pre-line'
                }}
                id='attributes'
              >
                {t.rich('wiki.module.cards.attributes.description', {
                  strong: chunks => (
                    <span className='font-bold bg-[#2A2A2A] text-[#9CA3AF] rounded-2xl md:max-w-30'>
                      {chunks}
                    </span>
                  )
                })}
              </p>
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}
