import createCommand from '../../structures/command/createCommand'

export default createCommand({
  name: 'claims',
  category: 'economy',
  description: 'See your claims counter',
  descriptionLocalizations: {
    'pt-BR': 'Veja o seu contador de obter'
  },
  userInstall: true,
  async run({ ctx }) {
    await ctx.reply('commands.claims.res', {
      claims: ctx.db.profile.claims,
      pity: ctx.db.profile.pity
    })
  }
})
