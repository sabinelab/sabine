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
    if(!ctx.db.user.remind) {
      await prisma.user.update({
        where: {
          id: ctx.db.user.id
        },
        data: {
          remind: true
        }
      })
      await Bun.redis.del(`user:${ctx.db.user.id}`)

      return await ctx.reply('commands.remind.enabled')
    }

    await prisma.user.update({
      where: {
        id: ctx.db.user.id
      },
      data: {
        remind: false
      }
    })
    await Bun.redis.del(`user:${ctx.db.user.id}`)
    
    return await ctx.reply('commands.remind.disabled')
  }
})