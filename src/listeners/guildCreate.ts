import { REST, Routes, type APIWebhook } from 'discord.js'
import createListener from '../structures/app/createListener'
import EmbedBuilder from '../structures/builders/EmbedBuilder'
import { prisma } from '@db'
import { env } from '@/env'

const rest = new REST().setToken(env.BOT_TOKEN)

export default createListener({
  name: 'guildCreate',
  async run(client, guild) {
    const blacklist = await prisma.blacklist.findMany()
    const ban = blacklist.find(g => g.id === guild.id)

    if(ban) return await guild.leave()

    const owner = await client.getUser(guild.ownerId)

    const embed = new EmbedBuilder()
      .setTitle(`I've been added to \`${guild.name} (${guild.id})\``)
      .setDesc(`Now I'm on ${client.guilds.cache.size} guilds`)
      .addField('Owner', `\`${owner?.username} (${owner?.id})`, true)
      .addField('Member count', guild.memberCount.toString(), true)
      .setThumb(guild.iconURL()!)

    const webhooks = await rest.get(Routes.channelWebhooks(env.ERROR_LOG)) as APIWebhook[]
    let webhook = webhooks.find(w => w.name === `${client.user?.username} Logger`)
    
    if(!webhook) {
      webhook = await rest.post(Routes.channelWebhooks(env.ERROR_LOG), {
        body: {
          name: `${client.user?.username} Logger`
        }
      }) as APIWebhook
    }
    
    await rest.post(Routes.webhook(webhook.id, webhook.token), {
      body: {
        embeds: [embed],
        avatar_url: client.user?.displayAvatarURL({ size: 2048 })
      }
    })
  }
})