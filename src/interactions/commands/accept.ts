import { ProfileSchema } from '@db'
import { ComponentType, type InteractionCallbackResponse } from 'discord.js'
import { type valorant_agents, valorant_maps } from '../../config'
import EmbedBuilder from '../../structures/builders/EmbedBuilder'
import SelectMenuBuilder from '../../structures/builders/SelectMenuBuilder'
import createComponentInteraction from '../../structures/interaction/createComponentInteraction'

export default createComponentInteraction({
  name: 'accept',
  time: 60 * 1000,
  async run({ ctx, app, t }) {
    const profile = await ProfileSchema.fetch(ctx.args[2], ctx.db.guild.id)

    const keys = await app.redis.keys(`agent_selection:${ctx.db.guild.id}*`)

    if (!ctx.db.profile.team_name || !ctx.db.profile.team_tag) {
      return await ctx.reply('commands.duel.needed_team_name')
    }

    if (ctx.db.profile.active_players.length < 5) {
      return await ctx.reply('commands.duel.team_not_completed_1')
    }

    if (!profile || profile.active_players.length < 5) {
      return await ctx.reply('commands.duel.team_not_completed_2')
    }

    if (!profile.team_name || !profile.team_tag) {
      return await ctx.reply('commands.duel.needed_team_name_2')
    }

    if (
      (await app.redis.get(`match:${ctx.interaction.user.id}`)) ||
      keys.some(key => key.includes(ctx.interaction.user.id))
    ) {
      return await ctx.reply('commands.duel.already_in_match')
    }

    if ((await app.redis.get(`match:${profile.id}`)) || keys.some(key => key.includes(profile.id))) {
      return await ctx.reply('commands.duel.already_in_match_2')
    }

    let maps = valorant_maps

    if (ctx.args.includes('ranked')) {
      maps = maps.filter(map => map.current_map_pool)
    }

    let map = maps[Math.floor(Math.random() * maps.length)]

    if (ctx.args.includes('tournament')) {
      map = valorant_maps.filter(m => m.name === ctx.args[4])[0]
    }

    const embed = new EmbedBuilder()
      .setTitle(t('commands.duel.embed.title'))
      .setDesc(t('commands.duel.embed.desc'))
      .setFields(
        {
          name: profile.team_name,
          value: profile.active_players
            .map(id => {
              const player = app.players.get(id)!
              const ovr = Math.floor(player.ovr)
              return `<a:loading:809221866434199634> ${player.name} (${ovr})`
            })
            .join('\n'),
          inline: true
        },
        {
          name: ctx.db.profile.team_name,
          value: ctx.db.profile.active_players
            .map(id => {
              const player = app.players.get(id)!
              const ovr = Math.floor(player.ovr)
              return `<a:loading:809221866434199634> ${player.name} (${ovr})`
            })
            .join('\n'),
          inline: true
        }
      )
      .setImage(map.image)
      .setFooter({ text: t('commands.duel.time') })

    const menu1 = new SelectMenuBuilder()
      .setPlaceholder(profile.team_name)
      .setOptions(
        ...profile.active_players.map(id => {
          const player = app.players.get(id)!
          return {
            label: `${player.name}`,
            value: player.id.toString()
          }
        })
      )
      .setCustomId(`select;${profile.userId};${ctx.interaction.user.id}`)

    const menu2 = new SelectMenuBuilder()
      .setPlaceholder(ctx.db.profile.team_name!)
      .setOptions(
        ...ctx.db.profile.active_players.map(id => {
          const player = app.players.get(id)!
          return {
            label: `${player.name}`,
            value: player.id.toString()
          }
        })
      )
      .setCustomId(`select;${ctx.interaction.user.id};${profile.userId}`)

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
        HS: number
        movement: number
        aggression: number
        ACS: number
        gamesense: number
        ovr: number
        agent: {
          name: string
          role: (typeof valorant_agents)[number]['role']
        } | null
      }[]
    } = {}

    data[ctx.db.profile.userId] = ctx.db.profile.active_players.map(id => {
      const p = app.players.get(id)!
      const ovr = p.ovr
      return {
        ...p,
        ovr,
        agent: null
      }
    })

    data[profile.userId] = profile.active_players.map(id => {
      const p = app.players.get(id)!
      const ovr = p.ovr
      return {
        ...p,
        ovr,
        agent: null
      }
    })

    await app.redis.set(
      `agent_selection:${ctx.db.guild.id}:${profile.userId}:${ctx.interaction.user.id}`,
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
