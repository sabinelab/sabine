import { prisma } from '@db'
import type { $Enums } from '@generated'
import t from '@i18n'
import type { NewsData } from '@types'
import { Queue } from 'bullmq'
import { ButtonStyle, REST, Routes } from 'discord.js'
import pLimit from 'p-limit'
import { env } from '@/env'
import ButtonBuilder from '@/structures/builders/ButtonBuilder'
import EmbedBuilder from '@/structures/builders/EmbedBuilder'

export type NewsPayload = NewsData & {
  game: $Enums.Game
}

export const newsQueue = new Queue<NewsPayload>('news', {
  connection: {
    url: env.REDIS_URL
  }
})

const rest = new REST().setToken(env.BOT_TOKEN)
const limit = pLimit(25)

export const processNews = async (data: NewsPayload) => {
  let cursor: string | undefined
  const key = data.game === 'valorant' ? 'valorantNewsChannel' : 'lolNewsChannel'

  while (true) {
    const guilds = await prisma.guild.findMany({
      take: 1000,
      skip: cursor ? 1 : 0,
      cursor: cursor
        ? {
            id: cursor
          }
        : undefined,
      orderBy: {
        id: 'asc'
      },
      where: {
        [key]: {
          not: null
        }
      }
    })

    if (!guilds.length) break

    const messages: Promise<unknown>[] = []

    for (const guild of guilds) {
      const channelId = data.game === 'valorant' ? guild.valorantNewsChannel : guild.lolNewsChannel
      if (!channelId) continue

      const embed = new EmbedBuilder().setTitle(data.title)

      if (data.description) {
        embed.setDesc(data.description)
      }

      const button = new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel(t(guild.lang, 'helper.source'))
        .setURL(data.url)

      messages.push(
        limit(() =>
          rest.post(Routes.channelMessages(channelId), {
            body: {
              embeds: [embed.toJSON()],
              components: [
                {
                  type: 1,
                  components: [button.toJSON()]
                }
              ]
            }
          })
        )
      )
    }

    await Promise.allSettled(messages)
    cursor = guilds[guilds.length - 1].id
  }
}
