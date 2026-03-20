import { getPlayer, getPlayers } from '@sabinelab/players'
import { env } from '@/env'
import CardLoading from './card-loading'

type Props = {
  query: string
}

const ts = Date.now()

const players = getPlayers()
  .sort((a, b) => b.ovr - a.ovr)
  .map(p => ({ name: `${p.name} — ${p.collection}`, id: p.id, collection: p.collection }))

export default function Cards(props: Props) {
  const filtered = players.filter(p => p.name.toLowerCase().includes(props.query.toLowerCase()))

  return (
    <div className='grid justify-items-center gap-7 mt-10 md:px-30 mb-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
      {filtered.map(p => {
        const player = getPlayer(p.id)

        if (!player) return null

        return (
          <CardLoading
            key={p.id}
            src={`${env.CDN_URL}/cards/${p.id}.png?ts=${ts}`}
            alt={p.name}
            collection={p.collection}
            player={player}
          />
        )
      })}
    </div>
  )
}
