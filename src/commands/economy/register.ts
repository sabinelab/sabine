import createCommand from '@/structures/command/createCommand'
import { prisma, SabineUser } from '@db'

export default createCommand({
  name: 'register',
  nameLocalizations: {
    'pt-BR': 'registrar'
  },
  description: 'Register to the bot',
  descriptionLocalizations: {
    'pt-BR': 'Registre-se no bot'
  },
  category: 'economy',
  cooldown: true,
  async run({ ctx }) {
    const user = await SabineUser.fetch(ctx.interaction.user.id)

    if(user) {
      return await ctx.reply('commands.register.already_registered')
    }

    await prisma.user.create({
      data: {
        id: ctx.interaction.user.id
      }
    })

    await ctx.reply('commands.register.success')
  }
})