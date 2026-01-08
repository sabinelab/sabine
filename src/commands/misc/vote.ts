import { UserSchema } from '@db'
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
  async run({ ctx }) {
    const user = (await UserSchema.fetch(ctx.db.profile.userId)) ?? new UserSchema(ctx.db.profile.userId)

    const embed = new EmbedBuilder()
      .setTitle(ctx.t('commands.vote.title'))
      .setDesc(
        ctx.t('commands.vote.description', {
          last_vote: user.last_vote ? `<t:${(user.last_vote?.getTime() / 1000).toFixed(0)}:R>` : '`null`',
          current_streak: user.vote_streak,
          total: user.votes
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
