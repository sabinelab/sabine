import { prisma } from '@db'
import { calcPlayerPrice, type Player } from '@sabinelab/players'
import { env } from '@/env'
import { app } from '../../structures/app/App'
import ButtonBuilder from '../../structures/builders/ButtonBuilder'
import EmbedBuilder from '../../structures/builders/EmbedBuilder'
import createCommand from '../../structures/command/createCommand'

type Tier =
  | 'iron'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'ascendant'
  | 'immortal'
  | 'radiant'

const tier = (() => {
  const tier: Record<Tier, Player[]> = {
    radiant: [], // 0.5%
    immortal: [], // 1.5%
    ascendant: [], // 3.0%
    diamond: [], // 15.0%
    platinum: [], // 30.0%
    gold: [], // 20.0%
    silver: [], // 15.0%
    bronze: [], // 10.0%
    iron: [] // 5.0%
  }

  for (const p of app.players.values()) {
    if (!p.ovr) continue

    if (p.ovr >= 101) tier.radiant.push(p)
    else if (p.ovr >= 95) tier.immortal.push(p)
    else if (p.ovr >= 89) tier.ascendant.push(p)
    else if (p.ovr >= 83) tier.diamond.push(p)
    else if (p.ovr >= 77) tier.platinum.push(p)
    else if (p.ovr >= 71) tier.gold.push(p)
    else if (p.ovr >= 65) tier.silver.push(p)
    else if (p.ovr >= 59) tier.bronze.push(p)
    else tier.iron.push(p)
  }

  return tier
})()

const getRandomPlayer = () => {
  const random = Math.random() * 100

  const pool =
    random < 0.5
      ? tier.radiant
      : random < 2.0
        ? tier.immortal
        : random < 5.0
          ? tier.ascendant
          : random < 20.0
            ? tier.diamond
            : random < 50.0
              ? tier.platinum
              : random < 70.0
                ? tier.gold
                : random < 85.0
                  ? tier.silver
                  : random < 95.0
                    ? tier.bronze
                    : tier.iron

  return pool[Math.floor(Math.random() * pool.length)]
}

const getRandomPlayerByTier = (t: Tier) => {
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

    if (ctx.db.profile.pity >= 74) {
      player = getRandomPlayerByTier('radiant')
    } else {
      player = getRandomPlayer()
    }

    let channel: string | undefined

    if (ctx.data.channel && ctx.db.profile.remind) {
      channel = ctx.data.channel.id
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
                .setCustomId(`claim;${ctx.author.id};promote;${player.id}`),
              new ButtonBuilder()
                .defineStyle('red')
                .setLabel(t('commands.claim.sell'))
                .setCustomId(`claim;${ctx.author.id};sell;${player.id}`)
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
