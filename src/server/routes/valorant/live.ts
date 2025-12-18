import { Elysia } from 'elysia'
import { z } from 'zod'
import { REST, Routes } from 'discord.js'
import { app } from '@/structures/app/App'
import EmbedBuilder from '@/structures/builders/EmbedBuilder'
import locales from '@i18n'
import ButtonBuilder from '@/structures/builders/ButtonBuilder'
import { env } from '@/env'

const tournaments: { [key: string]: RegExp[] } = {
  'Valorant Champions Tour': [
    /valorant champions/,
    /valorant masters/,
    /vct \d{4}/
  ],
  'Valorant Challengers League': [
    /challengers \d{4}/
  ],
  'Valorant Game Changers': [
    /game changers \d{4}/
  ]
}

const rest = new REST().setToken(env.BOT_TOKEN)

export const valorantLive = new Elysia()
  .post(
    '/webhooks/live/valorant',
    async(req) => {
      const guilds = await app.prisma.guild.findMany({
        where: {
          valorant_live_feed_channel: {
            not: null
          }
        },
        include: {
          events: {
            where: {
              type: 'valorant'
            }
          },
          live_messages: true
        }
      })

      if(!guilds.length) return

      const messages: Promise<unknown>[] = []

      for(const data of req.body) {
        for(const guild of guilds) {
          if(
            !guild.events.some(e => e.name === data.tournament.name) &&
            !guild.events.some(e =>
              tournaments[e.name]?.some(regex =>
                regex.test(data.tournament.name.replace(/\s+/g, ' ').trim().toLowerCase())
              )
            )
          ) continue

          const emoji1 = app.emoji.get(data.teams[0].name.toLowerCase())
            ?? app.emoji.get(app.emojiAliases.get(data.teams[0].name.toLowerCase()) ?? '')
            ?? app.emoji.get('default')
          const emoji2 = app.emoji.get(data.teams[1].name.toLowerCase())
            ?? app.emoji.get(app.emojiAliases.get(data.teams[1].name.toLowerCase()) ?? '')
            ?? app.emoji.get('default')

          const embed = new EmbedBuilder()
            .setAuthor({
              name: data.tournament.name,
              iconURL: data.tournament.image
            })
            .setTitle(locales(guild.lang ?? 'en', 'helper.live_now'))
            .setField(
              `${emoji1} ${data.teams[0].name} \`${data.teams[0].score}\` <:versus:1349105624180330516> \`${data.teams[1].score}\` ${data.teams[1].name} ${emoji2}`,
              locales(guild.lang ?? 'en', 'helper.live_feed_value', {
                map: data.currentMap,
                score: `${data.score1}-${data.score2}`
              })
            )
            .setFooter({ text: data.stage })

          const button = new ButtonBuilder()
            .defineStyle('link')
            .setLabel(locales(guild.lang ?? 'en', 'helper.stats'))
            .setURL(data.url)

          messages.push(
            rest.post(Routes.channelMessages(guild.valorant_live_feed_channel!), {
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
      body: z.array(z.object({
        teams: z.array(z.object({
          name: z.string(),
          score: z.string()
        })),
        currentMap: z.string(),
        score1: z.string(),
        score2: z.string(),
        id: z.string(),
        url: z.string(),
        stage: z.string(),
        tournament: z.object({
          name: z.string(),
          image: z.string()
        })
      }))
    }
  )