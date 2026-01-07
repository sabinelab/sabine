import { prisma } from '@db'
import createComponentInteraction from '@/structures/interaction/createComponentInteraction'

export default createComponentInteraction({
  name: 'dontshowagain',
  flags: 64,
  global: true,
  async run({ ctx }) {
    await prisma.user.update({
      where: {
        id: ctx.db.profile.id
      },
      data: {
        warn: false
      }
    })

    await ctx.reply('helper.wont_be_warned')
  }
})
