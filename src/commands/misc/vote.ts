import ButtonBuilder from '@/structures/builders/ButtonBuilder'
import EmbedBuilder from '@/structures/builders/EmbedBuilder'
import createCommand from '@/structures/command/createCommand'

export default createCommand({
  name: 'vote',
  nameLocalizations: {
    'pt-BR': 'votar'
  },
  description: 'Vote for the bot',
  descriptionLocalizations: {
    'pt-BR': 'Vote no bot'
  },
  category: 'misc',
  userInstall: true,
  async run({ ctx }) {
    const embed = new EmbedBuilder()
      .setTitle(ctx.t('commands.vote.title'))
      .setDesc(
        ctx.t('commands.vote.description', {
          last_vote: ctx.db.user.last_vote ? `<t:${(ctx.db.user.last_vote?.getTime() / 1000).toFixed(0)}:R>` : '`null`',
          current_streak: ctx.db.user.vote_streak,
          total: ctx.db.user.votes
        })
      )
      .setFields({
        name: ctx.t('commands.vote.field'),
        value: ctx.t('commands.vote.value')
      })

    const button = new ButtonBuilder()
      .defineStyle('link')
      .setLabel(ctx.t('commands.vote.vote'))
      .setURL('https://discordbotlist.com/bots/sabine/upvote')

    await ctx.reply(embed.build(button.build()))
  }
})
