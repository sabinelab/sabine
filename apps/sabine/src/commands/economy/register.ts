import { ProfileSchema, prisma } from '@db'
import createCommand from '@/structures/command/createCommand'

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
  syntax: 'register',
  examples: ['register'],
  cooldown: true,
  async run({ ctx }) {
    const profile = await ProfileSchema.fetch(ctx.db.profile.userId, ctx.db.guild.id)

    if (profile) {
      return await ctx.reply('commands.register.already_registered')
    }

    await prisma.user.upsert({
      where: {
        id: ctx.db.profile.userId
      },
      update: {
        profiles: {
          create: {
            guild: {
              connectOrCreate: {
                where: {
                  id: ctx.db.guild.id
                },
                create: {
                  id: ctx.db.guild.id
                }
              }
            }
          }
        }
      },
      create: {
        profiles: {
          create: {
            guild: {
              connectOrCreate: {
                where: {
                  id: ctx.db.guild.id
                },
                create: {
                  id: ctx.db.guild.id
                }
              }
            }
          }
        },
        id: ctx.db.profile.userId
      }
    })

    await ctx.reply('commands.register.success')
  }
})
