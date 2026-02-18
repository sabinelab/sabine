import { ProfileSchema } from '@db'
import { type valorantAgents, valorantMaps } from '@sabinelab/utils'
import { ComponentType, type InteractionCallbackResponse } from 'discord.js'
import EmbedBuilder from '../../structures/builders/EmbedBuilder'
import SelectMenuBuilder from '../../structures/builders/SelectMenuBuilder'
import createComponentInteraction from '../../structures/interaction/createComponentInteraction'

export default createComponentInteraction({
  name: 'accept',
  time: 60 * 1000,
  async run({ ctx, app, t }) {
    const profile = await ProfileSchema.fetch(ctx.args[2], ctx.db.guild.id)
    if (!profile) {
      return await ctx.reply('commands.duel.team_not_completed_2')
    }

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

    const keys = await app.redis.keys(`agent_selection:${ctx.db.guild.id}*`)

    if (!ctx.db.profile.teamName || !ctx.db.profile.teamTag) {
      return await ctx.reply('commands.duel.needed_team_name')
    }

    if (authorCards.length < 5) {
      return await ctx.reply('commands.duel.team_not_completed_1')
    }

    if (userCards.length < 5) {
      return await ctx.reply('commands.duel.team_not_completed_2')
    }

    if (!profile.teamName || !profile.teamTag) {
      return await ctx.reply('commands.duel.needed_team_name_2')
    }

    if (
      (await app.redis.get(`match:${ctx.db.guild.id}:${ctx.author.id}`)) ||
      keys.some(key => key.includes(ctx.author.id))
    ) {
      return await ctx.reply('commands.duel.already_in_match')
    }

    if (
      (await app.redis.get(`match:${ctx.db.guild.id}:${profile.userId}`)) ||
      keys.some(key => key.includes(profile.userId))
    ) {
      return await ctx.reply('commands.duel.already_in_match_2')
    }

    let maps = valorantMaps

    if (ctx.args.includes('ranked')) {
      maps = maps.filter(map => map.current_map_pool)
    }

    let map = maps[Math.floor(Math.random() * maps.length)]

    if (ctx.args.includes('tournament')) {
      map = valorantMaps.filter(m => m.name === ctx.args[4])[0]
    }

    const embed = new EmbedBuilder()
      .setTitle(t('commands.duel.embed.title'))
      .setDesc(t('commands.duel.embed.desc'))
      .setFields(
        {
          name: profile.teamName,
          value: userCards
            .map(card => {
              const player = app.players.get(card.playerId)!
              const ovr = Math.floor(card.overall)
              return `<a:loading:809221866434199634> ${player.name} (${ovr})`
            })
            .join('\n'),
          inline: true
        },
        {
          name: ctx.db.profile.teamName,
          value: authorCards
            .map(card => {
              const player = app.players.get(card.playerId)!
              const ovr = Math.floor(card.overall)
              return `<a:loading:809221866434199634> ${player.name} (${ovr})`
            })
            .join('\n'),
          inline: true
        }
      )
      .setImage(map.image)
      .setFooter({ text: t('commands.duel.time') })

    const menu1 = new SelectMenuBuilder()
      .setPlaceholder(profile.teamName)
      .setOptions(
        ...userCards.map(card => {
          const player = app.players.get(card.playerId)!
          return {
            label: `${player.name}`,
            value: card.playerId
          }
        })
      )
      .setCustomId(`select;${profile.userId};${ctx.author.id}`)

    const menu2 = new SelectMenuBuilder()
      .setPlaceholder(ctx.db.profile.teamName!)
      .setOptions(
        ...authorCards.map(card => {
          const player = app.players.get(card.playerId)!
          return {
            label: `${player.name}`,
            value: card.playerId
          }
        })
      )
      .setCustomId(`select;${ctx.author.id};${profile.userId}`)

    const interaction = (await ctx.edit({
      embeds: [embed],
      content: `${ctx.interaction.user} <@${profile.userId}>`,
      components: [
        {
          type: ComponentType.ActionRow,
          components: [menu1]
        },
        {
          type: ComponentType.ActionRow,
          components: [menu2]
        }
      ]
    })) as InteractionCallbackResponse

    const data: {
      [key: string]: {
        name: string
        id: number
        role: string
        aim: number
        hs: number
        movement: number
        aggression: number
        acs: number
        gamesense: number
        ovr: number
        agent: {
          name: string
          role: (typeof valorantAgents)[number]['role']
        } | null
      }[]
    } = {}

    data[ctx.db.profile.userId] = authorCards.map(card => {
      const p = app.players.get(card.playerId)!

      return {
        ...p,
        aim: card.aim,
        acs: card.acs,
        aggression: card.aggression,
        gamesense: card.gamesense,
        hs: card.hs,
        movement: card.movement,
        ovr: card.overall,
        agent: null
      }
    })

    data[profile.userId] = userCards.map(card => {
      const p = app.players.get(card.playerId)!

      return {
        ...p,
        aim: card.aim,
        acs: card.acs,
        aggression: card.aggression,
        gamesense: card.gamesense,
        hs: card.hs,
        movement: card.movement,
        ovr: card.overall,
        agent: null
      }
    })

    await app.redis.set(
      `agent_selection:${ctx.db.guild.id}:${profile.userId}:${ctx.author.id}`,
      JSON.stringify({
        ...data,
        messageId: interaction.resource?.message?.id,
        channelId: interaction.resource?.message?.channelId,
        map: map.name,
        image: map.image,
        mode: ctx.args[3] === 'tournament' ? 'tournament' : ctx.args.slice(3).join(':')
      }),
      'EX',
      300
    )
  }
})
