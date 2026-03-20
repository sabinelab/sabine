import { valorantMaps } from '@sabinelab/utils'
import { Queue } from 'bullmq'
import { env } from '@/env'

export const arenaMapQueue = new Queue('change-arena-map', {
  connection: {
    url: env.REDIS_URL
  }
})

export const processArenaMap = async () => {
  const currentMap = await Bun.redis.get('arena:map')
  let maps = valorantMaps.filter(m => m.current_map_pool).map(m => m.name)

  const currentMapIndex = maps.indexOf(currentMap || '')

  if (currentMapIndex !== -1) {
    maps.splice(currentMapIndex, 1)
  }

  if (maps.length === 0) {
    maps = valorantMaps.filter(m => m.current_map_pool).map(m => m.name)
  }

  const map = maps[Math.floor(Math.random() * maps.length)]
  await Bun.redis.set('arena:map', map)
}
