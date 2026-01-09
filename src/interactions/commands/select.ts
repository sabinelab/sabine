import { ComponentType } from 'discord.js'
import { valorant_agents } from '../../config'
import SelectMenuBuilder from '../../structures/builders/SelectMenuBuilder'
import createComponentInteraction from '../../structures/interaction/createComponentInteraction'

export default createComponentInteraction({
  name: 'select',
  time: 6 * 60 * 1000,
  flags: 64,
  async run({ ctx, t, app }) {
    if (!ctx.interaction.isStringSelectMenu()) return

    const player = app.players.get(ctx.interaction.values[0])

    if (!player) return

    const controllers = new SelectMenuBuilder()
      .setCustomId(`selected;${ctx.interaction.user.id};${player.id};controller;${ctx.args[2]}`)
      .setPlaceholder(t('helper.controllers'))
      .setOptions(
        ...valorant_agents
          .filter(a => a.role === 'controller')
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(agent => {
            return {
              label: agent.name,
              value: agent.name
            }
          })
      )

    const duelists = new SelectMenuBuilder()
      .setCustomId(`selected;${ctx.interaction.user.id};${player.id};duelist;${ctx.args[2]}`)
      .setPlaceholder(t('helper.duelists'))
      .setOptions(
        ...valorant_agents
          .filter(a => a.role === 'duelist')
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(agent => {
            return {
              label: agent.name,
              value: agent.name
            }
          })
      )

    const initiators = new SelectMenuBuilder()
      .setCustomId(`selected;${ctx.interaction.user.id};${player.id};initiator;${ctx.args[2]}`)
      .setPlaceholder(t('helper.initiators'))
      .setOptions(
        ...valorant_agents
          .filter(a => a.role === 'initiator')
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(agent => {
            return {
              label: agent.name,
              value: agent.name
            }
          })
      )

    const sentinels = new SelectMenuBuilder()
      .setCustomId(`selected;${ctx.interaction.user.id};${player.id};sentinel;${ctx.args[2]}`)
      .setPlaceholder(t('helper.sentinels'))
      .setOptions(
        ...valorant_agents
          .filter(a => a.role === 'sentinel')
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(agent => {
            return {
              label: agent.name,
              value: agent.name
            }
          })
      )

    return await ctx.reply({
      components: [
        {
          type: ComponentType.ActionRow,
          components: [controllers]
        },
        {
          type: ComponentType.ActionRow,
          components: [duelists]
        },
        {
          type: ComponentType.ActionRow,
          components: [initiators]
        },
        {
          type: ComponentType.ActionRow,
          components: [sentinels]
        }
      ]
    })
  }
})
