const sectionGroups = [
  {
    id: 'overview',
    titleWidth: 'w-1/3',
    items: [
      { id: 'overview-first', width: 'w-2/3' },
      { id: 'overview-second', width: 'w-1/2 md:w-1/3' },
      { id: 'overview-third', width: 'w-3/4 md:w-2/3' },
      { id: 'overview-fourth', width: 'w-2/3' },
      { id: 'overview-fifth', width: 'w-1/2 md:w-1/3' }
    ]
  },
  {
    id: 'features',
    titleWidth: 'w-1/4',
    items: [
      { id: 'features-first', width: 'w-2/3' },
      { id: 'features-second', width: 'w-1/2 md:w-1/3' },
      { id: 'features-third', width: 'w-3/4 md:w-2/3' },
      { id: 'features-fourth', width: 'w-2/3' },
      { id: 'features-fifth', width: 'w-1/2 md:w-1/3' },
      { id: 'features-sixth', width: 'w-3/4 md:w-2/3' }
    ]
  },
  {
    id: 'fixes',
    titleWidth: 'w-1/4',
    items: [
      { id: 'fixes-first', width: 'w-2/3' },
      { id: 'fixes-second', width: 'w-1/2 md:w-1/3' },
      { id: 'fixes-third', width: 'w-3/4 md:w-2/3' },
      { id: 'fixes-fourth', width: 'w-2/3' },
      { id: 'fixes-fifth', width: 'w-1/2 md:w-1/3' }
    ]
  },
  {
    id: 'notes',
    titleWidth: 'w-1/5',
    items: [
      { id: 'notes-first', width: 'w-2/3' },
      { id: 'notes-second', width: 'w-1/2 md:w-1/3' }
    ]
  }
] as const

export default function ChangelogSkeleton() {
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
        {sectionGroups.map((group) => (
          <div key={group.id}>
            {/* Section Header (H2) */}
            <div className={`h-7 bg-[#2A2A2A]/40 rounded-lg ${group.titleWidth} mb-6 mt-10 animate-pulse`} />

            {/* List Items */}
            <ul className='space-y-4 pl-2'>
              {group.items.map((item) => (
                <li key={item.id} className='flex items-start pl-4 relative'>
                  {/* Bullet point mimic */}
                  <div className='absolute left-0 top-2.5 w-1.5 h-1.5 bg-gray-600/30 rotate-45 rounded-[1px]' />

                  <div
                    className={`
                      h-5 rounded-full bg-gray-600/20 animate-pulse
                      ${item.width}
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