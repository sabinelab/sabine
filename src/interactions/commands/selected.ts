import { SabineUser } from '@db'
import { ChannelType } from 'discord.js'
import { valorant_agents, valorant_maps } from '../../config'
import Match from '../../simulator/vanilla/Match'
import EmbedBuilder from '../../structures/builders/EmbedBuilder'
import createComponentInteraction from '../../structures/interaction/createComponentInteraction'
import Logger from '../../util/Logger'

export default createComponentInteraction({
  name: 'selected',
  time: 7 * 60 * 1000,
  flags: 64,
  async run({ ctx, app, t }) {
    if (!ctx.interaction.isStringSelectMenu()) return

    const agentName = ctx.interaction.values[0]

    const keys = await app.redis.keys('agent_selection*')
    const key = keys.find(key => key.includes(ctx.interaction.user.id))

    if (!key) return

    const value = await app.redis.get(key)

    if (!value) return

    let data = JSON.parse(value)

    let duplicatedAgent = false

    for (const p of data[ctx.interaction.user.id]) {
      if (!p.agent) continue

      if (p.agent.name === agentName) duplicatedAgent = true
    }

    if (duplicatedAgent) {
      return await ctx.reply('commands.duel.duplicated_agent')
    }

    const i = data[ctx.interaction.user.id].findIndex((p: any) => p.id.toString() === ctx.args[2])

    data[ctx.interaction.user.id][i] = {
      ...data[ctx.interaction.user.id][i],
      agent: {
        name: agentName,
        role: valorant_agents.find(a => a.name === agentName)!.role
      }
    }

    await app.redis.set(key, JSON.stringify(data), 'EX', 600)

    data = JSON.parse((await app.redis.get(key))!)

    const user = await SabineUser.fetch(ctx.args.at(-1)!)

    if (!user) return

    const embed = new EmbedBuilder()
      .setTitle(t('commands.duel.embed.title'))
      .setDesc(t('commands.duel.embed.desc'))
      .setImage(data.image)
      .setFields(
        {
          name: key.split(':')[1] === ctx.interaction.user.id ? ctx.db.user.team_name! : user.team_name!,
          value:
            key.split(':')[1] === ctx.interaction.user.id
              ? ctx.db.user.active_players
                  .map(id => {
                    const player = app.players.get(id)!

                    let emoji: string | undefined = '<a:loading:809221866434199634>'

                    const i = data[ctx.interaction.user.id].findIndex((p: any) => p.id.toString() === id)

                    if (
                      data[ctx.interaction.user.id][i].id.toString() === id &&
                      data[ctx.interaction.user.id][i].agent
                    ) {
                      emoji = valorant_agents.find(
                        agent => agent.name === data[ctx.interaction.user.id][i].agent!.name
                      )?.emoji
                    }

                    const ovr = Math.floor(player.ovr)

                    return `${emoji} ${player.name} (${ovr})`
                  })
                  .join('\n')
              : user.active_players
                  .map(id => {
                    const player = app.players.get(id)!

                    let emoji: string | undefined = '<a:loading:809221866434199634>'

                    const i = data[user.id].findIndex((p: any) => p.id.toString() === id)

                    if (data[user.id][i].id.toString() === id && data[user.id][i].agent) {
                      emoji = valorant_agents.find(agent => agent.name === data[user.id][i].agent!.name)?.emoji
                    }

                    const ovr = Math.floor(player.ovr)

                    return `${emoji} ${player.name} (${ovr})`
                  })
                  .join('\n'),
          inline: true
        },
        {
          name: key.split(':')[1] !== ctx.interaction.user.id ? ctx.db.user.team_name! : user.team_name!,
          value:
            key.split(':')[1] !== ctx.interaction.user.id
              ? ctx.db.user.active_players
                  .map(id => {
                    const player = app.players.get(id)!

                    let emoji: string | undefined = '<a:loading:809221866434199634>'

                    const i = data[ctx.interaction.user.id].findIndex((p: any) => p.id.toString() === id)

                    if (
                      data[ctx.interaction.user.id][i].id.toString() === id &&
                      data[ctx.interaction.user.id][i].agent
                    ) {
                      emoji = valorant_agents.find(
                        agent => agent.name === data[ctx.interaction.user.id][i].agent!.name
                      )?.emoji
                    }

                    const ovr = Math.floor(player.ovr)

                    return `${emoji} ${player.name} (${ovr})`
                  })
                  .join('\n')
              : user.active_players
                  .map(id => {
                    const player = app.players.get(id)!

                    let emoji: string | undefined = '<a:loading:809221866434199634>'

                    const i = data[user.id].findIndex((p: any) => p.id.toString() === id)

                    if (data[user.id][i].id.toString() === id && data[user.id][i].agent) {
                      emoji = valorant_agents.find(agent => agent.name === data[user.id][i].agent!.name)?.emoji
                    }

                    const ovr = Math.floor(player.ovr)

                    return `${emoji} ${player.name} (${ovr})`
                  })
                  .join('\n'),
          inline: true
        }
      )
      .setFooter({ text: t('commands.duel.time') })

    const channel = app.channels.cache.get(data.channelId)

    if (!channel || channel.type !== ChannelType.GuildText) return

    const message = channel.messages.cache.get(data.messageId)

    if (!message) return

    await ctx.edit('commands.duel.agent_selected', {
      p: app.players.get(ctx.args[2])!.name,
      agent: agentName
    })

    if (
      data[ctx.interaction.user.id].filter((p: any) => p.agent).length === 5 &&
      data[user.id].filter((p: any) => p.agent).length === 5
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
              roster: data[ctx.db.user.id],
              name: ctx.db.user.team_name!,
              tag: ctx.db.user.team_tag!,
              user: ctx.db.user.id
            },
            {
              roster: data[user.id],
              name: user.team_name!,
              tag: user.team_tag!,
              user: user.id
            }
          ],
          ctx: message!,
          t,
          mode: data.mode,
          map: data.map,
          content: '',
          overtime: data.mode === 'tournament'
        })

        const embed = new EmbedBuilder()
          .setTitle(t(`simulator.mode.${match.mode}`))
          .setDesc(
            `### ${match.teams[0].name} 0 <:versus:1349105624180330516> 0 ${match.teams[1].name}` +
              '\n' +
              t('simulator.match_started')
          )
          .setImage(valorant_maps.filter(map => map.name === match.map)[0].image)

        await message.edit({ embeds: [embed] })

        const keys = await app.redis.keys('agent_selection*')
        const key = keys.filter(k => k.includes(ctx.interaction.user.id))[0]

        await app.redis.del(key)

        try {
          while (!match.finished) {
            await app.redis.set(`match:${ctx.db.user.id}`, '1')
            await app.redis.set(`match:${user.id}`, '1')

            await match.wait(2500)

            match = await match.start()
          }
        } catch (e) {
          await app.redis.del(`match:${ctx.db.user.id}`)
          await app.redis.del(`match:${user.id}`)

          await ctx.reply('commands.duel.error', {
            users: `${ctx.interaction.user} <@${match.teams[1].user}>`,
            e: e as Error
          })

          await new Logger(app).error(e as Error)
        } finally {
          await app.redis.del(`match:${ctx.db.user.id}`)
          await app.redis.del(`match:${user.id}`)
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
