import { ButtonStyle, ContainerBuilder, TextDisplayBuilder } from 'discord.js'
import createCommand from '../../structures/command/createCommand'
import ButtonBuilder from '../../structures/builders/ButtonBuilder'
import type { Player } from '@sabinelab/players'
import { app } from '../../structures/app/App'
import { prisma } from '@db'

const tier = (() => {
  const tier = {
    iron: [] as Player[],
    bronze: [] as Player[],
    silver: [] as Player[],
    gold: [] as Player[],
    platinum: [] as Player[],
    diamond: [] as Player[],
    ascendant: [] as Player[],
    immortal: [] as Player[],
    radiant: [] as Player[]
  } as const

  for(const p of app.players.values()) {
    if(p.ovr >= 95) tier.radiant.push(p)
    else if(p.ovr >= 91) tier.immortal.push(p)
    else if(p.ovr >= 87) tier.ascendant.push(p)
    else if(p.ovr >= 83) tier.diamond.push(p)
    else if(p.ovr >= 78) tier.platinum.push(p)
    else if(p.ovr >= 73) tier.gold.push(p)
    else if(p.ovr >= 67) tier.silver.push(p)
    else if(p.ovr >= 60) tier.bronze.push(p)
    else tier.iron.push(p)
  }

  return tier
})()

type Tier = keyof typeof tier

const getRandomPlayers = (key: Tier) => {
  const players = tier[key]

  const count = 3

  if(players.length <= count) {
    return [...players]
  }

  const shuffled = [...players]

  let currentLength = shuffled.length
  let i: number

  while(currentLength > 0) {
    i = Math.floor(Math.random() * currentLength)
    currentLength--

    ;[shuffled[currentLength], shuffled[i]] = [
      shuffled[i], shuffled[currentLength]
    ]
  }

  return shuffled.slice(0, count)
}

export default createCommand({
  name: 'packs',
  nameLocalizations: {
    'pt-BR': 'pacotes'
  },
  description: 'Open or view packs',
  descriptionLocalizations: {
    'pt-BR': 'Abra ou veja pacotes'
  },
  category: 'economy',
  userInstall: true,
  async run({ ctx }) {
    const container = new ContainerBuilder()
      .setAccentColor(6719296)
      .addTextDisplayComponents(
        text => text.setContent(ctx.t('commands.packs.container.title'))
      )
      .addSectionComponents(section =>
        section
          .addTextDisplayComponents(
            text => text.setContent(ctx.t('commands.packs.type.iron', {
              count: ctx.db.user.iron_packs
            }))
          )
          .setButtonAccessory(
            button => button
              .setCustomId(`packs;${ctx.interaction.user.id};iron`)
              .setLabel(ctx.t('commands.packs.container.button'))
              .setStyle(ButtonStyle.Primary)
              .setDisabled(!ctx.db.user.iron_packs)
          )
      )
      .addSectionComponents(section =>
        section
          .addTextDisplayComponents(
            text => text.setContent(ctx.t('commands.packs.type.bronze', {
              count: ctx.db.user.bronze_packs
            }))
          )
          .setButtonAccessory(
            button => button
              .setCustomId(`packs;${ctx.interaction.user.id};bronze`)
              .setLabel(ctx.t('commands.packs.container.button'))
              .setStyle(ButtonStyle.Primary)
              .setDisabled(!ctx.db.user.bronze_packs)
          )
      )
      .addSectionComponents(section =>
        section
          .addTextDisplayComponents(
            text => text.setContent(ctx.t('commands.packs.type.silver', {
              count: ctx.db.user.silver_packs
            }))
          )
          .setButtonAccessory(
            button => button
              .setCustomId(`packs;${ctx.interaction.user.id};silver`)
              .setLabel(ctx.t('commands.packs.container.button'))
              .setStyle(ButtonStyle.Primary)
              .setDisabled(!ctx.db.user.silver_packs)
          )
      )
      .addSectionComponents(section =>
        section
          .addTextDisplayComponents(
            text => text.setContent(ctx.t('commands.packs.type.gold', {
              count: ctx.db.user.gold_packs
            }))
          )
          .setButtonAccessory(
            button => button
              .setCustomId(`packs;${ctx.interaction.user.id};gold`)
              .setLabel(ctx.t('commands.packs.container.button'))
              .setStyle(ButtonStyle.Primary)
              .setDisabled(!ctx.db.user.gold_packs)
          )
      )
      .addSectionComponents(section =>
        section
          .addTextDisplayComponents(
            text => text.setContent(ctx.t('commands.packs.type.platinum', {
              count: ctx.db.user.platinum_packs
            }))
          )
          .setButtonAccessory(
            button => button
              .setCustomId(`packs;${ctx.interaction.user.id};platinum`)
              .setLabel(ctx.t('commands.packs.container.button'))
              .setStyle(ButtonStyle.Primary)
              .setDisabled(!ctx.db.user.platinum_packs)
          )
      )
      .addSectionComponents(section =>
        section
          .addTextDisplayComponents(
            text => text.setContent(ctx.t('commands.packs.type.diamond', {
              count: ctx.db.user.diamond_packs
            }))
          )
          .setButtonAccessory(
            button => button
              .setCustomId(`packs;${ctx.interaction.user.id};diamond`)
              .setLabel(ctx.t('commands.packs.container.button'))
              .setStyle(ButtonStyle.Primary)
              .setDisabled(!ctx.db.user.diamond_packs)
          )
      )
      .addSectionComponents(section =>
        section
          .addTextDisplayComponents(
            text => text.setContent(ctx.t('commands.packs.type.ascendant', {
              count: ctx.db.user.ascendant_packs
            }))
          )
          .setButtonAccessory(
            button => button
              .setCustomId(`packs;${ctx.interaction.user.id};ascendant`)
              .setLabel(ctx.t('commands.packs.container.button'))
              .setStyle(ButtonStyle.Primary)
              .setDisabled(!ctx.db.user.ascendant_packs)
          )
      )
      .addSectionComponents(section =>
        section
          .addTextDisplayComponents(
            text => text.setContent(ctx.t('commands.packs.type.immortal', {
              count: ctx.db.user.immortal_packs
            }))
          )
          .setButtonAccessory(
            button => button
              .setCustomId(`packs;${ctx.interaction.user.id};immortal`)
              .setLabel(ctx.t('commands.packs.container.button'))
              .setStyle(ButtonStyle.Primary)
              .setDisabled(!ctx.db.user.immortal_packs)
          )
      )
      .addSectionComponents(section =>
        section
          .addTextDisplayComponents(
            text => text.setContent(ctx.t('commands.packs.type.radiant', {
              count: ctx.db.user.radiant_packs
            }))
          )
          .setButtonAccessory(
            button => button
              .setCustomId(`packs;${ctx.interaction.user.id};radiant`)
              .setLabel(ctx.t('commands.packs.container.button'))
              .setStyle(ButtonStyle.Primary)
              .setDisabled(!ctx.db.user.radiant_packs)
          )
      )

    await ctx.reply({
      flags: 'IsComponentsV2',
      components: [container]
    })
  },
  async createMessageComponentInteraction({ ctx, t }) {
    if(ctx.args[2] === 'back') {
      const container = new ContainerBuilder()
        .setAccentColor(6719296)
        .addTextDisplayComponents(
          text => text.setContent(t('commands.packs.container.title'))
        )
        .addSectionComponents(section =>
          section
            .addTextDisplayComponents(
              text => text.setContent(t('commands.packs.type.iron', {
                count: ctx.db.user.iron_packs
              }))
            )
            .setButtonAccessory(
              button => button
                .setCustomId(`packs;${ctx.interaction.user.id};iron`)
                .setLabel(t('commands.packs.container.button'))
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!ctx.db.user.iron_packs)
            )
        )
        .addSectionComponents(section =>
          section
            .addTextDisplayComponents(
              text => text.setContent(t('commands.packs.type.bronze', {
                count: ctx.db.user.bronze_packs
              }))
            )
            .setButtonAccessory(
              button => button
                .setCustomId(`packs;${ctx.interaction.user.id};bronze`)
                .setLabel(t('commands.packs.container.button'))
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!ctx.db.user.bronze_packs)
            )
        )
        .addSectionComponents(section =>
          section
            .addTextDisplayComponents(
              text => text.setContent(t('commands.packs.type.silver', {
                count: ctx.db.user.silver_packs
              }))
            )
            .setButtonAccessory(
              button => button
                .setCustomId(`packs;${ctx.interaction.user.id};silver`)
                .setLabel(t('commands.packs.container.button'))
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!ctx.db.user.silver_packs)
            )
        )
        .addSectionComponents(section =>
          section
            .addTextDisplayComponents(
              text => text.setContent(t('commands.packs.type.gold', {
                count: ctx.db.user.gold_packs
              }))
            )
            .setButtonAccessory(
              button => button
                .setCustomId(`packs;${ctx.interaction.user.id};gold`)
                .setLabel(t('commands.packs.container.button'))
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!ctx.db.user.gold_packs)
            )
        )
        .addSectionComponents(section =>
          section
            .addTextDisplayComponents(
              text => text.setContent(t('commands.packs.type.platinum', {
                count: ctx.db.user.platinum_packs
              }))
            )
            .setButtonAccessory(
              button => button
                .setCustomId(`packs;${ctx.interaction.user.id};platinum`)
                .setLabel(t('commands.packs.container.button'))
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!ctx.db.user.platinum_packs)
            )
        )
        .addSectionComponents(section =>
          section
            .addTextDisplayComponents(
              text => text.setContent(t('commands.packs.type.diamond', {
                count: ctx.db.user.diamond_packs
              }))
            )
            .setButtonAccessory(
              button => button
                .setCustomId(`packs;${ctx.interaction.user.id};diamond`)
                .setLabel(t('commands.packs.container.button'))
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!ctx.db.user.diamond_packs)
            )
        )
        .addSectionComponents(section =>
          section
            .addTextDisplayComponents(
              text => text.setContent(t('commands.packs.type.ascendant', {
                count: ctx.db.user.ascendant_packs
              }))
            )
            .setButtonAccessory(
              button => button
                .setCustomId(`packs;${ctx.interaction.user.id};ascendant`)
                .setLabel(t('commands.packs.container.button'))
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!ctx.db.user.ascendant_packs)
            )
        )
        .addSectionComponents(section =>
          section
            .addTextDisplayComponents(
              text => text.setContent(t('commands.packs.type.immortal', {
                count: ctx.db.user.immortal_packs
              }))
            )
            .setButtonAccessory(
              button => button
                .setCustomId(`packs;${ctx.interaction.user.id};immortal`)
                .setLabel(t('commands.packs.container.button'))
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!ctx.db.user.immortal_packs)
            )
        )
        .addSectionComponents(section =>
          section
            .addTextDisplayComponents(
              text => text.setContent(t('commands.packs.type.radiant', {
                count: ctx.db.user.radiant_packs
              }))
            )
            .setButtonAccessory(
              button => button
                .setCustomId(`packs;${ctx.interaction.user.id};radiant`)
                .setLabel(t('commands.packs.container.button'))
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!ctx.db.user.radiant_packs)
            )
        )

      await ctx.edit({
        flags: 'IsComponentsV2',
        components: [container]
      })
    }
    else {
      const packs: { [key: string]: () => Promise<unknown> } = {
        iron: async() => {
          if(ctx.db.user.iron_packs <= 0) return await ctx.reply('commands.packs.you_dont_have_this_pack')

          const players = getRandomPlayers('iron')

          await prisma.user.update({
            where: {
              id: ctx.db.user.id
            },
            data: {
              iron_packs: {
                decrement: 1
              }
            }
          })
          await ctx.db.user.addPlayersToRoster(players.map(p => p.id.toString()))

          const button = new ButtonBuilder()
            .defineStyle('blue')
            .setLabel(t('commands.packs.back'))
            .setCustomId(`packs;${ctx.interaction.user.id};back`)

          const textDisplay = new TextDisplayBuilder()
            .setContent(t('commands.packs.pack_opened', {
              pack: ctx.args[2].toUpperCase(),
              players: players.map(p => `\`${p.name} (${Math.floor(p.ovr)})\``).join(', ')
            }))

          await ctx.edit({
            components: [
              textDisplay,
              {
                type: 1,
                components: [button.toJSON()]
              }
            ]
          })
        },
        bronze: async() => {
          if(ctx.db.user.bronze_packs <= 0) return await ctx.reply('commands.packs.you_dont_have_this_pack')

          const players = getRandomPlayers('bronze')

          await prisma.user.update({
            where: {
              id: ctx.db.user.id
            },
            data: {
              bronze_packs: {
                decrement: 1
              }
            }
          })
          await ctx.db.user.addPlayersToRoster(players.map(p => p.id.toString()))

          const button = new ButtonBuilder()
            .defineStyle('blue')
            .setLabel(t('commands.packs.back'))
            .setCustomId(`packs;${ctx.interaction.user.id};back`)

          const textDisplay = new TextDisplayBuilder()
            .setContent(t('commands.packs.pack_opened', {
              pack: ctx.args[2].toUpperCase(),
              players: players.map(p => `\`${p.name} (${Math.floor(p.ovr)})\``).join(', ')
            }))

          await ctx.edit({
            components: [
              textDisplay,
              {
                type: 1,
                components: [button.toJSON()]
              }
            ]
          })
        },
        silver: async() => {
          if(ctx.db.user.silver_packs <= 0) return await ctx.reply('commands.packs.you_dont_have_this_pack')

          const players = getRandomPlayers('silver')

          await prisma.user.update({
            where: {
              id: ctx.db.user.id
            },
            data: {
              silver_packs: {
                decrement: 1
              }
            }
          })
          await ctx.db.user.addPlayersToRoster(players.map(p => p.id.toString()))

          const button = new ButtonBuilder()
            .defineStyle('blue')
            .setLabel(t('commands.packs.back'))
            .setCustomId(`packs;${ctx.interaction.user.id};back`)

          const textDisplay = new TextDisplayBuilder()
            .setContent(t('commands.packs.pack_opened', {
              pack: ctx.args[2].toUpperCase(),
              players: players.map(p => `\`${p.name} (${Math.floor(p.ovr)})\``).join(', ')
            }))

          await ctx.edit({
            components: [
              textDisplay,
              {
                type: 1,
                components: [button.toJSON()]
              }
            ]
          })
        },
        gold: async() => {
          if(ctx.db.user.gold_packs <= 0) return await ctx.reply('commands.packs.you_dont_have_this_pack')

          const players = getRandomPlayers('gold')

          await prisma.user.update({
            where: {
              id: ctx.db.user.id
            },
            data: {
              gold_packs: {
                decrement: 1
              }
            }
          })
          await ctx.db.user.addPlayersToRoster(players.map(p => p.id.toString()))

          const button = new ButtonBuilder()
            .defineStyle('blue')
            .setLabel(t('commands.packs.back'))
            .setCustomId(`packs;${ctx.interaction.user.id};back`)

          const textDisplay = new TextDisplayBuilder()
            .setContent(t('commands.packs.pack_opened', {
              pack: ctx.args[2].toUpperCase(),
              players: players.map(p => `\`${p.name} (${Math.floor(p.ovr)})\``).join(', ')
            }))

          await ctx.edit({
            components: [
              textDisplay,
              {
                type: 1,
                components: [button.toJSON()]
              }
            ]
          })
        },
        platinum: async() => {
          if(ctx.db.user.platinum_packs <= 0) return await ctx.reply('commands.packs.you_dont_have_this_pack')

          const players = getRandomPlayers('platinum')

          await prisma.user.update({
            where: {
              id: ctx.db.user.id
            },
            data: {
              platinum_packs: {
                decrement: 1
              }
            }
          })
          await ctx.db.user.addPlayersToRoster(players.map(p => p.id.toString()))

          const button = new ButtonBuilder()
            .defineStyle('blue')
            .setLabel(t('commands.packs.back'))
            .setCustomId(`packs;${ctx.interaction.user.id};back`)

          const textDisplay = new TextDisplayBuilder()
            .setContent(t('commands.packs.pack_opened', {
              pack: ctx.args[2].toUpperCase(),
              players: players.map(p => `\`${p.name} (${Math.floor(p.ovr)})\``).join(', ')
            }))

          await ctx.edit({
            components: [
              textDisplay,
              {
                type: 1,
                components: [button.toJSON()]
              }
            ]
          })
        },
        diamond: async() => {
          if(ctx.db.user.diamond_packs <= 0) return await ctx.reply('commands.packs.you_dont_have_this_pack')

          const players = getRandomPlayers('diamond')

          await prisma.user.update({
            where: {
              id: ctx.db.user.id
            },
            data: {
              diamond_packs: {
                decrement: 1
              }
            }
          })
          await ctx.db.user.addPlayersToRoster(players.map(p => p.id.toString()))

          const button = new ButtonBuilder()
            .defineStyle('blue')
            .setLabel(t('commands.packs.back'))
            .setCustomId(`packs;${ctx.interaction.user.id};back`)

          const textDisplay = new TextDisplayBuilder()
            .setContent(t('commands.packs.pack_opened', {
              pack: ctx.args[2].toUpperCase(),
              players: players.map(p => `\`${p.name} (${Math.floor(p.ovr)})\``).join(', ')
            }))

          await ctx.edit({
            components: [
              textDisplay,
              {
                type: 1,
                components: [button.toJSON()]
              }
            ]
          })
        },
        ascendant: async() => {
          if(ctx.db.user.ascendant_packs <= 0) return await ctx.reply('commands.packs.you_dont_have_this_pack')

          const players = getRandomPlayers('ascendant')

          await prisma.user.update({
            where: {
              id: ctx.db.user.id
            },
            data: {
              ascendant_packs: {
                decrement: 1
              }
            }
          })
          await ctx.db.user.addPlayersToRoster(players.map(p => p.id.toString()))

          const button = new ButtonBuilder()
            .defineStyle('blue')
            .setLabel(t('commands.packs.back'))
            .setCustomId(`packs;${ctx.interaction.user.id};back`)

          const textDisplay = new TextDisplayBuilder()
            .setContent(t('commands.packs.pack_opened', {
              pack: ctx.args[2].toUpperCase(),
              players: players.map(p => `\`${p.name} (${Math.floor(p.ovr)})\``).join(', ')
            }))

          await ctx.edit({
            components: [
              textDisplay,
              {
                type: 1,
                components: [button.toJSON()]
              }
            ]
          })
        },
        immortal: async() => {
          if(ctx.db.user.immortal_packs <= 0) return await ctx.reply('commands.packs.you_dont_have_this_pack')

          const players = getRandomPlayers('immortal')

          await prisma.user.update({
            where: {
              id: ctx.db.user.id
            },
            data: {
              immortal_packs: {
                decrement: 1
              }
            }
          })
          await ctx.db.user.addPlayersToRoster(players.map(p => p.id.toString()))

          const button = new ButtonBuilder()
            .defineStyle('blue')
            .setLabel(t('commands.packs.back'))
            .setCustomId(`packs;${ctx.interaction.user.id};back`)

          const textDisplay = new TextDisplayBuilder()
            .setContent(t('commands.packs.pack_opened', {
              pack: ctx.args[2].toUpperCase(),
              players: players.map(p => `\`${p.name} (${Math.floor(p.ovr)})\``).join(', ')
            }))

          await ctx.edit({
            components: [
              textDisplay,
              {
                type: 1,
                components: [button.toJSON()]
              }
            ]
          })
        },
        radiant: async() => {
          if(ctx.db.user.radiant_packs <= 0) return await ctx.reply('commands.packs.you_dont_have_this_pack')

          const players = getRandomPlayers('radiant')

          await prisma.user.update({
            where: {
              id: ctx.db.user.id
            },
            data: {
              radiant_packs: {
                decrement: 1
              }
            }
          })
          await ctx.db.user.addPlayersToRoster(players.map(p => p.id.toString()))

          const button = new ButtonBuilder()
            .defineStyle('blue')
            .setLabel(t('commands.packs.back'))
            .setCustomId(`packs;${ctx.interaction.user.id};back`)

          const textDisplay = new TextDisplayBuilder()
            .setContent(t('commands.packs.pack_opened', {
              pack: ctx.args[2].toUpperCase(),
              players: players.map(p => `\`${p.name} (${Math.floor(p.ovr)})\``).join(', ')
            }))

          await ctx.edit({
            components: [
              textDisplay,
              {
                type: 1,
                components: [button.toJSON()]
              }
            ]
          })
        }
      }

      await packs[ctx.args[2]]()
    }
  }
})