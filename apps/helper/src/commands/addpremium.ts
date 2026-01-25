import { UserSchema } from '@db'
import { ApplicationCommandOptionType } from 'discord.js'
import createCommand from '@/structures/command/createCommand'

export default createCommand({
  name: 'addpremium',
  description: 'Add premium for a user',
  args: {
    user: {
      type: ApplicationCommandOptionType.User,
      name: 'user',
      description: 'Provide a user',
      required: 'Provide a valid user'
    }
  },
  onlyDev: true,
  async run({ ctx }) {
    const user = (await UserSchema.fetch(ctx.args.user.id)) ?? new UserSchema(ctx.args.user.id)

    await user.addPremium('ADD_PREMIUM_BY_COMMAND')
    await ctx.send(`Premium activated for ${ctx.args.user.toString()}`)
  }
})
