export default function ChangelogSkeleton() {
  const sectionGroups = [
    { titleWidth: 'w-1/3', itemCount: 5 },
    { titleWidth: 'w-1/4', itemCount: 6 },
    { titleWidth: 'w-1/4', itemCount: 5 },
    { titleWidth: 'w-1/5', itemCount: 2 }
  ] as const

  return (
    <div className='px-10 pt-15 max-w-none'>
      <div className='h-10 bg-[#2A2A2A]/30 rounded-full w-1/4 mb-4 animate-pulse' />

      <div className='h-8 bg-[#2A2A2A]/30 rounded-full w-1/2 mb-6 animate-pulse' />

      <div className='h-4 bg-gray-500/30 rounded-full w-full md:w-3/4 mb-1 animate-pulse' />
      <div className='h-4 bg-gray-500/30 rounded-full w-11/12 md:w-2/3 mb-10 animate-pulse' />

      <div className='space-y-10'>
        {sectionGroups.map((group, index) => (
          <div key={index}>
            <div
              className={`h-6 bg-[#2A2A2A]/30 rounded-full ${group.titleWidth} mb-3 animate-pulse`}
            />

            <ul className='space-y-1 pl-4'>
              {Array.from({ length: group.itemCount }).map((_, i) => (
                <li key={i} className='flex items-center space-x-2'>
                  <div className='w-1 h-1 bg-gray-600/30 rounded-full' />

                  <div
                    className={`
                      h-4 rounded-full bg-gray-600/30 animate-pulse
                      ${i % 3 === 0 ? 'w-2/3' : i % 3 === 1 ? 'w-1/2 md:w-1/3' : 'w-3/4 md:w-2/3'}
                    `}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
