import { getTranslations } from 'next-intl/server'

export default async function Predictions() {
  const t = await getTranslations()

  return (
    <>
      <div>
        <h1 className='flex flex-col text-center font-bold text-4xl md:text-5xl items-center pt-15'>
          {t('wiki.module.predictions.title')}
        </h1>
      </div>
      <div className='flex items-center justify-center pt-10'>
        <div className='p-5 rounded-2xl max-w-xs md:max-w-5xl text-3xl'>
          <ul className='flex flex-col gap-10'>
            <li>
              <h1 className='text-2xl font-bold text-center' id='introduction-to-simulator'>
                {t('wiki.module.predictions.introduction.title')}
              </h1>
              <p className='text-lg pt-3'>
                {t('wiki.module.predictions.introduction.description')}
              </p>
            </li>
            <li>
              <h1 className='text-2xl font-bold text-center' id='introduction-to-simulator'>
                {t('wiki.module.predictions.tournaments.title')}
              </h1>
              <p
                className='text-lg pt-3'
                style={{
                  whiteSpace: 'pre-line'
                }}
              >
                {t.rich('wiki.module.predictions.tournaments.description', {
                  strong: chunks => (
                    <span className='font-bold bg-[#2A2A2A] text-[#9CA3AF] rounded-md md:max-w-30'>
                      {chunks}
                    </span>
                  )
                })}
              </p>
            </li>
            <li>
              <h1 className='text-2xl font-bold text-center' id='introduction-to-simulator'>
                {t('wiki.module.predictions.predictions.title')}
              </h1>
              <p className='text-lg pt-3'>
                {t.rich('wiki.module.predictions.predictions.description', {
                  strong: chunks => (
                    <button
                      type='button'
                      className='bg-[#00863a] rounded-lg md:max-w-30 px-4 py-1 cursor-pointer'
                    >
                      {chunks}
                    </button>
                  )
                })}
              </p>
            </li>
            <li>
              <h1 className='text-2xl font-bold text-center' id='introduction-to-simulator'>
                {t('wiki.module.predictions.bets.title')}
              </h1>
              <p className='text-lg pt-3'>
                {t.rich('wiki.module.predictions.bets.description', {
                  strong: chunks => (
                    <button
                      type='button'
                      className='bg-[#3e3f45] rounded-lg md:max-w-30 px-4 py-1 cursor-pointer'
                    >
                      {chunks}
                    </button>
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
