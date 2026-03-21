import { prisma } from '@db'
import t from '@i18n'
import { Queue } from 'bullmq'
import { REST, Routes } from 'discord.js'
import { env } from '@/env'
import type App from '@/structures/app/App'

export type ReminderPayload = {
  user: string
  channel: string
  guild: string
}

export const remindQueue = new Queue<ReminderPayload>('reminder', {
  connection: {
    url: env.REDIS_URL
  }
})

const rest = new REST().setToken(env.BOT_TOKEN)

export const processReminderQueue = async (app: App, data: ReminderPayload) => {
  const profile = await prisma.profile.findUnique({
    where: {
      userId_guildId: {
        userId: data.user,
        guildId: data.guild
      }
    },
    include: {
      user: {
        select: {
          lang: true
        }
      }
    }
  })

  if (!profile) return

  if (!profile.remind || profile.reminded || !profile.remindIn) return

  await rest.post(Routes.channelMessages(profile.remindIn), {
    body: {
      content: t(profile.user.lang, 'helper.reminder', {
        user: `<@${profile.userId}>`,
        cmd: `</claim:${app.commands.get('claim')?.id}>`
      })
    }
  })

  await prisma.profile.update({
    where: {
      userId_guildId: {
        userId: data.user,
        guildId: data.guild
      }
    },
    data: {
      reminded: true
    }
  })
}
