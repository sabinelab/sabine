export default function CardsSkeleton() {
  return (
    <div className='grid justify-items-center gap-7 mt-10 md:px-30 mb-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className='
            flex flex-col justify-between gap-5
            bg-[#2A2A2A]/30 overflow-x-hidden p-5 text-xl
            rounded-lg text-center relative
            h-[400px] w-full max-w-[280px]
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
