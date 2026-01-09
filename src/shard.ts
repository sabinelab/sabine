import { prisma } from '@db'
import Bull from 'bull'
import { REST, Routes, ShardingManager } from 'discord.js'
import { env } from '@/env'
import { valorant_maps } from './config'
import type { ArenaQueue } from './listeners/clientReady'
import EmbedBuilder from './structures/builders/EmbedBuilder'
import Logger from './util/Logger'
import './server'

const currentMapInit = await Bun.redis.get('arena:map')
let mapsInit = valorant_maps.filter(m => m.current_map_pool).map(m => m.name)
const mapIndexInit = mapsInit.indexOf(currentMapInit || '')

if (mapIndexInit !== -1) {
  mapsInit.splice(mapIndexInit, 1)
}

if (mapsInit.length === 0) {
  mapsInit = valorant_maps.filter(m => m.current_map_pool).map(m => m.name)
}

const mapInit = mapsInit[Math.floor(Math.random() * mapsInit.length)]

if (!currentMapInit && mapInit) await Bun.redis.set('arena:map', mapInit)

const arenaMatchQueue = new Bull<ArenaQueue>('arena', { redis: env.REDIS_URL })
const changeMapQueue = new Bull('arena:map', { redis: env.REDIS_URL })

changeMapQueue.process('arena:map', async () => {
  const currentMap = await Bun.redis.get('arena:map')
  let maps = valorant_maps.filter(m => m.current_map_pool).map(m => m.name)

  const currentMapIndex = maps.indexOf(currentMap || '')

  if (currentMapIndex !== -1) {
    maps.splice(currentMapIndex, 1)
  }

  if (maps.length === 0) {
    maps = valorant_maps.filter(m => m.current_map_pool).map(m => m.name)
  }

  const map = maps[Math.floor(Math.random() * maps.length)]

  if (map) {
    await Bun.redis.set('arena:map', map)
  }
})

const processArenaQueue = async () => {
  try {
    const queueLength = await Bun.redis.llen('arena:queue')

    if (queueLength < 2) return

    const payload1 = await Bun.redis.rpop('arena:queue')
    const payload2 = await Bun.redis.rpop('arena:queue')

    if (!payload1 || !payload2) {
      if (payload1) await Bun.redis.lpush('arena:queue', payload1)

      return
    }

    const parsedData1 = JSON.parse(payload1)
    const parsedData2 = JSON.parse(payload2)

    const p1InQueue = await Bun.redis.get(`arena:in_queue:${parsedData1.userId}`)
    const p2InQueue = await Bun.redis.get(`arena:in_queue:${parsedData2.userId}`)

    if (!p1InQueue) {
      if (p2InQueue) {
        await Bun.redis.lpush('arena:queue', payload2)
      }

      return await Bun.redis.unlink(`arena:in_queue:${parsedData1.userId}`)
    }

    if (!p2InQueue) {
      if (p1InQueue) {
        await Bun.redis.lpush('arena:queue', payload1)
      }

      return await Bun.redis.unlink(`arena:in_queue:${parsedData2.userId}`)
    }

    await Bun.redis.unlink(
      `arena:in_queue:${parsedData1.userId}`,
      `arena:in_queue:${parsedData2.userId}`
    )

    await arenaMatchQueue.add('arena', { parsedData1, parsedData2 })

    if (queueLength - 2 >= 2) {
      await processArenaQueue()
    }
  } catch (e) {
    Logger.error(e as Error)
  }
}

const updateRedis = async () => {
  const blacklist = await prisma.blacklist.findMany()
  await Bun.redis.set('blacklist', JSON.stringify(blacklist))

  setTimeout(updateRedis, 10 * 60 * 1000)
}

const patterns = ['*leaderboard:*', '*agent_selection:*', '*match:*']

const keysToDelete = new Set<string>()

for (const pattern of patterns) {
  let cursor = '0'

  do {
    const [next, keys] = await Bun.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)

    for (const key of keys) {
      keysToDelete.add(key)
    }

    cursor = next
  } while (cursor !== '0')
}

const keys = [...keysToDelete]

if (keys.length) {
  await Bun.redis.unlink(...keys)
}

await updateRedis()

const manager = new ShardingManager('src/index.ts', {
  token: env.BOT_TOKEN,
  mode: 'process',
  totalShards: 2
})

const rest = new REST().setToken(env.BOT_TOKEN)

const res = (await rest.get(Routes.channelWebhooks(env.SHARD_LOG))) as any[]
const webhook = res.filter(w => w.token)[0]

if (!webhook) {
  Logger.warn('There is no webhook')
}

manager.on('shardCreate', async shard => {
  if (shard.id === 0) {
    setInterval(processArenaQueue, 5000)

    const oldJobs = await changeMapQueue.getRepeatableJobs()

    for (const job of oldJobs) {
      if (job.id === 'change:map') {
        await changeMapQueue.removeRepeatableByKey(job.key)
      }
    }

    await changeMapQueue.add(
      'arena:map',
      {},
      {
        jobId: 'change:map',
        repeat: {
          cron: '0 0 * * 0' // midnight every sunday
        },
        removeOnComplete: true,
        removeOnFail: true
      }
    )
  }

  shard.on('disconnect', async () => {
    const embed = new EmbedBuilder()
      .setTitle('Shard Disconnected')
      .setDesc(`Shard ID: \`${shard.id}\` => \`Disconnected\``)
      .setTimestamp()

    const route = Routes.webhook(webhook.id, webhook.token)

    await rest.post(route, {
      body: {
        embeds: [embed]
      }
    })
  })

  shard.on('ready', async () => {
    const embed = new EmbedBuilder()
      .setTitle('Shard Ready')
      .setDesc(`Shard ID: \`${shard.id}\` => \`Ready\``)
      .setTimestamp()

    const route = Routes.webhook(webhook.id, webhook.token)

    await rest.post(route, {
      body: {
        embeds: [embed]
      }
    })
  })

  shard.on('resume', async () => {
    const embed = new EmbedBuilder()
      .setTitle('Shard Resumed')
      .setDesc(`Shard ID: \`${shard.id}\` => \`Resumed\``)
      .setTimestamp()

    const route = Routes.webhook(webhook.id, webhook.token)

    await rest.post(route, {
      body: {
        embeds: [embed]
      }
    })
  })

  shard.on('reconnecting', async () => {
    const embed = new EmbedBuilder()
      .setTitle('Shard Reconnecting')
      .setDesc(`Shard ID: \`${shard.id}\` => \`Reconnecting\``)
      .setTimestamp()

    const route = Routes.webhook(webhook.id, webhook.token)

    await rest.post(route, {
      body: {
        embeds: [embed]
      }
    })
  })

  shard.on('death', async () => {
    const embed = new EmbedBuilder()
      .setTitle('Shard Dead')
      .setDesc(`Shard ID: \`${shard.id}\` => \`Dead\``)
      .setTimestamp()

    const route = Routes.webhook(webhook.id, webhook.token)

    await rest.post(route, {
      body: {
        embeds: [embed]
      }
    })
  })

  shard.on('spawn', async () => {
    const embed = new EmbedBuilder()
      .setTitle('Shard Spawned')
      .setDesc(`Shard ID: \`${shard.id}\` => \`Spawned\``)
      .setTimestamp()

    const route = Routes.webhook(webhook.id, webhook.token)

    await rest.post(route, {
      body: {
        embeds: [embed]
      }
    })
  })

  shard.on('error', async error => {
    const embed = new EmbedBuilder()
      .setTitle('Shard Error')
      .setDesc(`Shard ID: \`${shard.id}\` => \`Error\`\n\`\`\`fix\n${error.stack}\`\`\``)
      .setTimestamp()

    const route = Routes.webhook(webhook.id, webhook.token)

    await rest.post(route, {
      body: {
        embeds: [embed]
      }
    })
  })
})

manager.spawn()
