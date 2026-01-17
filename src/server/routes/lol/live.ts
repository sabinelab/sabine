import { prisma } from '@db'
import locales from '@i18n'
import { REST, Routes, type TextChannel } from 'discord.js'
import { Elysia } from 'elysia'
import { z } from 'zod'
import { env } from '@/env'
import { app } from '@/structures/app/App'
import ButtonBuilder from '@/structures/builders/ButtonBuilder'
import EmbedBuilder from '@/structures/builders/EmbedBuilder'
import pLimit from 'p-limit'

const rest = new REST().setToken(env.BOT_TOKEN)

const limit = pLimit(25)

export const lolLive = new Elysia().post(
  '/webhooks/live/lol',
  async req => {
    let cursor: string | undefined

    while (true) {
      const guilds = await prisma.guild.findMany({
        take: 1000,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { id: 'asc' },
        where: {
          lolLiveFeedChannel: {
            not: null
          }
        },
        include: {
          events: {
            where: {
              type: 'lol'
            }
          },
          liveMessages: true
        }
      })

      if (!guilds.length) break

      const messages: Promise<unknown>[] = []

      for (const data of req.body) {
        for (const guild of guilds) {
          const channel = app.channels.cache.get(guild.lolLiveFeedChannel!) as TextChannel

          if (!channel) continue

          if (!guild.events.some(e => e.name === data.tournament.name)) continue

          const emoji1 =
            app.emoji.get(data.teams[0].name.toLowerCase()) ??
            app.emoji.get(app.emojiAliases.get(data.teams[0].name.toLowerCase()) ?? '') ??
            app.emoji.get('default')
          const emoji2 =
            app.emoji.get(data.teams[1].name.toLowerCase()) ??
            app.emoji.get(app.emojiAliases.get(data.teams[1].name.toLowerCase()) ?? '') ??
            app.emoji.get('default')

          const embed = new EmbedBuilder()
            .setAuthor({
              name: data.tournament.full_name,
              iconURL: data.tournament.image
            })
            .setTitle(locales(guild.lang ?? 'en', 'helper.live_now'))
            .setField(
              `${emoji1} ${data.teams[0].name} \`${data.teams[0].score}\` <:versus:1349105624180330516> \`${data.teams[1].score}\` ${data.teams[1].name} ${emoji2}`,
              ''
            )

          if (data.stage) embed.setFooter({ text: data.stage })

          const button = new ButtonBuilder()
            .defineStyle('blue')
            .setLabel(locales(guild.lang ?? 'en', 'helper.streams'))
            .setCustomId(`stream;lol;${data.id}`)

          messages.push(
            limit(() =>
              rest.post(Routes.channelMessages(guild.lolLiveFeedChannel!), {
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
          )
        }
      }

      await Promise.allSettled(messages)

      cursor = guilds[guilds.length - 1].id
    }

    req.set.status = 'OK'

    return { ok: true }
  },
  {
    body: z.array(
      z.object({
        id: z.string(),
        tournament: z.object({
          name: z.string(),
          full_name: z.string(),
          image: z.string()
        }),
        teams: z.union([
          z.array(z.never()),
          z.array(
            z.object({
              name: z.string(),
              score: z.string()
            })
          )
        ]),
        stage: z.optional(z.string()),
        streams: z.array(
          z.object({
            mani: z.boolean(),
            language: z.string(),
            embed_url: z.string(),
            official: z.boolean(),
            raw_url: z.string()
          })
        )
      })
    )
  }
)
