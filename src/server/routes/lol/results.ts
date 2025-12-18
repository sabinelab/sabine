import { Elysia } from 'elysia'
import { z } from 'zod'
import { app } from '@/structures/app/App'
import EmbedBuilder from '@/structures/builders/EmbedBuilder'
import locales from '@i18n'
import ButtonBuilder from '@/structures/builders/ButtonBuilder'
import calcOdd from '@/util/calcOdd'
import { prisma, SabineUser } from '@db'
import { REST, Routes } from 'discord.js'
import { env } from '@/env'

const rest = new REST().setToken(env.BOT_TOKEN)

export const lolResults = new Elysia()
  .post(
    '/webhooks/results/lol',
    async(req) => {
      const guilds = await app.prisma.guild.findMany({
        where: {
          events: {
            some: {
              type: 'lol'
            }
          }
        },
        include: {
          events: {
            where: {
              type: 'lol'
            }
          },
          key: true
        }
      })

      const preds = await app.prisma.prediction.findMany({
        where: {
          game: 'lol'
        },
        include: {
          teams: true
        }
      })

      if(!guilds.length) return

      const messages: Promise<unknown>[] = []

      for(
        const data of req.body
          .map(body => ({
            ...body,
            when: new Date(body.when)
          }))
      ) {
        for(const guild of guilds) {
          const event = guild.events.find(e => e.name === data.tournament.name)

          if(!event) continue

          if(!guild.events.some(e => e.name === data.tournament.name)) continue

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
            .setField(
              `${emoji1} ${data.teams[0].name} \`${data.teams[0].score}\` <:versus:1349105624180330516> \`${data.teams[1].score}\` ${data.teams[1].name} ${emoji2}`,
              `<t:${data.when.getTime() / 1000}:F> | <t:${data.when.getTime() / 1000}:R>`,
              true
            )
            .setFooter({ text: data.stage })

          messages.push(
            rest.post(Routes.channelMessages(event.channel2), {
              body: {
                embeds: [embed.toJSON()],
                components: [
                  {
                    type: 1,
                    components: [
                      new ButtonBuilder()
                        .setLabel(locales(guild.lang, 'helper.pickem.label'))
                        .defineStyle('blue')
                        .setCustomId('pickem')
                    ]
                  }
                ]
              }
            })
          )
        }
      }

      if(!preds.length) return

      const usersIds = [...new Set(preds.map(pred => pred.userId))]

      const usersData = await app.prisma.user.findMany({
        where: {
          id: { in: usersIds }
        }
      })

      const userMap = new Map<string, SabineUser>()

      for(const data of usersData) {
        let user = new SabineUser(data.id)
        user = Object.assign(user, data)

        userMap.set(user.id, user)
      }

      const transactions: Promise<unknown>[] = []

      for(const data of req.body) {
        for(const pred of preds) {
          if(data.id !== pred.match) continue

          const user = userMap.get(pred.userId)

          if(!user) continue

          const transaction = async() => {
            if(pred.teams[0].score === data.teams[0].score && pred.teams[1].score === data.teams[1].score) {
              let odd: number | null = null
              let bonus = 0

              if(pred.bet) {
                const winnerIndex = data.teams.findIndex(t => t.winner)

                if(pred.teams[winnerIndex].winner) {
                  let oddA = 0
                  let oddB = 0

                  for(const p of preds) {
                    if(p.teams[0].winner && p.bet) {
                      oddA += 1
                    }

                    else if(p.teams[1].winner && p.bet) {
                      oddB += 1
                    }
                  }

                  if(pred.teams[0].winner) {
                    odd = calcOdd(oddA)
                  }
                  else {
                    odd = calcOdd(oddB)
                  }

                  if(user.premium) {
                    bonus = Number(pred.bet) / 2
                  }
                }
              }

              const coins = BigInt(Number(pred.bet) * (odd ?? 1)) + BigInt(bonus)
              const fates = 5

              await prisma.$transaction([
                app.prisma.prediction.update({
                  where: {
                    id: pred.id
                  },
                  data: {
                    odd: odd,
                    status: 'correct'
                  }
                }),
                app.prisma.user.update({
                  where: { id: user.id },
                  data: {
                    correct_predictions: {
                      increment: 1
                    },
                    coins: { increment: coins },
                    fates: { increment: fates }
                  }
                })
              ])
            }
            else {
              await user.addIncorrectPrediction('lol', data.id)
            }
          }

          transactions.push(transaction())
        }
      }

      await Promise.allSettled([...messages, ...transactions])

      req.set.status = 'OK'

      return { ok: true }
    },
    {
      body: z.array(z.object({
        id: z.string(),
        teams: z.array(z.object({
          name: z.string(),
          score: z.string(),
          winner: z.boolean()
        })),
        tournament: z.object({
          name: z.string(),
          full_name: z.string(),
          image: z.string()
        }),
        stage: z.string(),
        when: z.string()
      }))
    }
  )