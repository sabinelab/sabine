import { prisma } from '@db'
import { app } from '../../structures/app/App'
import createModalSubmitInteraction from '../../structures/interaction/createModalSubmitInteraction'
import calcOdd from '../../util/calcOdd'

export default createModalSubmitInteraction({
  name: 'betting',
  flags: 64,
  global: true,
  async run({ ctx }) {
    const games = {
      valorant: async () => {
        const preds = await ctx.app.prisma.prediction.findMany({
          where: {
            game: 'valorant',
            match: ctx.args[2]
          },
          include: {
            teams: true
          }
        })

        const value = BigInt(ctx.args[3])

        if (Number.isNaN(Number(value))) return await ctx.reply('helper.invalid_poisons')

        if (value < 500) return await ctx.reply('helper.min_value')

        if (value > ctx.db.profile.poisons) return await ctx.reply('helper.too_much')

        let oddA = 0
        let oddB = 0

        for (const pred of preds) {
          if (pred.teams[0].winner && pred.bet) {
            oddA += 1
          } else if (pred.teams[1].winner && pred.bet) {
            oddB += 1
          }
        }

        let odd: number

        const pred = await app.prisma.prediction.findFirst({
          where: {
            match: ctx.args[2],
            game: 'valorant',
            profile: {
              userId: ctx.db.profile.userId,
              guildId: ctx.db.guild.id
            }
          },
          include: {
            teams: true
          }
        })

        if (!pred) return await ctx.reply('helper.prediction_needed')

        if (pred.teams[0].winner) {
          odd = calcOdd(oddA)
        } else {
          odd = calcOdd(oddB)
        }

        await prisma.$transaction([
          prisma.prediction.update({
            where: {
              id: pred.id
            },
            data: {
              bet: value + (pred.bet ?? 0n)
            }
          }),
          prisma.profile.update({
            where: {
              userId_guildId: {
                userId: ctx.author.id,
                guildId: ctx.db.guild.id
              }
            },
            data: {
              poisons: {
                decrement: value
              }
            }
          })
        ])

        const winnerIndex = pred.teams.findIndex(t => t.winner)

        if (winnerIndex === -1) return await ctx.reply('helper.prediction_needed')

        await ctx.reply('helper.bet_res', {
          team: pred.teams[winnerIndex].name,
          poisons: value.toLocaleString(),
          odd
        })
      },
      lol: async () => {
        const preds = await ctx.app.prisma.prediction.findMany({
          where: {
            game: 'lol',
            match: ctx.args[2]
          },
          include: {
            teams: true
          }
        })

        const value = BigInt(ctx.args[3])

        if (Number.isNaN(Number(value))) return await ctx.reply('helper.invalid_poisons')

        if (value < 500) return await ctx.reply('helper.min_value')

        if (value > ctx.db.profile.poisons) return await ctx.reply('helper.too_much')

        let oddA = 0
        let oddB = 0

        for (const pred of preds) {
          if (pred.teams[0].winner && pred.bet) {
            oddA += 1
          } else if (pred.teams[1].winner && pred.bet) {
            oddB += 1
          }
        }

        let odd: number

        const pred = await app.prisma.prediction.findFirst({
          where: {
            match: ctx.args[2],
            game: 'lol',
            profile: {
              userId: ctx.author.id,
              guildId: ctx.db.guild.id
            }
          },
          include: {
            teams: true
          }
        })

        if (!pred) return await ctx.reply('helper.prediction_needed')

        if (pred.teams[0].winner) {
          odd = calcOdd(oddA)
        } else {
          odd = calcOdd(oddB)
        }

        await prisma.$transaction([
          prisma.prediction.update({
            where: {
              id: pred.id
            },
            data: {
              bet: value + (pred.bet ?? 0n)
            }
          }),
          prisma.profile.update({
            where: {
              userId_guildId: {
                userId: ctx.author.id,
                guildId: ctx.db.guild.id
              }
            },
            data: {
              poisons: {
                decrement: value
              }
            }
          })
        ])

        const winnerIndex = pred.teams.findIndex(t => t.winner)

        if (winnerIndex === -1) return await ctx.reply('helper.prediction_needed')

        await ctx.reply('helper.bet_res', {
          team: pred.teams[winnerIndex].name,
          poisons: value.toLocaleString(),
          odd
        })
      }
    }

    await games[ctx.args[1] as keyof typeof games]()
  }
})
