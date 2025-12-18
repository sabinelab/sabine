import { ChannelType } from 'discord.js'
import createListener from '../structures/app/createListener'
import EmbedBuilder from '../structures/builders/EmbedBuilder'
import { env } from '@/env'

export default createListener({
  name: 'guildDelete',
  async run(client, guild) {
    const owner = await client.getUser(guild.ownerId)

    const embed = new EmbedBuilder()
      .setTitle(`I've been removed from \`${guild.name} (${guild.id})\``)
      .setDesc(`Now I'm on ${client.guilds.cache.size} guilds`)
      .addField('Owner', `\`${owner?.username} (${owner?.id})`, true)
      .addField('Member count', guild.memberCount.toString(), true)
      .setThumb(guild.iconURL()!)

    const channel = await client.channels.fetch(env.GUILDS_LOG!)

    if(!channel || channel.type !== ChannelType.GuildText) return

    const webhooks = await channel.fetchWebhooks()

    let webhook = webhooks.find(w => w.name === `${client.user?.username} Logger`)

    if(!webhook) webhook = await channel.createWebhook({ name: `${client.user?.username} Logger` })

    await webhook.send({
      embeds: [embed],
      avatarURL: client.user?.displayAvatarURL({ size: 2048 })
    })
  }
})