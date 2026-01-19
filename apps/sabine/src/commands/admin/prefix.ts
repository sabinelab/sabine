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
  async run({ ctx }) {
    await prisma.guild.update({
      where: {
        id: ctx.db.guild.id
      },
      data: {
        prefix: ctx.args.prefix
      }
    })

    await ctx.reply('commands.prefix.updated', {
      prefix: ctx.args.prefix
    })
  }
})
