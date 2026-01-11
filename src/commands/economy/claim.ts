import { prisma } from '@db'
import { calcPlayerPrice, type Player } from '@sabinelab/players'
import { env } from '@/env'
import { app } from '../../structures/app/App'
import ButtonBuilder from '../../structures/builders/ButtonBuilder'
import EmbedBuilder from '../../structures/builders/EmbedBuilder'
import createCommand from '../../structures/command/createCommand'

const tier = (() => {
  const tier: { [key: string]: Player[] } = {
    s: [] as Player[], // ovr 85+ (0.1%)
    a: [] as Player[], // ovr 80-84 (0.9%)
    b: [] as Player[], // ovr 70-79 (14%)
    c: [] as Player[] // ovr 69- (85%)
  }

  for (const p of app.players.values()) {
    if (!p.ovr) continue
    if (p.ovr >= 85) tier.s.push(p)
    else if (p.ovr >= 80) tier.a.push(p)
    else if (p.ovr >= 70) tier.b.push(p)
    else tier.c.push(p)
  }

  return tier
})()

const getRandomPlayer = () => {
  const random = Math.random() * 100

  const pool = random < 0.1 ? tier.s : random < 1 ? tier.a : random < 15 ? tier.b : tier.c

  return pool[Math.floor(Math.random() * pool.length)]
}

const getRandomPlayerByTier = (t: string) => {
  return tier[t][Math.floor(Math.random() * tier[t].length)]
}

const date = Date.now()

export default createCommand({
  name: 'claim',
  category: 'economy',
  nameLocalizations: {
    'pt-BR': 'obter'
  },
  description: 'Claim a random player',
  descriptionLocalizations: {
    'pt-BR': 'Obtenha um jogador aleatório'
  },
  isThinking: true,
  messageComponentInteractionTime: 60 * 1000,
  cooldown: true,
  async run({ ctx, t }) {
    if (ctx.db.profile.claimTime && ctx.db.profile.claimTime > new Date()) {
      return await ctx.reply('commands.claim.has_been_claimed', {
        t: `<t:${(ctx.db.profile.claimTime.getTime() / 1000).toFixed(0)}:R>`
      })
    }

    let player: Player

    if (ctx.db.profile.pity >= 49) {
      player = getRandomPlayerByTier('s')
    } else player = getRandomPlayer()

    let channel: string | undefined

    if (ctx.interaction.channel && ctx.db.profile.remind) {
      channel = ctx.interaction.channel?.id
    }

    await ctx.db.profile.addPlayerToRoster(
      player.id.toString(),
      'CLAIM_PLAYER_BY_CLAIM_COMMAND',
      channel
    )

    const embed = new EmbedBuilder()
      .setTitle(player.name)
      .setDesc(
        t('commands.claim.claimed', {
          player: player.name,
          price: calcPlayerPrice(player).toLocaleString()
        })
      )
      .setImage(`${env.CDN_URL}/cards/${player.id}.png?ts=${date}`)

    await ctx.reply(
      embed.build({
        components: [
          {
            type: 1,
            components: [
              new ButtonBuilder()
                .defineStyle('green')
                .setLabel(t('commands.claim.promote'))
                .setCustomId(`claim;${ctx.interaction.user.id};promote;${player.id}`),
              new ButtonBuilder()
                .defineStyle('red')
                .setLabel(t('commands.claim.sell'))
                .setCustomId(`claim;${ctx.interaction.user.id};sell;${player.id}`)
            ]
          }
        ]
      })
    )
  },
  async createMessageComponentInteraction({ ctx }) {
    ctx.setFlags(64)

    const card = await prisma.card.findFirst({
      where: {
        playerId: ctx.args[3],
        profileId: ctx.db.profile.id,
        level: {
          lte: 1
        }
      }
    })

    if (!card) {
      return await ctx.reply('commands.sell.player_not_found')
    }

    if (ctx.args[2] === 'promote') {
      await prisma.$transaction(async tx => {
        await tx.$executeRaw`
          UPDATE "Card"
          SET active_roster = false
          WHERE id = (
            SELECT id FROM (
              SELECT
                id,
                COUNT(*) OVER () as total
              FROM "Card"
              WHERE "profile_id" = ${ctx.db.profile.id}
                AND active_roster = true
              ORDER BY id DESC
            ) sub
            WHERE total >= 5
            LIMIT 1
          )
        `

        await tx.card.update({
          where: {
            id: card.id
          },
          data: {
            activeRoster: true
          }
        })
      })

      await ctx.reply('commands.promote.player_promoted', { p: app.players.get(ctx.args[3])?.name })
    } else if (ctx.args[2] === 'sell') {
      const player = app.players.get(ctx.args[3])
      const card = await prisma.card.findFirst({
        where: {
          playerId: ctx.args[3],
          profileId: ctx.db.profile.id,
          activeRoster: false
        }
      })

      if (!player || !card) {
        return await ctx.reply('commands.sell.player_not_found')
      }

      const price = BigInt(calcPlayerPrice(player, true))

      await ctx.db.profile.sellPlayer(card.id, price)
      await ctx.reply('commands.sell.sold', { p: player.name, price: price.toLocaleString() })
    }
  }
})
