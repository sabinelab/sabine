import { prisma } from '@db'
import type { $Enums, Premium, User } from '@generated'
import { hydrateData } from '@/database/hydrate-data'
import { updateCache, voidCatch } from '@/database/update-cache'
import type { valorant_agents } from '../config'
import type { Pack } from '../server/routes/util/vote'
import { app } from '../structures/app/App'

type PredictionTeam = {
  name: string
  score: string
  winner: boolean
}

type Prediction = {
  match: string
  teams: PredictionTeam[]
  status: 'pending' | 'correct' | 'incorrect'
  bet: bigint | null
  odd: number | null
}

type ArenaLineup = {
  player: string
  agent: {
    name: string
    role: (typeof valorant_agents)[number]['role']
  }
}

export type ArenaMetadata = {
  map: string
  lineup: ArenaLineup[]
}

export class SabineUser implements User {
  public id: string
  public created_at: Date = new Date()
  public correct_predictions: number = 0
  public incorrect_predictions: number = 0
  public lang: $Enums.Language = 'en'
  public premium: Premium | null = null
  public active_players: string[] = []
  public reserve_players: string[] = []
  public coins: bigint = 0n
  public team_name: string | null = null
  public team_tag: string | null = null
  public arena_wins: number = 0
  public ranked_wins: number = 0
  public unranked_wins: number = 0
  public swiftplay_wins: number = 0
  public ranked_swiftplay_wins: number = 0
  public arena_defeats: number = 0
  public ranked_defeats: number = 0
  public unranked_defeats: number = 0
  public swiftplay_defeats: number = 0
  public ranked_swiftplay_defeats: number = 0
  public arena_metadata: ArenaMetadata | null = null
  public daily_time: Date | null = null
  public claim_time: Date | null = null
  public warn: boolean = false
  public pity: number = 0
  public claims: number = 0
  public fates: number = 0
  public rank_rating: number = 50
  public remind: boolean | null = null
  public remind_in: string | null = null
  public reminded: boolean = true
  public warned: boolean | null = null
  public iron_packs: number = 0
  public bronze_packs: number = 0
  public silver_packs: number = 0
  public gold_packs: number = 0
  public platinum_packs: number = 0
  public diamond_packs: number = 0
  public ascendant_packs: number = 0
  public immortal_packs: number = 0
  public radiant_packs: number = 0
  public last_vote: Date | null = null
  public vote_streak: number = 0
  public votes: number = 0

  public constructor(id: string) {
    this.id = id
  }

  public static async fetch(id: string) {
    const cachedData = await Bun.redis.get(`user:${id}`)

    if (cachedData) {
      const hydrated = hydrateData<typeof this>(JSON.parse(cachedData))
      const user = new SabineUser(id)

      return Object.assign(user, hydrated)
    }

    const data = await prisma.user.findUnique({
      where: { id },
      include: {
        premium: true
      }
    })

    if (!data) return data

    updateCache(`user:${id}`, data).catch(voidCatch)

    const user = new SabineUser(data.id)

    return Object.assign(user, data)
  }

  public async daily(coins: bigint, fates: number) {
    const user = await prisma.user.update({
      where: {
        id: this.id
      },
      data: {
        coins: {
          increment: coins
        },
        fates: {
          increment: fates
        },
        daily_time: new Date(new Date().setHours(24, 0, 0, 0))
      },
      include: {
        premium: true
      }
    })

    updateCache(`user:${this.id}`, user, true).catch(voidCatch)

    return Object.assign(this, user)
  }

  public async addcoins(amount: bigint) {
    const user = await prisma.user.update({
      where: {
        id: this.id
      },
      data: {
        coins: {
          increment: amount
        }
      },
      include: {
        premium: true
      }
    })

    updateCache(`user:${this.id}`, user, true).catch(voidCatch)

    return Object.assign(this, user)
  }

  public async addfates(amount: number) {
    const user = await prisma.user.update({
      where: {
        id: this.id
      },
      data: {
        fates: {
          increment: amount
        }
      },
      include: {
        premium: true
      }
    })

    updateCache(`user:${this.id}`, user, true).catch(voidCatch)

    return Object.assign(this, user)
  }

  public async rmcoins(amount: bigint) {
    const user = await prisma.user.update({
      where: {
        id: this.id
      },
      data: {
        coins: {
          decrement: amount
        }
      },
      include: {
        premium: true
      }
    })

    updateCache(`user:${this.id}`, user, true).catch(voidCatch)

    return Object.assign(this, user)
  }

  public async rmfates(amount: number) {
    const user = await prisma.user.update({
      where: {
        id: this.id
      },
      data: {
        fates: {
          decrement: amount
        }
      },
      include: {
        premium: true
      }
    })

    updateCache(`user:${this.id}`, user, true).catch(voidCatch)

    return Object.assign(this, user)
  }

  public async addPrediction(game: 'valorant' | 'lol', prediction: Prediction) {
    const { teams, ...pred } = prediction
    await prisma.prediction.create({
      data: {
        ...pred,
        game,
        userId: this.id,
        teams: {
          create: teams
        }
      }
    })

    return this
  }

  public async addCorrectPrediction(game: 'valorant' | 'lol', predictionId: string) {
    const pred = await prisma.prediction.findFirst({
      where: {
        match: predictionId,
        game,
        userId: this.id
      }
    })

    if (!pred) return this

    await prisma.$transaction([
      prisma.prediction.update({
        where: {
          id: pred.id,
          game,
          userId: this.id,
          match: predictionId
        },
        data: {
          status: 'correct'
        }
      }),
      prisma.user.update({
        where: {
          id: this.id
        },
        data: {
          correct_predictions: {
            increment: 1
          }
        }
      })
    ])

    return this
  }

  public async addIncorrectPrediction(game: 'valorant' | 'lol', predictionId: string) {
    const pred = await prisma.prediction.findFirst({
      where: {
        match: predictionId,
        game,
        userId: this.id
      }
    })

    if (!pred) return this

    await prisma.$transaction([
      prisma.prediction.update({
        where: {
          match: predictionId,
          game,
          userId: this.id,
          id: pred.id
        },
        data: {
          status: 'incorrect'
        }
      }),
      prisma.user.update({
        where: { id: this.id },
        data: {
          incorrect_predictions: {
            increment: 1
          }
        }
      })
    ])

    return this
  }

  public async addPlayerToRoster(
    player: string,
    method: 'CLAIM_PLAYER_BY_CLAIM_COMMAND' | 'CLAIM_PLAYER_BY_COMMAND' = 'CLAIM_PLAYER_BY_CLAIM_COMMAND',
    channel?: string
  ) {
    const updates: any = {
      reserve_players: {
        push: player
      }
    }

    if (method === 'CLAIM_PLAYER_BY_CLAIM_COMMAND') {
      const claimTime = this.premium ? new Date(Date.now() + 5 * 60 * 1000) : new Date(Date.now() + 10 * 60 * 1000)

      updates.claim_time = claimTime
      updates.claims = { increment: 1 }
      updates.reminded = false
      updates.pity = { increment: 1 }

      if (channel) {
        updates.remind_in = channel

        if (this.remind) {
          await app.queue.add(
            'reminder',
            {
              channel,
              user: this.id
            },
            {
              delay: claimTime.getTime() - Date.now(),
              removeOnComplete: true,
              removeOnFail: true
            }
          )
        }
      }

      if (app.players.get(player)!.ovr >= 85) {
        updates.pity = 0
      }
    }

    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          type: method,
          player: Number(player),
          userId: this.id
        }
      }),
      prisma.user.update({
        where: {
          id: this.id
        },
        data: updates
      })
    ])

    return this
  }

  public async addPlayersToRoster(players: string[]) {
    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: this.id
        },
        data: {
          reserve_players: {
            push: players
          }
        }
      }),
      prisma.transaction.createMany({
        data: players.map(p => ({
          type: 'CLAIM_PLAYER_BY_PACK',
          player: Number(p),
          userId: this.id
        }))
      })
    ])

    return this
  }

  public async sellPlayer(id: string, price: bigint, i: number) {
    await prisma.$transaction(async tx => {
      const currentData = await tx.user.findUnique({
        where: {
          id: this.id
        },
        select: {
          reserve_players: true,
          arena_metadata: true
        }
      })

      if (!currentData) return

      const currentPlayers = currentData.reserve_players

      if (!currentPlayers[i] || currentPlayers[i] !== id) {
        const index = currentPlayers.indexOf(id)
        if (index === -1) return

        i = index
      }

      const newPlayers = [...currentPlayers]
      newPlayers.splice(i, 1)

      const newArenaMetadata = currentData.arena_metadata
        ? JSON.parse(JSON.stringify(currentData.arena_metadata))
        : null

      if (newArenaMetadata?.lineup) {
        const index = newArenaMetadata.lineup.findIndex((line: any) => line.player === id)
        if (index !== -1) {
          newArenaMetadata.lineup.splice(index, 1)
        }
      }

      await tx.user.update({
        where: {
          id: this.id
        },
        data: {
          coins: {
            increment: price
          },
          reserve_players: {
            set: newPlayers
          },
          arena_metadata: newArenaMetadata ? newArenaMetadata : undefined
        }
      })

      await tx.transaction.create({
        data: {
          type: 'SELL_PLAYER',
          player: Number(id),
          price,
          userId: this.id
        }
      })
    })

    return this
  }

  public async addPack(pack: Pack, increaseVoteStreak?: boolean) {
    const checkStreak = (n: number) => {
      return n > 0 && n % 20 === 0
    }
    const checkDate = (date1: Date, date2: Date | null) => {
      if (!date2) return false
      return Math.abs(date1.getTime() - date2.getTime()) <= 24 * 60 * 60 * 1000
    }

    const packField = {
      IRON: 'iron_packs',
      BRONZE: 'bronze_packs',
      SILVER: 'silver_packs',
      GOLD: 'gold_packs',
      PLATINUM: 'platinum_packs',
      DIAMOND: 'diamond_packs',
      ASCENDANT: 'ascendant_packs',
      IMMORTAL: 'immortal_packs',
      RADIANT: 'radiant_packs'
    } as const
    const fieldToIncrement = packField[pack]

    const update: any = {}

    if (checkStreak(this.vote_streak + 1) && fieldToIncrement !== 'radiant_packs') {
      update.radiant_packs = {
        increment: 1
      }
    } else {
      update[fieldToIncrement] = {
        increment: 1
      }
    }

    if (increaseVoteStreak) {
      if (!checkDate(new Date(), this.last_vote) && this.vote_streak) {
        update.vote_streak = 1
      } else {
        update.vote_streak = {
          increment: 1
        }
      }

      update.votes = {
        increment: 1
      }
      update.last_vote = new Date()
    }

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: this.id
        },
        data: update
      }),
      prisma.transaction.create({
        data: {
          userId: this.id,
          type: 'CLAIM_PACK_BY_VOTE',
          pack
        }
      })
    ])

    return this
  }
}
