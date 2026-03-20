import moment from 'moment'
import Link from 'next/link'
import { env } from '@/env'

type Content = {
  lang: string
  text: string
}
export type Changelog = {
  id: string
  publishedAt: string
  content: Content[]
}

const getChangelogs = async () => {
  const res = await fetch(env.API_URL + '/updates', {
    headers: {
      authorization: env.AUTH
    }
  })
  const changelogs: Changelog[] = await res.json()

  return changelogs.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}

type Props = {
  locale: string
}

export default async function ChangelogsList(props: Props) {
  const changelogs = await getChangelogs()

  moment.locale(props.locale)

  return (
    <>
      <div className='flex flex-col items-center justify-center pt-10'>
        {changelogs.map((update, i) => (
          <Link
            key={i}
            className='
                bg-[#2A2A2A]/30 p-5 rounded-lg max-w-xs md:max-w-2xl mb-6 w-[700] transition duration-500 hover:scale-105
                flex justify-between items-center gap-25
              '
            href={`/changelog/v${update.id}`}
          >
            <h2 className='text-2xl font-bold'>v{update.id}</h2>

            <span className='text-gray-400 text-sm md:text-base'>
              {moment(update.publishedAt).format('LLL')}
            </span>
          </Link>
        ))}
      </div>
    </>
  )
}
