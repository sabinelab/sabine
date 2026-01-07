import { UserSchema } from '@db'
import createCommand from '../../structures/command/createCommand'

export default createCommand({
  name: 'daily',
  description: 'Get your daily reward',
  descriptionLocalizations: {
    'pt-BR': 'Obtenha sua recompensa diária'
  },
  category: 'economy',
  userInstall: true,
  async run({ ctx, app, t }) {
    if (ctx.db.profile.daily_time && ctx.db.profile.daily_time.getTime() > Date.now()) {
      return await ctx.reply('commands.daily.has_been_claimed', {
        t: `<t:${(ctx.db.profile.daily_time.getTime() / 1000).toFixed(0)}:R>`
      })
    }

    let coins = BigInt(Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000)

    let fates = Math.floor(Math.random() * (30 - 20 + 1)) + 20

    const member = app.guilds.cache.get('1233965003850125433')?.members.cache.get(ctx.interaction.user.id)

    let content =
      t('commands.daily.res', {
        coins: coins.toLocaleString(),
        fates
      }) + '\n'

    const bonus: string[] = []

    const user = await UserSchema.fetch(ctx.db.profile.id)

    if (user?.premium) {
      coins *= 5n
      fates = Math.round(fates * 1.5)

      bonus.push(
        t('commands.daily.bonus', {
          coins: '5x',
          fates: '1.5x'
        })
      )
    }
    if (member?.premiumSince) {
      coins *= 2n
      fates = Math.round(fates * 1.25)

      bonus.push(
        t('commands.daily.bonus2', {
          coins: '2x',
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
      coins = BigInt(Math.round(Number(coins) * 1.5))

      bonus.push(
        t('commands.daily.bonus3', {
          coins: '1.5x'
        })
      )
    }

    if (key && key.key.type === 'BOOSTER') {
      coins = BigInt(Math.round(Number(coins) * 1.25))

      bonus.push(
        t('commands.daily.bonus4', {
          coins: '1.25x'
        })
      )
    }
    if (bonus.length) {
      content =
        t('commands.daily.res', {
          coins: coins.toLocaleString(),
          fates
        }) +
        '\n' +
        bonus.join('\n')
    }

    await ctx.db.profile.daily(coins, fates)
    await ctx.reply(content)
  }
})
