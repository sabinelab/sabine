import Service from '../../api'
import createComponentInteraction from '../../structures/interaction/createComponentInteraction'
import { env } from '@/env'

const service = new Service(env.AUTH)

export default createComponentInteraction({
  name: 'predict',
  flags: 64,
  global: true,
  async run({ ctx, t, app }) {
    const games = {
      valorant: async() => {
        const pred = await app.prisma.prediction.findFirst({
          where: {
            match: ctx.args[2],
            userId: ctx.db.user.id,
            game: 'valorant'
          }
        })

        if(pred) {
          return await ctx.reply('helper.replied')
        }

        const res = await service.getMatches('valorant')
        const data = res.find(d => d.id === ctx.args[2])

        if(!data || data.status === 'LIVE') {
          return await ctx.reply('helper.started')
        }

        await ctx.interaction.showModal({
          customId: `prediction;valorant;${ctx.args[2]}`,
          title: t('helper.prediction_modal.title'),
          components: [
            {
              type: 1,
              components: [
                {
                  type: 4,
                  customId: 'response-modal-1',
                  label: data.teams[0].name,
                  style: 1,
                  minLength: 1,
                  maxLength: 2,
                  required: true,
                  placeholder: '0'
                },
              ]
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  customId: 'response-modal-2',
                  label: data.teams[1].name,
                  style: 1,
                  minLength: 1,
                  maxLength: 2,
                  required: true,
                  placeholder: '0'
                }
              ]
            }
          ]
        })
      },
      lol: async() => {
        const pred = await app.prisma.prediction.findFirst({
          where: {
            match: ctx.args[2],
            userId: ctx.db.user.id,
            game: 'valorant'
          }
        })

        if(pred) {
          return await ctx.reply('helper.replied')
        }

        const res = await service.getMatches('lol')
        const data = res.find(d => d.id === ctx.args[2])

        if(!data || data.status === 'LIVE') {
          return await ctx.reply('helper.started')
        }

        await ctx.interaction.showModal({
          customId: `prediction;lol;${ctx.args[2]}`,
          title: t('helper.prediction_modal.title'),
          components: [
            {
              type: 1,
              components: [
                {
                  type: 4,
                  customId: 'response-modal-1',
                  label: data.teams[0].name,
                  style: 1,
                  minLength: 1,
                  maxLength: 2,
                  required: true,
                  placeholder: '0'
                },
              ]
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  customId: 'response-modal-2',
                  label: data.teams[1].name,
                  style: 1,
                  minLength: 1,
                  maxLength: 2,
                  required: true,
                  placeholder: '0'
                }
              ]
            }
          ]
        })
      }
    }

    await games[ctx.args[1] as keyof typeof games]()
  }
})