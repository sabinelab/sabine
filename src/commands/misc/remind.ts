import { prisma } from '@db'
import createCommand from '../../structures/command/createCommand'

export default createCommand({
  name: 'remind',
  nameLocalizations: {
    'pt-BR': 'lembrar'
  },
  description: 'Notify you when you can run /claim again',
  descriptionLocalizations: {
    'pt-BR': 'Notifica você quando você puder usar /claim novamente'
  },
  category: 'misc',
  async run({ ctx }) {
    if (!ctx.db.profile.remind) {
      await prisma.profile.update({
        where: {
          userId_guildId: {
            userId: ctx.db.profile.id,
            guildId: ctx.db.guild.id
          }
        },
        data: {
          remind: true
        }
      })

      return await ctx.reply('commands.remind.enabled')
    }

    await prisma.profile.update({
      where: {
        userId_guildId: {
          userId: ctx.db.profile.id,
          guildId: ctx.db.guild.id
        }
      },
      data: {
        remind: false
      }
    })

    return await ctx.reply('commands.remind.disabled')
  }
})
