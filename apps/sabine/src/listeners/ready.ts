import { prisma } from '@db'
import t from '@i18n'
import * as Discord from 'discord.js'
import pLimit from 'p-limit'
import { env } from '@/env'
import type App from '@/structures/app/App'
import createListener from '@/structures/app/createListener'
import EmbedBuilder from '@/structures/builders/EmbedBuilder'
import { type LivePayload, liveQueue } from '@/structures/queue/live-queue'
import { type NewsPayload, newsQueue } from '@/structures/queue/news-queue'
import { type ResultsPayload, resultsQueue } from '@/structures/queue/results-queue'
import calcOdd from '@/util/calcOdd'
import Logger from '@/util/Logger'

const tournaments: { [key: string]: RegExp[] } = {
  'Valorant Champions Tour': [/valorant champions/, /valorant masters/, /vct \d{4}/],
  'Valorant Challengers League': [/challengers \d{4}/],
  'Valorant Game Changers': [/game changers \d{4}/]
}

const rest = new Discord.REST().setToken(env.BOT_TOKEN)

const limit = pLimit(25)

const processPredictions = async (data: ResultsPayload) => {
  const [oddA, oddB] = await Promise.all([
    prisma.prediction.count({
      where: {
        match: data.id,
        status: 'pending',
        bet: { not: null },
        teams: {
          some: {
            name: data.teams[0].name,
            winner: true
          }
        }
      }
    }),
    prisma.prediction.count({
      where: {
        match: data.id,
        status: 'pending',
        bet: { not: null },
        teams: {
          some: {
            name: data.teams[1].name,
            winner: true
          }
        }
      }
    })
  ])

  let cursor: string | undefined

  while (true) {
    const preds = await prisma.prediction.findMany({
      take: 500,
      skip: cursor ? 1 : 0,
      cursor: cursor
        ? {
            id: cursor
          }
        : undefined,
      where: {
        game: data.game,
        match: data.id,
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

    if (!preds.length) break

    let winnerIndex = -1

    const hasbets = preds.some(m => m.bet)

    if (hasbets) {
      winnerIndex = data.teams.findIndex(t => t.winner)
    }

    const transactions = preds.flatMap(pred => {
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
    cursor = preds[preds.length - 1].id
  }
}

const processResult = async (app: App, data: ResultsPayload) => {
  data.when = new Date(data.when)

  const matchedEventNames = Object.keys(tournaments).filter(
    key =>
      key.toLowerCase() === data.tournament.name ||
      tournaments[key].some(regex => regex.test(data.tournament.name.toLowerCase()))
  )

  if (!matchedEventNames.includes(data.tournament.name)) {
    matchedEventNames.push(data.tournament.name)
  }

  let cursor: string | undefined

  while (true) {
    const guilds = await prisma.guild.findMany({
      take: 1000,
      skip: cursor ? 1 : 0,
      cursor: cursor
        ? {
            id: cursor
          }
        : undefined,
      where: {
        events: {
          some: {
            type: data.game,
            name: {
              in: matchedEventNames
            }
          }
        }
      },
      select: {
        id: true,
        lang: true,
        events: {
          where: {
            type: data.game,
            name: {
              in: matchedEventNames
            }
          },
          select: {
            name: true,
            channel2: true
          }
        }
      }
    })

    if (!guilds.length) break

    const messages: Promise<unknown>[] = []

    for (const guild of guilds) {
      if (!guild.events[0]) continue

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

      const row = new Discord.ActionRowBuilder<Discord.ButtonBuilder>().setComponents(
        new Discord.ButtonBuilder()
          .setLabel(t(guild.lang, 'helper.stats'))
          .setStyle(Discord.ButtonStyle.Link)
          .setURL(`https://vlr.gg/${data.id}`),
        new Discord.ButtonBuilder()
          .setStyle(Discord.ButtonStyle.Primary)
          .setLabel(t(guild.lang, 'helper.predictions'))
          .setCustomId(`show-predictions;${data.game};${data.id}`)
      )

      messages.push(
        limit(() =>
          rest.post(Discord.Routes.channelMessages(guild.events[0].channel2), {
            body: {
              embeds: [embed.toJSON()],
              components: [row.toJSON()]
            }
          })
        )
      )
    }

    await Promise.allSettled(messages)
    cursor = guilds[guilds.length - 1].id
  }
}

const processLive = async (app: App, data: LivePayload) => {
  const matchedEventNames = Object.keys(tournaments).filter(
    key =>
      key.toLowerCase() === data.tournament.name ||
      tournaments[key].some(regex => regex.test(data.tournament.name.toLowerCase()))
  )

  if (!matchedEventNames.includes(data.tournament.name)) {
    matchedEventNames.push(data.tournament.name)
  }

  let cursor: string | undefined

  while (true) {
    const guilds = await prisma.guild.findMany({
      take: 1000,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
      where: {
        [data.game === 'valorant' ? 'valorantLiveFeedChannel' : 'lolLiveFeedChannel']: {
          not: null
        },
        events: {
          some: {
            type: data.game,
            name: {
              in: matchedEventNames
            }
          }
        }
      },
      include: {
        events: {
          where: {
            type: data.game,
            name: {
              in: matchedEventNames
            }
          }
        }
      }
    })

    if (!guilds.length) break

    const messages: Promise<unknown>[] = []

    for (const guild of guilds) {
      const channelId =
        data.game === 'valorant' ? guild.valorantLiveFeedChannel : guild.lolLiveFeedChannel
      if (!channelId) continue

      if (!guild.events.length) continue

      if (!data.teams[0] || !data.teams[1]) continue

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
          name:
            data.game === 'valorant'
              ? data.tournament.name
              : ((data.tournament as any).full_name ?? data.tournament.name),
          iconURL: data.tournament.image
        })
        .setTitle(t(guild.lang, 'helper.live_now'))
        .setField(
          `${emoji1} ${data.teams[0].name} \`${data.teams[0].score}\` <:versus:1349105624180330516> \`${data.teams[1].score}\` ${data.teams[1].name} ${emoji2}`,
          data.game === 'valorant'
            ? t(guild.lang, 'helper.live_feed_value', {
                map: data.currentMap,
                score: `${data.score1}-${data.score2}`
              })
            : ''
        )

      if (data.stage) embed.setFooter({ text: data.stage })

      const button = new Discord.ButtonBuilder()
      if (data.game === 'valorant') {
        button
          .setStyle(Discord.ButtonStyle.Link)
          .setLabel(t(guild.lang, 'helper.stats'))
          .setURL(data.url!)
      } else {
        button
          .setStyle(Discord.ButtonStyle.Primary)
          .setLabel(t(guild.lang, 'helper.streams'))
          .setCustomId(`stream;lol;${data.id}`)
      }

      messages.push(
        limit(() =>
          rest.post(Discord.Routes.channelMessages(channelId), {
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

    await Promise.allSettled(messages)
    cursor = guilds[guilds.length - 1].id
  }
}

const processNews = async (data: NewsPayload) => {
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

      const button = new Discord.ButtonBuilder()
        .setStyle(Discord.ButtonStyle.Link)
        .setLabel(t(guild.lang, 'helper.source'))
        .setURL(data.url)

      messages.push(
        limit(() =>
          rest.post(Discord.Routes.channelMessages(channelId), {
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

export default createListener({
  name: 'clientReady',
  async run(app) {
    if (app.shard?.ids[0]) return

    resultsQueue
      .on('error', e => new Logger(app).error(e))
      .process(async job => {
        await processPredictions(job.data)
        await processResult(app, job.data)
      })

    liveQueue
      .on('error', e => new Logger(app).error(e))
      .process(async job => {
        await processLive(app, job.data)
      })

    newsQueue
      .on('error', e => new Logger(app).error(e))
      .process(async job => {
        await processNews(job.data)
      })
  }
})
