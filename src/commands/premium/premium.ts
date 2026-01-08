import { UserSchema } from '@db'
import ButtonBuilder from '../../structures/builders/ButtonBuilder'
import EmbedBuilder from '../../structures/builders/EmbedBuilder'
import createCommand from '../../structures/command/createCommand'

export default createCommand({
  name: 'premium',
  category: 'premium',
  description: "Shows your premium's informations",
  descriptionLocalizations: {
    'pt-BR': 'Mostra as informações do seu premium'
  },
  userInstall: true,
  messageComponentInteractionTime: 5 * 60 * 1000,
  async run({ ctx, t }) {
    const user = await UserSchema.fetch(ctx.db.profile.userId)

    if (!user?.premium || user.premium.type !== 'PREMIUM') {
      return await ctx.reply('commands.premium.you_dont_have_premium')
    }

    const button = new ButtonBuilder()
      .setLabel(t('commands.premium.button.label'))
      .defineStyle('blue')
      .setCustomId(`premium;${ctx.interaction.user.id}`)

    const embed = new EmbedBuilder().setTitle('Premium').setDesc(
      t('commands.premium.embed.description', {
        expiresAt: `<t:${(user.premium.expires_at.getTime() / 1000).toFixed(0)}:R>`
      })
    )

    await ctx.reply(button.build({ embeds: [embed] }))
  },
  async createMessageComponentInteraction({ ctx, t, app }) {
    await ctx.interaction.deferReply({ flags: 64 })

    const keys = await app.prisma.key.findMany({
      where: {
        user: ctx.args[1]
      }
    })

    if (!keys.length) {
      return await ctx.reply('commands.premium.you_dont_have_keys')
    }

    const embed = new EmbedBuilder()

    for (const key of keys) {
      if (key.expires_at) {
        embed.addField(
          key.type,
          t('commands.premium.embed.field.value', {
            expiresAt: `<t:${(key.expires_at.getTime() / 1000).toFixed(0)}:R>`,
            key: key.id
          })
        )
      } else {
        embed.addField(
          key.type,
          t('commands.premium.embed.field.value2', {
            key: key.id
          })
        )
      }
    }

    await ctx.reply(embed.build())
  }
})
