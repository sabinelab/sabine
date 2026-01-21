import { prisma } from '@db'
import { ButtonStyle, ContainerBuilder } from 'discord.js'
import createCommand from '../../structures/command/createCommand'

const price = {
  ascendant: 3500,
  diamond: 1750,
  platinum: 1400,
  gold: 1050
} as const

export default createCommand({
  name: 'shop',
  nameLocalizations: {
    'pt-BR': 'loja'
  },
  category: 'economy',
  description: 'Card pack shop',
  descriptionLocalizations: {
    'pt-BR': 'Loja de pacotes de cartas'
  },
  messageComponentInteractionTime: 5 * 60 * 1000,
  async run({ ctx }) {
    const container = new ContainerBuilder()
      .setAccentColor(6719296)
      .addTextDisplayComponents(text => text.setContent(ctx.t('commands.shop.container.title')))
      .addSectionComponents(section =>
        section
          .addTextDisplayComponents(text =>
            text.setContent(ctx.t('commands.shop.container.text.gold', { price: price.gold }))
          )
          .setButtonAccessory(button =>
            button
              .setStyle(ButtonStyle.Success)
              .setLabel(ctx.t('commands.shop.container.button'))
              .setCustomId(`shop;${ctx.db.profile.userId};gold`)
              .setDisabled(ctx.db.profile.fates < price.gold)
          )
      )
      .addSectionComponents(section =>
        section
          .addTextDisplayComponents(text =>
            text.setContent(
              ctx.t('commands.shop.container.text.platinum', { price: price.platinum })
            )
          )
          .setButtonAccessory(button =>
            button
              .setStyle(ButtonStyle.Success)
              .setLabel(ctx.t('commands.shop.container.button'))
              .setCustomId(`shop;${ctx.db.profile.userId};platinum`)
              .setDisabled(ctx.db.profile.fates < price.platinum)
          )
      )
      .addSectionComponents(section =>
        section
          .addTextDisplayComponents(text =>
            text.setContent(ctx.t('commands.shop.container.text.diamond', { price: price.diamond }))
          )
          .setButtonAccessory(button =>
            button
              .setStyle(ButtonStyle.Success)
              .setLabel(ctx.t('commands.shop.container.button'))
              .setCustomId(`shop;${ctx.db.profile.userId};diamond`)
              .setDisabled(ctx.db.profile.fates < price.diamond)
          )
      )
      .addSectionComponents(section =>
        section
          .addTextDisplayComponents(text =>
            text.setContent(
              ctx.t('commands.shop.container.text.ascendant', { price: price.ascendant })
            )
          )
          .setButtonAccessory(button =>
            button
              .setStyle(ButtonStyle.Success)
              .setLabel(ctx.t('commands.shop.container.button'))
              .setCustomId(`shop;${ctx.db.profile.userId};ascendant`)
              .setDisabled(ctx.db.profile.fates < price.ascendant)
          )
      )

    await ctx.reply({
      flags: 'IsComponentsV2',
      components: [container]
    })
  },
  async createMessageComponentInteraction({ ctx }) {
    const args: { [key: string]: () => Promise<unknown> } = {
      gold: async () => {
        if (ctx.db.profile.fates < price.gold) {
          return await ctx.reply('commands.shop.not_enough')
        }

        await prisma.profile.update({
          where: {
            userId_guildId: {
              userId: ctx.db.profile.userId,
              guildId: ctx.db.guild.id
            }
          },
          data: {
            fates: {
              decrement: price.gold
            },
            goldPacks: {
              increment: 1
            }
          }
        })
        await ctx.reply('commands.shop.success.gold', { fates: price.gold })
      },
      platinum: async () => {
        if (ctx.db.profile.fates < price.platinum) {
          return await ctx.reply('commands.shop.not_enough')
        }

        await prisma.profile.update({
          where: {
            userId_guildId: {
              userId: ctx.db.profile.userId,
              guildId: ctx.db.guild.id
            }
          },
          data: {
            fates: {
              decrement: price.platinum
            },
            platinumPacks: {
              increment: 1
            }
          }
        })
        await ctx.reply('commands.shop.success.platinum', { fates: price.platinum })
      },
      diamond: async () => {
        if (ctx.db.profile.fates < price.diamond) {
          return await ctx.reply('commands.shop.not_enough')
        }

        await prisma.profile.update({
          where: {
            userId_guildId: {
              userId: ctx.db.profile.userId,
              guildId: ctx.db.guild.id
            }
          },
          data: {
            fates: {
              decrement: price.diamond
            },
            diamondPacks: {
              increment: 1
            }
          }
        })
        await ctx.reply('commands.shop.success.diamond', { fates: price.diamond })
      },
      ascendant: async () => {
        if (ctx.db.profile.fates < price.ascendant) {
          return await ctx.reply('commands.shop.not_enough')
        }

        await prisma.profile.update({
          where: {
            userId_guildId: {
              userId: ctx.db.profile.userId,
              guildId: ctx.db.guild.id
            }
          },
          data: {
            fates: {
              decrement: price.ascendant
            },
            ascendantPacks: {
              increment: 1
            }
          }
        })
        await ctx.reply('commands.shop.success.gold', { fates: price.ascendant })
      }
    }

    if (!args[ctx.args[2]]) return

    ctx.setFlags(64)
    await args[ctx.args[2]]()
  }
})
