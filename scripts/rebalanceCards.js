import { calcPlayerOvr, getPlayer } from '@sabinelab/players'
import { prisma } from '../src/database'
import { getBuff } from '../src/util/getBuff'

/**
 * 
 * @param {string[]} playersIds 
 */
export const rebalanceCards = async (playersIds) => {
  const cards = await prisma.card.findMany({
    where: {
      playerId: {
        in: playersIds
      }
    }
  })

  console.log(`Updating ${cards.length} cards...`)

  const started = Date.now()

  if (!cards.length) return { count: 0 }

  const cache = new Map()

  const updates = cards.map(card => {
    let base = cache.get(card.playerId)

    if (!base) {
      base = getPlayer(card.playerId)
      if (!base) return null
      cache.set(card.playerId, base)
    }

    const buff = 1 + getBuff(card.level)

    const newStats = {
      aim: base.aim * buff,
      hs: base.hs * buff,
      movement: base.movement * buff,
      acs: base.acs * buff,
      gamesense: base.gamesense * buff,
      aggression: base.aggression * buff
    }

    return prisma.card.update({
      where: { id: card.id },
      data: {
        ...newStats,
        overall: calcPlayerOvr({
          ...base,
          aim: newStats.aim,
          hs: newStats.hs,
          movement: newStats.movement,
          acs: newStats.acs,
          gamesense: newStats.gamesense,
          aggression: newStats.aggression
        })
      }
    })
  }).filter(Boolean)

  if (!updates.length) return { count: 0 }

  const bachSize = 200
  for (let i = 0; i < updates.length; i += bachSize) {
    const batch = updates.slice(i, i + bachSize)
    await prisma.$transaction(batch)
  }

  console.log(`Cards updated in ${((Date.now() - started) / 1000).toFixed(1)}s`)

  return { count: cards.length }
}