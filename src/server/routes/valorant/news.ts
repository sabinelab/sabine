import { prisma } from '@db'
import locales from '@i18n'
import { REST, Routes } from 'discord.js'
import { Elysia } from 'elysia'
import { z } from 'zod'
import { env } from '@/env'
import ButtonBuilder from '../../../structures/builders/ButtonBuilder'
import EmbedBuilder from '../../../structures/builders/EmbedBuilder'

const rest = new REST().setToken(env.BOT_TOKEN)

export const news = new Elysia().post(
  '/webhooks/news/valorant',
  async req => {
    const guilds = await prisma.guild.findMany({
      where: {
        valorantNewsChannel: {
          not: null
        }
      }
    })

    if (!guilds.length) return

    const messages: Promise<unknown>[] = []

    for (const guild of guilds) {
      for (const data of req.body) {
        const embed = new EmbedBuilder().setTitle(data.title)

        if (data.description) {
          embed.setDesc(data.description)
        }

        const button = new ButtonBuilder()
          .defineStyle('link')
          .setLabel(locales(guild.lang ?? 'en', 'helper.source'))
          .setURL(data.url)

        messages.push(
          rest.post(Routes.channelMessages(guild.valorantNewsChannel!), {
            body: {
              embeds: [embed.toJSON()],
              components: [
                {
                  type: 1,
                  components: [button]
                }
              ]
            }
          })
        )
      }
    }

    await Promise.allSettled(messages)

    req.set.status = 'OK'

    return { ok: true }
  },
  {
    body: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
        url: z.string(),
        id: z.string()
      })
    )
  }
)
