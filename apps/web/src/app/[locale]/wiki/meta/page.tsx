import { valorantMaps } from '@sabinelab/utils'
import { getTranslations } from 'next-intl/server'

export default async function MetaAgents() {
  const t = await getTranslations()

  return (
    <>
      <div>
        <h1 className='flex flex-col text-center font-bold text-4xl md:text-5xl items-center pt-15'>
          {t('wiki.module.meta.title')}
        </h1>
      </div>
      <div className='flex items-center justify-center pt-10'>
        <div className='bg-[#2A2A2A]/30 p-5 rounded-2xl max-w-xs md:max-w-5xl mb-6 text-3xl'>
          <ul className='flex flex-col gap-10'>
            <li>
              <h1 className='text-2xl font-bold text-center' id='introduction-to-simulator'>
                {t('wiki.module.meta.introduction.title')}
              </h1>
              <p className='text-lg pt-3'>
                {t.rich('wiki.module.meta.introduction.description', {
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
            {valorantMaps
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((map, i) => (
                <li key={i}>
                  <h1 className='text-2xl font-bold text-center' id='introduction-to-simulator'>
                    {map.name}
                  </h1>
                  {map.meta_agents.map((agent, i) => (
                    <p className='text-lg pt-3' key={i}>
                      {agent}
                    </p>
                  ))}
                </li>
              ))}
          </ul>
        </div>
      </div>
    </>
  )
}
