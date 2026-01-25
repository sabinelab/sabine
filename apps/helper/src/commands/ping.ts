import createCommand from '@/structures/command/createCommand'

export default createCommand({
  name: 'ping',
  description: 'Pong!',
  async run({ ctx }) {
    await ctx.send(`Pong! \`${ctx.app.ws.ping}ms\``)
  }
})
