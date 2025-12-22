import createCommand from '../../structures/command/createCommand'

export default createCommand({
  name: 'coins',
  description: 'Check your coins',
  descriptionLocalizations: {
    'pt-BR': 'Veja seus coins'
  },
  category: 'economy',
  userInstall: true,
  async run({ ctx, app }) {
    const value = await app.redis.get('leaderboard:coins')

    const users = JSON.parse(value!)

    const p =
      users.data.sort((a: any, b: any) => Number(b.coins - a.coins)).findIndex((p: any) => p.id === ctx.db.user.id) + 1

    await ctx.reply('commands.coins.res', {
      c: ctx.db.user.coins.toLocaleString(),
      f: ctx.db.user.fates.toLocaleString(),
      p
    })
  }
})
