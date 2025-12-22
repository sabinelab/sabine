import ButtonBuilder from '../../structures/builders/ButtonBuilder'
import createCommand from '../../structures/command/createCommand'

export default createCommand({
  name: 'activatekey',
  category: 'premium',
  nameLocalizations: {
    'pt-BR': 'ativarchave'
  },
  description: 'Activate your premium key',
  descriptionLocalizations: {
    'pt-BR': 'Ative sua chave premium'
  },
  options: [
    {
      type: 3,
      name: 'key',
      nameLocalizations: {
        'pt-BR': 'chave'
      },
      description: 'Insert your key',
      descriptionLocalizations: {
        'pt-BR': 'Insira sua chave'
      },
      required: true
    }
  ],
  syntax: 'activatekey [key]',
  examples: ['activatekey ABCD-1234-AB12-abcdf'],
  permissions: ['Administrator'],
  ephemeral: true,
  async run({ ctx, t, app }) {
    if (!ctx.guild) return

    const key = await app.prisma.key.findFirst({
      where: {
        id: ctx.args[0].toString()
      },
      include: {
        guildKeys: true
      }
    })

    if (!key) {
      return await ctx.reply('commands.activatekey.invalid_key')
    }

    if (key.guildKeys.some(gk => gk.guildId === ctx.guild!.id)) {
      return await ctx.reply('commands.activatekey.key_already_activated')
    }

    if (key.type === 'PREMIUM' && key.guildKeys.length >= 2) {
      return await ctx.reply('commands.activatekey.limit_reached')
    }

    if (key.type === 'BOOSTER' && key.guildKeys.length > 0) {
      return await ctx.reply('commands.activatekey.limit_reached')
    }

    const guildKey = await app.prisma.guildKey.findUnique({
      where: {
        guildId: ctx.guild.id,
        keyId: key.id
      }
    })

    if (guildKey) {
      const button = new ButtonBuilder()
        .defineStyle('red')
        .setLabel(t('commands.activatekey.button'))
        .setCustomId(`activatekey;${ctx.interaction.user.id};${key.type};${ctx.args[0]}`)

      await ctx.reply(button.build(t('commands.activatekey.would_like_to_continue', { key: key.type })))
    } else {
      await app.prisma.guildKey.create({
        data: {
          guildId: ctx.guild.id,
          keyId: key.id
        }
      })

      await ctx.reply('commands.activatekey.key_activated')
    }
  },
  messageComponentInteractionTime: 60 * 1000,
  async createMessageComponentInteraction({ ctx, app }) {
    if (!ctx.guild) return

    await ctx.interaction.deferReply({ flags: 64 })

    const key = await app.prisma.key.findFirst({
      where: {
        id: ctx.args[3]
      },
      include: {
        guildKeys: true
      }
    })

    if (!key) {
      return await ctx.reply('commands.activatekey.invalid_key')
    }

    if (key.guildKeys.some(gk => gk.guildId === ctx.guild!.id)) {
      return await ctx.reply('commands.activatekey.key_already_activated')
    }

    if (key.type === 'PREMIUM' && key.guildKeys.length >= 2) {
      return await ctx.reply('commands.activatekey.limit_reached')
    }

    if (key.type === 'BOOSTER' && key.guildKeys.length > 0) {
      return await ctx.reply('commands.activatekey.limit_reached')
    }

    await app.prisma.guildKey.create({
      data: {
        guildId: ctx.guild.id,
        keyId: key.id
      }
    })

    return await ctx.reply('commands.activatekey.key_activated')
  }
})
