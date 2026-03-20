import { getTranslations } from 'next-intl/server'

export default async function Wiki() {
  const t = await getTranslations()

  return (
    <>
      <div>
        <h1 className='flex flex-col text-center font-bold text-4xl md:text-5xl items-center pt-15'>
          {t('wiki.module.simulator.title')}
        </h1>
      </div>
      <div className='flex items-center justify-center pt-10'>
        <div className='p-5 rounded-2xl max-w-xs md:max-w-5xl text-3xl'>
          <ul className='flex flex-col gap-10'>
            <li>
              <h1 className='text-2xl font-bold text-center' id='introduction-to-simulator'>
                {t('wiki.module.simulator.introduction.title')}
              </h1>
              <p className='text-lg pt-3'>{t('wiki.module.simulator.introduction.description')}</p>
            </li>
            <li>
              <h1 className='text-2xl font-bold text-center' id='how-it-works'>
                {t('wiki.module.simulator.how_it_works.title')}
              </h1>
              <p
                className='text-lg pt-3'
                style={{
                  whiteSpace: 'pre-line'
                }}
              >
                {t.rich('wiki.module.simulator.how_it_works.description', {
                  strong: chunks => (
                    <span className='font-bold bg-[#2A2A2A] text-[#9CA3AF] rounded-md md:max-w-30'>
                      {chunks}
                    </span>
                  )
                })}
              </p>
            </li>
            <li>
              <h1 className='text-2xl font-bold text-center' id='players'>
                {t('wiki.module.simulator.players.title')}
              </h1>
              <p
                className='text-lg pt-3'
                style={{
                  whiteSpace: 'pre-line'
                }}
              >
                {t.rich('wiki.module.simulator.players.description', {
                  strong: chunks => (
                    <span className='font-bold bg-[#2A2A2A] text-[#9CA3AF] rounded-md md:max-w-30'>
                      {chunks}
                    </span>
                  ),
                  a: chunks => (
                    <a
                      className='font-bold text-blue-400 underline'
                      href='/wiki/cards#attributes'
                      target='_blank'
                      rel='noopener'
                    >
                      {chunks}
                    </a>
                  )
                })}
              </p>
            </li>
            <li>
              <h1 className='text-2xl font-bold text-center' id='matches'>
                {t('wiki.module.simulator.matches.title')}
              </h1>
              <p
                className='text-lg pt-3'
                style={{
                  whiteSpace: 'pre-line'
                }}
              >
                {t.rich('wiki.module.simulator.matches.description', {
                  strong: chunks => (
                    <span className='font-bold bg-[#2A2A2A] text-[#9CA3AF] rounded-md md:max-w-30'>
                      {chunks}
                    </span>
                  )
                })}
              </p>
            </li>
            <li>
              <h1 className='text-2xl font-bold text-center' id='progression-and-ranking'>
                {t('wiki.module.simulator.progress.title')}
              </h1>
              <p
                className='text-lg pt-3'
                style={{
                  whiteSpace: 'pre-line'
                }}
              >
                {t('wiki.module.simulator.progress.description')}
              </p>
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}
