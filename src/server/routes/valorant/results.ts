import { prisma } from '@db'
import locales from '@i18n'
import * as Discord from 'discord.js'
import { Elysia } from 'elysia'
import { z } from 'zod'
import { env } from '@/env'
import { app } from '@/structures/app/App'
import ButtonBuilder from '@/structures/builders/ButtonBuilder'
import EmbedBuilder from '@/structures/builders/EmbedBuilder'
import calcOdd from '@/util/calcOdd'

const tournaments: { [key: string]: RegExp[] } = {
  'Valorant Champions Tour': [/valorant champions/, /valorant masters/, /vct \d{4}/],
  'Valorant Challengers League': [/challengers \d{4}/],
  'Valorant Game Changers': [/game changers \d{4}/]
}

const rest = new Discord.REST().setToken(env.BOT_TOKEN)

const chunk = <T>(arr: T[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  )

export const valorantResults = new Elysia().post(
  '/webhooks/results/valorant',
  async req => {
    const preds = await prisma.prediction.findMany({
      where: {
        game: 'valorant',
        match: {
          in: req.body.map(b => b.id)
        },
        status: 'pending'
      },
      include: {
        teams: true,
        profile: {
          select: {
            id: true,
            user: {
              select: {
                premium: true
              }
            }
          }
        }
      }
    })

    let cursor: string | undefined

    while (true) {
      const guilds = await prisma.guild.findMany({
        take: 1000,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { id: 'asc' },
        where: {
          events: {
            some: {
              type: 'valorant'
            }
          }
        },
        include: {
          events: {
            where: {
              type: 'valorant'
            }
          },
          key: true
        }
      })

      if (!guilds.length) break

      const messages: Promise<unknown>[] = []

      for (const data of req.body.map(body => ({
        ...body,
        when: new Date(body.when)
      }))) {
        for (const guild of guilds) {
          const event = guild.events.find(
            e =>
              e.name === data.tournament.name ||
              tournaments[e.name]?.some(regex =>
                regex.test(data.tournament.name.replace(/\s+/g, ' ').trim().toLowerCase())
              )
          )

          if (!event) continue

          if (
            !guild.events.some(e => e.name === data.tournament.name) &&
            !guild.events.some(e =>
              tournaments[e.name]?.some(regex =>
                regex.test(data.tournament.name.replace(/\s+/g, ' ').trim().toLowerCase())
              )
            )
          )
            continue

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
              name: data.tournament.name,
              iconURL: data.tournament.image
            })
            .setField(
              `${emoji1} ${data.teams[0].name} \`${data.teams[0].score}\` <:versus:1349105624180330516> \`${data.teams[1].score}\` ${data.teams[1].name} ${emoji2}`,
              `<t:${data.when.getTime() / 1000}:F> | <t:${data.when.getTime() / 1000}:R>`,
              true
            )
            .setFooter({ text: data.stage })

          messages.push(
            rest.post(Discord.Routes.channelMessages(event.channel2), {
              body: {
                embeds: [embed.toJSON()],
                components: [
                  {
                    type: 1,
                    components: [
                      new ButtonBuilder()
                        .setLabel(locales(guild.lang, 'helper.stats'))
                        .defineStyle('link')
                        .setURL(`https://vlr.gg/${data.id}`)
                    ]
                  }
                ]
              }
            })
          )
        }
      }

      await Promise.allSettled(messages)

      cursor = guilds[guilds.length - 1].id
    }

    for (const data of req.body) {
      const matchPreds = preds.filter(p => p.match === data.id)
      if (!matchPreds.length) continue

      let oddA = 0
      let oddB = 0
      let winnerIndex = -1

      const hasbets = matchPreds.some(m => m.bet)

      if (hasbets) {
        winnerIndex = data.teams.findIndex(t => t.winner)

        for (const pred of matchPreds) {
          if (pred.bet) {
            if (pred.teams[0].winner) {
              oddA++
            } else if (pred.teams[1].winner) {
              oddB++
            }
          }
        }
      }

      const batches = chunk(matchPreds, 50)

      for (const batch of batches) {
        const transactions = batch.flatMap(pred => {
          if (
            pred.teams[0].score === data.teams[0].score &&
            pred.teams[1].score === data.teams[1].score
          ) {
            let odd: number | null = null
            let bonus = 0

            if (pred.bet && winnerIndex >= 0) {
              if (pred.teams[winnerIndex].winner) {
                odd = pred.teams[0].winner ? calcOdd(oddA) : calcOdd(oddB)

                if (pred.profile.user.premium) {
                  bonus = Math.floor(Number(pred.bet) / 2)
                }
              }
            }

            const poisons = BigInt(Math.floor(Number(pred.bet) * (odd ?? 1))) + BigInt(bonus)
            const fates = 35

            return [
              prisma.prediction.update({
                where: { id: pred.id },
                data: {
                  odd: odd ? Math.floor(odd) : undefined,
                  status: 'correct'
                }
              }),
              prisma.profile.update({
                where: { id: pred.profile.id },
                data: {
                  correctPredictions: { increment: 1 },
                  poisons: { increment: poisons },
                  fates: { increment: fates }
                }
              })
            ]
          } else {
            return [
              prisma.prediction.update({
                where: { id: pred.id },
                data: { status: 'incorrect' }
              }),
              prisma.profile.update({
                where: { id: pred.profile.id },
                data: {
                  incorrectPredictions: { increment: 1 }
                }
              })
            ]
          }
        })

        await prisma.$transaction(transactions)
      }
    }

    req.set.status = 'OK'
    return { ok: true }
  },
  {
    body: z.array(
      z.object({
        id: z.string(),
        status: z.string(),
        stage: z.string(),
        when: z.string(),
        url: z.string(),
        teams: z.array(
          z.object({
            name: z.string(),
            score: z.string(),
            country: z.string(),
            winner: z.boolean()
          })
        ),
        tournament: z.object({
          name: z.string(),
          image: z.string()
        })
      })
    )
  }
)
