import { prisma } from '@db'
import { ApplicationCommandOptionType, ButtonStyle, ChannelType } from 'discord.js'
import { env } from '@/env'
import ButtonBuilder from '@/structures/builders/ButtonBuilder'
import EmbedBuilder from '@/structures/builders/EmbedBuilder'
import createCommand from '@/structures/command/createCommand'

export const emoji = {
  MAINTENANCE: '<:idle:1462875671637393530> ',
  MONITORING: '<:idle:1462875671637393530> ',
  SCHEDULED: '📅',
  MAJOR_OUTAGE: '<:dnd:1462875533841928268> ',
  PARTIAL_OUTAGE: '<:idle:1462875671637393530> ',
  ONGOING: '<:idle:1462875671637393530>'
} as const

export const colors = {
  MAINTENANCE: 16426522,
  MONITORING: 16426522,
  SCHEDULED: 3369934,
  MAJOR_OUTAGE: 15746887,
  PARTIAL_OUTAGE: 16426522,
  ONGOING: 16426522
} as const

export default createCommand({
  name: 'status',
  aliases: ['s'],
  description: 'Status command',
  onlyDev: true,
  args: {
    list: {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'list',
      description: 'status list'
    },
    create: {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'create',
      description: 'create status'
    },
    edit: {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'edit',
      description: 'edit status',
      args: {
        id: {
          type: ApplicationCommandOptionType.Integer,
          name: 'id',
          description: 'status id',
          required: true
        }
      }
    },
    rm: {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'rm',
      description: 'rm status',
      args: {
        id: {
          type: ApplicationCommandOptionType.Integer,
          name: 'id',
          description: 'status id',
          required: true
        }
      }
    }
  },
  async run({ ctx }) {
    if (ctx.args.list) {
      const list = await ctx.app.prisma.status.findMany()

      if (!list.length) {
        return await ctx.send('There are no active status.')
      }

      const embed = new EmbedBuilder().setTitle('Active Status')

      for (const status of list) {
        embed.addField(`${emoji[status.type]} ${status.title}`, `ID: \`${status.id}\``)
      }

      await ctx.send(embed.build())
    } else if (ctx.args.create) {
      const button = new ButtonBuilder()
        .setCustomId('create-status')
        .setLabel('Create status')
        .setStyle(ButtonStyle.Primary)

      await ctx.send(button.build())
    } else if (ctx.args.edit) {
      const button = new ButtonBuilder()
        .setCustomId(`edit-status;${ctx.args.edit.id}`)
        .setLabel('Edit status')
        .setStyle(ButtonStyle.Primary)

      await ctx.send(button.build())
    } else if (ctx.args.rm) {
      const status = await prisma.status.findUnique({
        where: {
          id: ctx.args.rm.id
        }
      })

      if (!status) {
        return await ctx.send('Invalid status.')
      }

      const channel = await ctx.guild.channels.fetch(env.STATUS_CHANNEL)
      if (!channel || channel.type !== ChannelType.GuildAnnouncement) {
        return await ctx.send('Invalid channel.')
      }

      const message = await channel.messages.fetch(status.messageId)
      if (!message) {
        return await ctx.send('Invalid message')
      }

      const embed = new EmbedBuilder()
        .setTitle(`<:online:1462875701471608976> ${status.title}`)
        .setDesc(status.description)
        .setColor(3386930)

      const button = new ButtonBuilder()
        .setCustomId('join-thread')
        .setLabel('Join Updates Thread')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled()

      const promises = [
        prisma.status.delete({
          where: {
            id: status.id
          }
        }),
        message.edit(embed.build(button.build()) as any)
      ]

      const thread = await message.thread?.fetch()
      if (thread) {
        promises.push(
          thread.send(
            embed
              .setDesc(
                `This issue has been resolved.\nCheck the original message for final updates: ${message.url}`
              )
              .build({
                content: '@everyone',
                allowedMentions: {
                  parse: ['everyone']
                }
              }) as any
          )
        )
      }

      await Promise.all(promises)
      await ctx.send('Status removed.')
    }
  }
})
