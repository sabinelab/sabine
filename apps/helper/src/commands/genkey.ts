import { Message } from 'discord.js'
import createCommand from '@/structures/command/createCommand'

export default createCommand({
  name: 'genkey',
  aliases: ['gerarchave'],
  description: 'Gen a premium booster key',
  onlyBooster: true,
  async run({ ctx, app }) {
    const key = await app.prisma.key.create({
      data: {
        type: 'PREMIUM',
        user: ctx.author.id,
        activeIn: [],
        active: false
      }
    })

    ctx.author
      .createDM()
      .then(dm =>
        dm.send({
          content: `Your Key Booster is \`${key.id}\`.\nDo not share with ANYONE.`
        })
      )
      .catch(() => ctx.send('Open your DM for this server.'))
      .then(async () => {
        if (ctx.data instanceof Message) {
          await ctx.data.react('1300882212190945292')
        } else {
          await ctx.send('Key generated. Check your DM.')
        }
      })
  }
})
