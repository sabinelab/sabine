import { notFound } from 'next/navigation'
import Markdown from 'react-markdown'
import { env } from '@/env'
import type { Changelog } from '../changelogs-list'

type Props = {
  version: string
  locale: string
}

const getContent = async (props: Props) => {
  const res = await fetch(env.API_URL + '/updates', {
    headers: {
      authorization: env.AUTH
    }
  })
  const changelogs: Changelog[] = await res.json()
  const changelog = changelogs.find(c => c.id === props.version.replace('v', ''))

  const content = changelog?.content.find(c => c.lang === props.locale)

  return content
}

export default async function ChangelogPage(props: Props) {
  const content = await getContent(props)

  if (!content) {
    notFound()
  }

  return (
    <>
      <div className='mx-auto px-10 pt-15 max-w-xl md:max-w-5xl markdown'>
        <Markdown>{content.text.trim()}</Markdown>
      </div>
    </>
  )
}
