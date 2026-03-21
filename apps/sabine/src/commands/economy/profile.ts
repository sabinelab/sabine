import { prisma } from '@db'
import EmbedBuilder from '@/structures/builders/EmbedBuilder'
import createCommand from '@/structures/command/createCommand'

export default createCommand({
  name: 'profile',
  aliases: ['perfil', 'p'],
  nameLocalizations: {
    'pt-BR': 'perfil'
  },
  description: 'View your profile',
  descriptionLocalizations: {
    'pt-BR': 'Veja seu perfil'
  },
  category: 'economy',
  async run({ ctx }) {
    const ranked_wins = ctx.db.profile.rankedWins
    const unranked_defeats = ctx.db.profile.unrankedDefeats
    const unranked_wins = ctx.db.profile.unrankedWins
    const ranked_swiftplay_wins = ctx.db.profile.rankedSwiftplayWins
    const swiftplay_wins = ctx.db.profile.swiftplayWins
    const ranked_defeats = ctx.db.profile.rankedDefeats
    const ranked_swiftplay_defeats = ctx.db.profile.rankedSwiftplayDefeats
    const swiftplay_defeats = ctx.db.profile.swiftplayDefeats
    const arena_wins = ctx.db.profile.arenaWins
    const arena_defeats = ctx.db.profile.arenaDefeats
    const total_wins =
      ranked_wins + unranked_wins + swiftplay_wins + ranked_swiftplay_wins + arena_wins
    const total_defeats =
      ranked_defeats +
      unranked_defeats +
      swiftplay_defeats +
      ranked_swiftplay_defeats +
      arena_defeats
    const lastMatch = await prisma.match.findFirst({
      where: {
        profileId: ctx.db.profile.id
      },
      orderBy: {
        when: 'desc'
      },
      select: {
        teams: true
      }
    })

    const embed = new EmbedBuilder()
      .setTitle(ctx.t('commands.profile.title'))
      .setDesc(
        ctx.t('commands.profile.description', {
          claims: ctx.db.profile.claims,
          points: ctx.db.profile.rankRating,
          total_wins,
          total_defeats
        })
      )
      .setThumb(ctx.author.displayAvatarURL({ size: 2048 }))
      .setFields(
        {
          name: ctx.t('commands.profile.arena.title'),
          value: ctx.t('commands.profile.arena.description', {
            arena_defeats,
            arena_wins
          }),
          inline: true
        },
        {
          name: ctx.t('commands.profile.ranked.title'),
          value: ctx.t('commands.profile.ranked.description', {
            ranked_defeats,
            ranked_wins
          }),
          inline: true
        },
        {
          name: ctx.t('commands.profile.ranked_swiftplay.title'),
          value: ctx.t('commands.profile.ranked_swiftplay.description', {
            ranked_swiftplay_defeats,
            ranked_swiftplay_wins
          }),
          inline: true
        },
        {
          name: ctx.t('commands.profile.unranked.title'),
          value: ctx.t('commands.profile.unranked.description', {
            unranked_defeats,
            unranked_wins
          }),
          inline: true
        },
        {
          name: ctx.t('commands.profile.swiftplay.title'),
          value: ctx.t('commands.profile.swiftplay.description', {
            swiftplay_defeats,
            swiftplay_wins
          }),
          inline: true
        }
      )

    if (lastMatch) {
      embed.addField(
        ctx.t('commands.profile.last_battle'),
        `**<@${lastMatch.teams[0].user}> ${lastMatch.teams[0].score} <:versus:1349105624180330516> ${lastMatch.teams[1].score} <@${lastMatch.teams[1].user}>**`,
        true
      )
    }

    await ctx.reply(embed.build())
  }
})
