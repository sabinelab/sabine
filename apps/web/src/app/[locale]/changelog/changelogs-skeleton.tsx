export default function ChangelogsSkeleton() {
  return (
    <>
      <div className='flex flex-col items-center justify-center pt-10'>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className='bg-[#2A2A2A]/30 p-9 rounded-lg max-w-xs md:max-w-2xl mb-6 w-[700] animate-pulse'
          />
        ))}
      </div>
    </>
  )
}
