import { env } from '@/env'
import Service from '../../api'
import { app } from '../../structures/app/App'
import createModalSubmitInteraction from '../../structures/interaction/createModalSubmitInteraction'

const service = new Service(env.AUTH)

export default createModalSubmitInteraction({
  name: 'prediction',
  flags: 64,
  global: true,
  async run({ ctx }) {
    const games = {
      valorant: async () => {
        const pred = await app.prisma.prediction.findFirst({
          where: {
            match: ctx.args[2],
            game: 'valorant',
            profile: {
              userId: ctx.db.profile.userId,
              guildId: ctx.db.guild.id
            }
          }
        })

        if (pred) {
          return await ctx.reply('helper.replied')
        }

        const res = await service.getMatches('valorant')
        const data = res.find(d => d.id === ctx.args[2])!

        const winnerScore = Math.max(Number(ctx.args[3]), Number(ctx.args[4]))

        await ctx.db.profile.addPrediction('valorant', {
          match: data.id!,
          teams: [
            {
              name: data.teams[0].name,
              score: ctx.args[3],
              winner: Number(ctx.args[3]) === winnerScore
            },
            {
              name: data.teams[1].name,
              score: ctx.args[4],
              winner: Number(ctx.args[4]) === winnerScore
            }
          ],
          status: 'pending',
          bet: null,
          odd: null
        })

        await ctx.reply('helper.palpitate_response', {
          t1: data.teams[0].name,
          t2: data.teams[1].name,
          s1: ctx.args[3],
          s2: ctx.args[4]
        })
      },
      lol: async () => {
        const pred = await app.prisma.prediction.findFirst({
          where: {
            match: ctx.args[2],
            game: 'lol',
            profile: {
              userId: ctx.db.profile.userId,
              guildId: ctx.db.guild.id
            }
          }
        })

        if (pred) {
          return await ctx.reply('helper.replied')
        }

        const res = await service.getMatches('lol')
        const data = res.find(d => d.id?.toString() === ctx.args[2])!

        const winnerScore = Math.max(Number(ctx.args[3]), Number(ctx.args[4]))

        await ctx.db.profile.addPrediction('lol', {
          match: data.id!,
          teams: [
            {
              name: data.teams[0].name,
              score: ctx.args[3],
              winner: Number(ctx.args[3]) === winnerScore
            },
            {
              name: data.teams[1].name,
              score: ctx.args[4],
              winner: Number(ctx.args[4]) === winnerScore
            }
          ],
          status: 'pending',
          bet: null,
          odd: null
        })

        await ctx.reply('helper.palpitate_response', {
          t1: data.teams[0].name,
          t2: data.teams[1].name,
          s1: ctx.args[3],
          s2: ctx.args[4]
        })
      }
    }

    await games[ctx.args[1] as 'valorant' | 'lol']()
  }
})
