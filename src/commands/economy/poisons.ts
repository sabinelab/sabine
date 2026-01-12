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
    const profilesAheadCount = await app.prisma.profile.count({
      where: {
        guildId: ctx.db.guild.id,
        poisons: {
          gt: ctx.db.profile.poisons
        }
      }
    })

    await ctx.reply('commands.poisons.res', {
      c: ctx.db.profile.poisons.toLocaleString(),
      f: ctx.db.profile.fates.toLocaleString(),
      p: profilesAheadCount + 1
    })
  }
})
