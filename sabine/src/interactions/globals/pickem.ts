import createComponentInteraction from '../../structures/interaction/createComponentInteraction'

export default createComponentInteraction({
  name: 'pickem',
  flags: 64,
  global: true,
  async run({ ctx }) {
    await ctx.reply('helper.pickem.res')
  }
})