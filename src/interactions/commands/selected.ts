import { ProfileSchema } from '@db'
import type { Card } from '@generated'
import { ChannelType } from 'discord.js'
import { valorantAgents, valorantMaps } from '@/config'
import Match from '@/simulator/vanilla/Match'
import type App from '@/structures/app/App'
import EmbedBuilder from '@/structures/builders/EmbedBuilder'
import createComponentInteraction from '@/structures/interaction/createComponentInteraction'
import Logger from '@/util/Logger'

type Data = {
  [key: string]: {
    name: string
    id: number
    role: string
    aim: number
    HS: number
    movement: number
    aggression: number
    ACS: number
    gamesense: number
    ovr: number
    agent: {
      name: string
      role: (typeof valorantAgents)[number]['role']
    } | null
  }[]
}
type Options = {
  cards: Card[]
  ownerId: string
  data: Data
  app: App
}

const renderTeam = (options: Options) => {
  return options.cards
    .map(card => {
      const player = options.app.players.get(card.playerId)!

      let emoji: string | undefined = '<a:loading:809221866434199634>'

      const foundData = options.data[options.ownerId].find(
        (p: any) => p.id.toString() === card.playerId
      )

      if (foundData?.agent) {
        emoji = valorantAgents.find(agent => agent.name === foundData.agent?.name)?.emoji
      }

      const ovr = Math.floor(card.overall)

      return `${emoji} ${player.name} (${ovr})`
    })
    .join('\n')
}

export default createComponentInteraction({
  name: 'selected',
  time: 7 * 60 * 1000,
  flags: 64,
  async run({ ctx, app, t }) {
    if (!ctx.interaction.isStringSelectMenu()) return

    const agentName = ctx.interaction.values[0]

    const keys = await app.redis.keys(`agent_selection:${ctx.db.guild.id}*`)
    const key = keys.find(key => key.includes(ctx.author.id))

    if (!key) return

    const value = await app.redis.get(key)

    if (!value) return

    let data = JSON.parse(value)

    let duplicatedAgent = false

    for (const p of data[ctx.author.id]) {
      if (!p.agent) continue

      if (p.agent.name === agentName) duplicatedAgent = true
    }

    if (duplicatedAgent) {
      return await ctx.reply('commands.duel.duplicated_agent')
    }

    const card = await ctx.app.prisma.card.findFirst({
      where: {
        id: BigInt(ctx.args[2]),
        profileId: ctx.db.profile.id
      }
    })
    const i = data[ctx.author.id].findIndex((p: any) => p.id.toString() === card?.playerId)

    data[ctx.author.id][i] = {
      ...data[ctx.author.id][i],
      agent: {
        name: agentName,
        role: valorantAgents.find(a => a.name === agentName)!.role
      }
    }

    await app.redis.set(key, JSON.stringify(data), 'EX', 600)

    data = JSON.parse((await app.redis.get(key))!)

    const profile = await ProfileSchema.fetch(ctx.args.at(-1)!, ctx.db.guild.id)

    if (!profile) return

    const [userCards, authorCards] = await Promise.all([
      ctx.app.prisma.card.findMany({
        where: {
          profileId: profile.id,
          activeRoster: true
        }
      }),
      ctx.app.prisma.card.findMany({
        where: {
          profileId: ctx.db.profile.id,
          activeRoster: true
        }
      })
    ])

    const isAuthor = key.split(':')[2] === ctx.author.id

    const embed = new EmbedBuilder()
      .setTitle(t('commands.duel.embed.title'))
      .setDesc(t('commands.duel.embed.desc'))
      .setImage(data.image)
      .setFields(
        {
          name: isAuthor ? ctx.db.profile.teamName! : profile.teamName!,
          value: isAuthor
            ? renderTeam({
                app: ctx.app,
                cards: authorCards,
                ownerId: ctx.author.id,
                data
              })
            : renderTeam({
                app: ctx.app,
                cards: userCards,
                ownerId: profile.userId,
                data
              }),
          inline: true
        },
        {
          name: !isAuthor ? ctx.db.profile.teamName! : profile.teamName!,
          value: !isAuthor
            ? renderTeam({
                app: ctx.app,
                cards: authorCards,
                ownerId: ctx.author.id,
                data
              })
            : renderTeam({
                app: ctx.app,
                cards: userCards,
                ownerId: profile.userId,
                data
              }),
          inline: true
        }
      )
      .setFooter({ text: t('commands.duel.time') })

    const channel = app.channels.cache.get(data.channelId)

    if (!channel || channel.type !== ChannelType.GuildText) return

    const message = channel.messages.cache.get(data.messageId)

    if (!message) return

    await ctx.edit('commands.duel.agent_selected', {
      p: app.players.get(card?.playerId ?? '')!.name,
      agent: agentName
    })

    if (
      data[ctx.author.id].filter((p: any) => p.agent).length === 5 &&
      data[profile.userId].filter((p: any) => p.agent).length === 5
    ) {
      const timeout = 10000

      await message.edit({
        content:
          message.content +
          '\n' +
          t('commands.duel.starting_in', {
            time: `<t:${((Date.now() + timeout) / 1000).toFixed(0)}:R>`
          }),
        embeds: [embed],
        components: []
      })

      setTimeout(async () => {
        let match = new Match({
          teams: [
            {
              roster: data[ctx.db.profile.userId],
              name: ctx.db.profile.teamName!,
              tag: ctx.db.profile.teamTag!,
              user: ctx.db.profile.userId
            },
            {
              roster: data[profile.userId],
              name: profile.teamName!,
              tag: profile.teamTag!,
              user: profile.userId
            }
          ],
          ctx: message!,
          t,
          mode: data.mode,
          map: data.map,
          content: '',
          overtime: data.mode === 'tournament',
          guildId: ctx.db.guild.id
        })

        const embed = new EmbedBuilder()
          .setTitle(t(`simulator.mode.${match.mode}`))
          .setDesc(
            `### ${match.teams[0].name} 0 <:versus:1349105624180330516> 0 ${match.teams[1].name}` +
              '\n' +
              t('simulator.match_started')
          )
          .setImage(valorantMaps.filter(map => map.name === match.map)[0].image)

        await message.edit({ embeds: [embed] })

        const keys = await app.redis.keys(`agent_selection:${ctx.db.guild.id}*`)
        const key = keys.filter(k => k.includes(ctx.author.id))[0]

        await app.redis.unlink(key)

        try {
          while (!match.finished) {
            await app.redis.set(`match:${ctx.db.guild.id}:${ctx.db.profile.userId}`, '1')
            await app.redis.set(`match:${ctx.db.guild.id}:${profile.userId}`, '1')

            await match.wait(2500)

            match = await match.start()
          }
        } catch (e) {
          await app.redis.unlink(`match:${ctx.db.guild.id}:${ctx.db.profile.userId}`)
          await app.redis.unlink(`match:${ctx.db.guild.id}:${profile.userId}`)

          await ctx.reply('commands.duel.error', {
            users: `${ctx.interaction.user} <@${match.teams[1].user}>`,
            e: e as Error
          })

          await new Logger(app).error(e as Error)
        } finally {
          await app.redis.unlink(`match:${ctx.db.guild.id}:${ctx.db.profile.userId}`)
          await app.redis.unlink(`match:${ctx.db.guild.id}:${profile.userId}`)
        }
      }, timeout)
    } else {
      await message.edit({
        embeds: [embed],
        components: message.components
      })
    }
  }
})
