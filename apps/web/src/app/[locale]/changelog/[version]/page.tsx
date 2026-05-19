import { Suspense } from 'react'
import Changelog from './changelog'
import ChangelogSkeleton from './changelog-skeleton'

type Props = {
  params: Promise<{
    version: string
    locale: string
  }>
}

const skeleton = <ChangelogSkeleton />

export default async function Update({ params }: Props) {
  const { version, locale } = await params

  return (
    <Suspense fallback={skeleton}>
      <Changelog version={version} locale={locale} />
    </Suspense>
  )
}