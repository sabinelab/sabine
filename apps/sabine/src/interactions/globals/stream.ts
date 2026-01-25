import { env } from '@/env'
import Service from '../../api'
import createComponentInteraction from '../../structures/interaction/createComponentInteraction'

const service = new Service(env.AUTH)

export default createComponentInteraction({
  name: 'stream',
  flags: 64,
  global: true,
  async run({ ctx }) {
    const res = await service.getLiveMatches()
    const match = res.find(r => r.id.toString() === ctx.args[2])

    if (!match || !match.streams) return

    let content = ''

    for (const stream of match.streams) {
      content += `- ${stream.raw_url}\n`
    }

    await ctx.reply(content)
  }
})
