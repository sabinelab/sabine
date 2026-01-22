export default function ChangelogSkeleton() {
  const sectionGroups = [
    { titleWidth: 'w-1/3', itemCount: 5 },
    { titleWidth: 'w-1/4', itemCount: 6 },
    { titleWidth: 'w-1/4', itemCount: 5 },
    { titleWidth: 'w-1/5', itemCount: 2 }
  ] as const

  return (
    <div className='mx-auto px-10 pt-15 max-w-xl md:max-w-5xl'>
      {/* Title (H1) */}
      <div className='h-10 bg-[#2A2A2A]/50 rounded-lg w-1/3 mb-8 mt-12 animate-pulse' />

      {/* Description / Paragraphs */}
      <div className='space-y-3 mb-10'>
        <div className='h-4 bg-gray-500/20 rounded-full w-full md:w-3/4 animate-pulse' />
        <div className='h-4 bg-gray-500/20 rounded-full w-11/12 md:w-2/3 animate-pulse' />
      </div>

      <div className='space-y-12'>
        {sectionGroups.map((group, index) => (
          <div key={index}>
            {/* Section Header (H2) */}
            <div
              className={`h-7 bg-[#2A2A2A]/40 rounded-lg ${group.titleWidth} mb-6 mt-10 animate-pulse`}
            />

            {/* List Items */}
            <ul className='space-y-4 pl-2'>
              {Array.from({ length: group.itemCount }).map((_, i) => (
                <li key={i} className='flex items-start pl-4 relative'>
                  {/* Bullet point mimic */}
                  <div className='absolute left-0 top-2.5 w-1.5 h-1.5 bg-gray-600/30 rotate-45 rounded-[1px]' />

                  <div
                    className={`
                      h-5 rounded-full bg-gray-600/20 animate-pulse
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
