import { UserSchema } from '@db'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import EmbedBuilder from '@/structures/builders/EmbedBuilder'
import createCommand from '@/structures/command/createCommand'

export type Pack =
  | 'IRON' // 59-
  | 'BRONZE' // 60-66
  | 'SILVER' // 67-72
  | 'GOLD' // 73-77
  | 'PLATINUM' // 78-82
  | 'DIAMOND' // 83-86
  | 'ASCENDANT' // 87-90
  | 'IMMORTAL' // 91-94
  | 'RADIANT' // 95+

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
  messageComponentInteractionTime: 60_000,
  async run({ ctx }) {
    const user =
      (await UserSchema.fetch(ctx.db.profile.userId)) ?? new UserSchema(ctx.db.profile.userId)

    const embed = new EmbedBuilder()
      .setTitle(ctx.t('commands.vote.title'))
      .setDesc(
        ctx.t('commands.vote.description', {
          last_vote: user.lastVote
            ? `<t:${(user.lastVote?.getTime() / 1000).toFixed(0)}:R>`
            : '`null`',
          current_streak: user.voteStreak,
          total: user.votes
        })
      )
      .setFields({
        name: ctx.t('commands.vote.field'),
        value: ctx.t('commands.vote.value')
      })

    const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel(ctx.t('commands.vote.vote'))
        .setURL('https://discordbotlist.com/bots/sabine/upvote'),
      new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setLabel(ctx.t('commands.vote.claim_reward'))
        .setCustomId(`vote;${ctx.db.profile.userId};claim`)
        .setDisabled(user.collectedVoteReward)
    )

    await ctx.reply(
      embed.build({
        components: [row]
      })
    )
  },
  async createMessageComponentInteraction({ ctx }) {
    const user = await UserSchema.fetch(ctx.db.profile.userId)

    if (!user || user.collectedVoteReward) {
      return await ctx.reply('commands.vote.already_claimed')
    }

    const random = Math.random() * 100
    const pack: Pack =
      random < 0.5
        ? 'RADIANT'
        : random < 2.0
          ? 'IMMORTAL'
          : random < 5.0
            ? 'ASCENDANT'
            : random < 20.0
              ? 'DIAMOND'
              : random < 50.0
                ? 'PLATINUM'
                : random < 70.0
                  ? 'GOLD'
                  : random < 85.0
                    ? 'SILVER'
                    : random < 95.0
                      ? 'BRONZE'
                      : 'IRON'

    await ctx.db.profile.addPack({
      voteStreak: user.voteStreak,
      pack
    })

    await ctx.reply('commands.vote.claimed', { pack })
  }
})
