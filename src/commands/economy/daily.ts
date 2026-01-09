import { UserSchema } from '@db'
import createCommand from '../../structures/command/createCommand'

export default createCommand({
  name: 'daily',
  nameLocalizations: {
    'pt-BR': 'diário'
  },
  description: 'Get your daily reward',
  descriptionLocalizations: {
    'pt-BR': 'Obtenha sua recompensa diária'
  },
  category: 'economy',
  async run({ ctx, app, t }) {
    if (ctx.db.profile.daily_time && ctx.db.profile.daily_time.getTime() > Date.now()) {
      return await ctx.reply('commands.daily.has_been_claimed', {
        t: `<t:${(ctx.db.profile.daily_time.getTime() / 1000).toFixed(0)}:R>`
      })
    }

    let poisons = BigInt(Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000)

    let fates = Math.floor(Math.random() * (210 - 140 + 1)) + 140

    const member = app.guilds.cache
      .get('1233965003850125433')
      ?.members.cache.get(ctx.interaction.user.id)

    let content =
      t('commands.daily.res', {
        poisons: poisons.toLocaleString(),
        fates
      }) + '\n'

    const bonus: string[] = []

    const user = await UserSchema.fetch(ctx.db.profile.userId)

    if (user?.premium) {
      poisons *= 5n
      fates = Math.round(fates * 1.5)

      bonus.push(
        t('commands.daily.bonus', {
          poisons: '5x',
          fates: '1.5x'
        })
      )
    }
    if (member?.premiumSince) {
      poisons *= 2n
      fates = Math.round(fates * 1.25)

      bonus.push(
        t('commands.daily.bonus2', {
          poisons: '2x',
          fates: '1.25x'
        })
      )
    }
    const key = await app.prisma.guildKey.findUnique({
      where: {
        guildId: ctx.db.guild?.id
      },
      include: {
        key: true
      }
    })

    if (key && key.key.type === 'PREMIUM') {
      poisons = BigInt(Math.round(Number(poisons) * 1.5))

      bonus.push(
        t('commands.daily.bonus3', {
          poisons: '1.5x'
        })
      )
    }

    if (key && key.key.type === 'BOOSTER') {
      poisons = BigInt(Math.round(Number(poisons) * 1.25))

      bonus.push(
        t('commands.daily.bonus4', {
          poisons: '1.25x'
        })
      )
    }
    if (bonus.length) {
      content =
        t('commands.daily.res', {
          poisons: poisons.toLocaleString(),
          fates
        }) +
        '\n' +
        bonus.join('\n')
    }

    await ctx.db.profile.daily(poisons, fates)
    await ctx.reply(content)
  }
})
