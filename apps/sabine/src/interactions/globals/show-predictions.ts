import { prisma } from '@db'
import type { $Enums } from '@generated'
import createComponentInteraction from '@/structures/interaction/createComponentInteraction'

export default createComponentInteraction({
  name: 'show-predictions',
  ephemeral: true,
  global: true,
  async run({ ctx }) {
    const [correctPredictions, incorrectPredictions] = await Promise.all([
      prisma.prediction.count({
        where: {
          game: ctx.args[1] as $Enums.Game,
          match: ctx.args[2],
          profile: {
            guildId: ctx.guild.id
          },
          status: 'correct'
        }
      }),
      prisma.prediction.count({
        where: {
          game: ctx.args[1] as $Enums.Game,
          match: ctx.args[2],
          profile: {
            guildId: ctx.guild.id
          },
          status: 'incorrect'
        }
      })
    ])

    if (!correctPredictions && !incorrectPredictions) {
      return await ctx.reply('helper.nobody_predicted')
    }

    await ctx.reply('helper.predictions_response', {
      correct_predictions: correctPredictions,
      incorrect_predictions: incorrectPredictions,
      guild: ctx.guild.name
    })
  }
})
