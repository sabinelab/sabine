import { getTranslations } from 'next-intl/server'
import { env } from '@/env'

type Command = {
  name: string
  description: string
}

const getCommands = async () => {
  const res = await fetch(env.API_URL + '/commands', {
    headers: {
      authorization: env.AUTH
    }
  })
  const commands: Command[] = await res.json()

  return commands.sort((a, b) => a.name.localeCompare(b.name))
}

export default async function CommandsList() {
  const [commands, t] = await Promise.all([getCommands(), getTranslations()])

  return (
    <div className='grid justify-items-center pt-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
      {commands.map((cmd, i) => (
        <div
          key={i}
          className='
              bg-[#2A2A2A]/30 p-5 rounded-2xl max-w-xs md:max-w-3xs
              mb-6 w-[700] transition duration-500 hover:scale-105
            '
        >
          <div>
            <h2 className='text-2xl font-extrabold'>/{cmd.name}</h2>
            <p className='mt-2 text-lg'>{t(`commands.${cmd.name}.description`)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
