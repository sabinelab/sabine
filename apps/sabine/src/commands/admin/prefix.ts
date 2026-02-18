import { prisma } from '@db'
import { ApplicationCommandOptionType } from 'discord.js'
import createCommand from '@/structures/command/createCommand'

export default createCommand({
  name: 'prefix',
  description: 'Change the bot prefix for this server',
  descriptionLocalizations: {
    'pt-BR': 'Altera o prefixo do bot para este servidor'
  },
  category: 'admin',
  args: {
    prefix: {
      type: ApplicationCommandOptionType.String,
      name: 'prefix',
      description: 'Provide the prefix',
      descriptionLocalizations: {
        'pt-BR': 'Informe o prefixo'
      },
      required: 'commands.prefix.invalid_prefix'
    }
  },
  permissions: ['ManageGuild'],
  syntax: 'prefix [prefix]',
  examples: ['prefix !', 'prefix s!'],
  async run({ ctx }) {
    await prisma.guild.upsert({
      where: {
        id: ctx.db.guild.id
      },
      update: {
        prefix: ctx.args.prefix
      },
      create: {
        id: ctx.guild.id,
        prefix: ctx.args.prefix
      }
    })

    await ctx.reply('commands.prefix.updated', {
      prefix: ctx.args.prefix
    })
  }
})
