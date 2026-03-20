import createComponentInteraction from '@/structures/interaction/createComponentInteraction'

export default createComponentInteraction({
  name: 'join-thread',
  ephemeral: true,
  async run({ ctx }) {
    const thread = await ctx.interaction.message.thread?.fetch()

    if (!thread) return
    if (thread.archived || thread.locked) return

    await thread.members.add(ctx.author)
    await ctx.reply(`Done. Check ${thread.toString()}`)
  }
})
