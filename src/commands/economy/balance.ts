import createCommand from '../../structures/command/createCommand'

export default createCommand({
  name: 'balance',
  nameLocalizations: {
    'pt-BR': 'saldo'
  },
  description: 'Check your balance',
  descriptionLocalizations: {
    'pt-BR': 'Veja seu saldo'
  },
  category: 'economy',
  async run({ ctx, app }) {
    const profilesAheadCount = await app.prisma.profile.count({
      where: {
        guildId: ctx.db.guild.id,
        OR: [
          {
            poisons: {
              gt: ctx.db.profile.poisons
            }
          },
          {
            poisons: ctx.db.profile.poisons,
            userId: {
              lt: ctx.db.profile.userId
            }
          }
        ]
      }
    })

    await ctx.reply('commands.balance.res', {
      c: ctx.db.profile.poisons.toLocaleString(),
      f: ctx.db.profile.fates.toLocaleString(),
      p: profilesAheadCount + 1,
      cmd: `</leaderboard poisons:${app.commands.get('leaderboard')?.id}>`,
      cmd2: `</daily:${app.commands.get('daily')?.id}>`
    })
  }
})
