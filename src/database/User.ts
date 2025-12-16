import {
  $Enums,
  type Premium,
  type User
} from '@generated'
import { prisma } from '@db'
import { app } from '../structures/app/App'
import type { Pack } from '../server/routes/util/vote'
import { valorant_agents } from '../config'
import { updateCache, voidCatch } from '@/database/update-cache'
import { hydrateData } from '@/database/hydrate-data'

type PredictionTeam = {
  name: string
  score: string,
  winner: boolean
}

type Prediction = {
  match: string
  teams: PredictionTeam[]
  status: 'pending' | 'correct' | 'wrong'
  bet: bigint | null
  odd: number | null
}

type ArenaLineup = {
  player: string
  agent: {
    name: string
    role: typeof valorant_agents[number]['role']
  }
}

type ArenaMetadata = {
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

  public constructor(id: string) {
    this.id = id
  }

  public async save() {
    const data: Partial<User> = {}

    for(const key in this) {
      if(
        typeof this[key] === 'function' ||
        key === 'id' ||
        this[key] === null ||
        this[key] === 'premium'
      ) continue

      (data as any)[key] = this[key]
    }
    
    // eslint-disable-next-line
    const { premium, ...cleanData } = data as any

    const user = await prisma.user.upsert({
      where: {
        id: this.id
      },
      update: cleanData,
      create: {
        id: this.id,
        ...cleanData
      },
      include: {
        premium: true
      }
    })

    updateCache(`user:${this.id}`, user, true).catch(voidCatch)

    return user
  }

  public static async fetch(id: string) {
    const cachedData = await Bun.redis.get(`user:${id}`)

    if(cachedData) {
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

    if(!data) return data

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
    await prisma.prediction.create({
      data: {
        ...prediction,
        game,
        userId: this.id,
        teams: {
          create: prediction.teams
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

    if(!pred) return this

    this.correct_predictions += 1

    await prisma.prediction.update({
      where: {
        match: predictionId,
        game,
        userId: this.id,
        id: pred.id
      },
      data: {
        status: 'correct'
      }
    })

    await this.save()

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

    if(!pred) return this

    await prisma.$transaction([
      prisma.prediction.update({
        where: {
          match: predictionId,
          game,
          userId: this.id,
          id: pred.id
        },
        data: {
          status: 'wrong'
        }
      }),
      prisma.user.update({
        where: { id: this.id },
        data: {
          incorrect_predictions: { increment: 1 }
        }
      })
    ])

    return this
  }

  public async addPlayerToRoster(player: string, method: 'CLAIM_PLAYER_BY_CLAIM_COMMAND' | 'CLAIM_PLAYER_BY_COMMAND' = 'CLAIM_PLAYER_BY_CLAIM_COMMAND', channel?: string) {
    this.reserve_players.push(player)

    if(method === 'CLAIM_PLAYER_BY_CLAIM_COMMAND') {
      if(this.premium) {
        this.claim_time = new Date(Date.now() + 5 * 60 * 1000)
      }
      else this.claim_time = new Date(Date.now() + 10 * 60 * 1000)

      this.claims += 1
      this.reminded = false
      this.pity += 1
      this.claims += 1

      if(channel) {
        this.remind_in = channel

        if(this.remind) {
          await app.queue.add('reminder', {
            channel: this.remind_in,
            user: this.id
          }, {
            delay: this.claim_time.getTime() - Date.now(),
            removeOnComplete: true,
            removeOnFail: true
          })
        }
      }

      if(app.players.get(player)!.ovr >= 85) {
        this.pity = 0
      }
    }

    await prisma.transaction.create({
      data: {
        type: method,
        player: Number(player),
        userId: this.id
      }
    })

    await this.save()

    return this
  }

  public async addPlayersToRoster(players: string[]) {
    this.reserve_players.push(...players)

    await Promise.all([
      this.save(),
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
    this.reserve_players.splice(i, 1)
    this.coins += price

    await prisma.transaction.create({
      data: {
        type: 'SELL_PLAYER',
        player: Number(id),
        price,
        userId: this.id
      }
    })

    if(
      this.arena_metadata?.lineup
        .some(line => line.player === id)
    ) {
      const index = this.arena_metadata.lineup
        .findIndex(line => line.player === id)

      this.arena_metadata.lineup.splice(index, 1)
    }

    await this.save()

    return this
  }

  public async addPack(pack: Pack, increaseVoteStreak?: boolean) {
    switch(pack) {
      case 'IRON': {
        this.iron_packs += 1
      }
        break
      case 'BRONZE': {
        this.bronze_packs += 1
      }
        break
      case 'SILVER': {
        this.silver_packs += 1
      }
        break
      case 'GOLD': {
        this.gold_packs += 1
      }
        break
      case 'PLATINUM': {
        this.platinum_packs += 1
      }
        break
      case 'DIAMOND': {
        this.diamond_packs += 1
      }
        break
      case 'ASCENDANT': {
        this.ascendant_packs += 1
      }
        break
      case 'IMMORTAL': {
        this.immortal_packs += 1
      }
        break
      case 'RADIANT': {
        this.radiant_packs += 1
      }
    }

    if(increaseVoteStreak) {
      this.vote_streak += 1
      this.last_vote = new Date()
    }

    await prisma.transaction.create({
      data: {
        userId: this.id,
        type: 'CLAIM_PACK_BY_VOTE',
        pack
      }
    })

    await this.save()

    return this
  }
}