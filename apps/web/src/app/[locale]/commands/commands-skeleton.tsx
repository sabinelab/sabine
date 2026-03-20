export default function CommandsSkeleton() {
  return (
    <>
      <div className='grid justify-items-center pt-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className='bg-[#2A2A2A]/30 p-10 rounded-2xl max-w-xs md:max-w-3xs mb-20 w-[700] h-72 animate-pulse'
          />
        ))}
      </div>
    </>
  )
}
