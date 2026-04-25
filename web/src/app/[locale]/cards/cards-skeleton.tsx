export default function CardsSkeleton() {
  const skeleton = Array.from({ length: 15 }, (_, i) => `skeleton-${i}`)

  return (
    <div className='grid justify-items-center gap-7 mt-10 md:px-30 mb-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
      {skeleton.map((key) => (
        <div
          key={key}
          className='
            flex flex-col justify-between gap-5
            bg-[#2A2A2A]/30 overflow-x-hidden p-5 text-xl
            rounded-lg text-center relative
            h-100 w-full max-w-70
            animate-pulse
          '
        >
          <div className='bg-gray-700/30 h-48 w-full rounded-lg mx-auto' />

          <div className='bg-gray-500/30 h-6 w-3/4 rounded-full mx-auto' />

          <div className='bg-gray-800/30 h-4 w-1/2 rounded-sm mx-auto' />
        </div>
      ))}
    </div>
  )
}