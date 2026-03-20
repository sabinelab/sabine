import { ActivityType } from 'discord.js'
import { env } from '@/env'
import type App from '@/structures/app/App'
import createListener from '@/structures/app/createListener'
import { startWorkers } from '@/structures/queue'
import { tasksQueue } from '@/structures/queue/tasks-queue'
import Logger from '@/util/Logger'

const setPresence = (app: App) => {
  if (app.user?.id !== '1235576817683922954') {
    app.user?.setStatus('dnd')
    app.user?.setActivity({
      name: `sabinebot.xyz | ${env.PREFIX}claim`,
      type: ActivityType.Playing
    })
  } else {
    app.user.setActivity({
      name: `sabinebot.xyz | ${env.PREFIX}claim`,
      type: ActivityType.Playing
    })
  }

  setTimeout(() => setPresence(app), 3_600_000)
}

export default createListener({
  name: 'clientReady',
  async run(app) {
    setPresence(app)
    Logger.info(`${app.user?.tag} online on Shard ${app.shard?.ids}!`)

    await app.postCommands()

    if (!app.shard || !app.shard.ids[0]) {
      startWorkers(app)

      await tasksQueue.upsertJobScheduler(
        'tasks-scheduler',
        {
          every: env.INTERVAL ? env.INTERVAL : 1000 * 60 * 5
        },
        {
          name: 'tasks',
          opts: {
            removeOnFail: false,
            removeOnComplete: false
          }
        }
      )
    }
  }
})
