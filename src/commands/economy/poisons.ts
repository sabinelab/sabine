import createCommand from '../../structures/command/createCommand'

export default createCommand({
  name: 'poisons',
  nameLocalizations: {
    'pt-BR': 'toxinas'
  },
  description: 'Check your poisons',
  descriptionLocalizations: {
    'pt-BR': 'Veja suas toxinas'
  },
  category: 'economy',
  async run({ ctx, app }) {
    const profiles = await app.prisma.profile.findMany({
      where: {
        guildId: ctx.db.guild.id
      },
      orderBy: {
        poisons: 'desc'
      },
      take: 100,
      select: {
        userId: true
      }
    })
    const p = profiles.findIndex(p => p.userId === ctx.db.profile.userId) + 1

    await ctx.reply('commands.poisons.res', {
      c: ctx.db.profile.poisons.toLocaleString(),
      f: ctx.db.profile.fates.toLocaleString(),
      p
    })
  }
})
