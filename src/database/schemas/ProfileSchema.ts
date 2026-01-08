import { prisma } from '@db'
import type { $Enums, Profile } from '@generated'
import type { valorant_agents } from '@/config'
import { hydrateData } from '@/database/hydrate-data'
import { UserSchema } from '@/database/schemas/UserSchema'
import { updateCache, voidCatch } from '@/database/update-cache'
import type { Pack } from '@/server/routes/util/vote'
import { app } from '@/structures/app/App'

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

type AddPackOptions = {
  pack: Pack
  lastVote: Date
  voteStreak: number
}

export class ProfileSchema implements Profile {
  public id!: string
  public created_at: Date = new Date()
  public correct_predictions: number = 0
  public incorrect_predictions: number = 0
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
  public guildId: string
  public userId: string
  public lang: $Enums.Language = 'en'

  public constructor(userId: string, guildId: string) {
    this.userId = userId
    this.guildId = guildId
  }

  public static async fetch(userId: string, guildId: string) {
    const cachedData = await Bun.redis.get(`profile:${guildId}:${userId}`)

    if (cachedData) {
      const hydrated = hydrateData<typeof this>(JSON.parse(cachedData))
      const profile = new ProfileSchema(userId, guildId)

      return Object.assign(profile, hydrated)
    }

    const data = await prisma.profile.findUnique({
      where: {
        userId_guildId: {
          userId,
          guildId
        }
      },
      include: {
        user: {
          select: {
            lang: true,
            warn: true
          }
        }
      }
    })

    if (!data) return data

    const { user, ...rest } = data
    const finalData = {
      ...rest,
      lang: user.lang,
      warn: user.warn
    }

    updateCache(`profile:${guildId}:${userId}`, finalData).catch(voidCatch)

    const profile = new ProfileSchema(data.userId, guildId)

    return Object.assign(profile, finalData)
  }

  public async daily(coins: bigint, fates: number) {
    const user = await prisma.profile.update({
      where: {
        userId_guildId: {
          userId: this.userId,
          guildId: this.guildId
        }
      },
      data: {
        coins: {
          increment: coins
        },
        fates: {
          increment: fates
        },
        daily_time: new Date(new Date().setHours(24, 0, 0, 0))
      }
    })

    updateCache(`profile:${this.guildId}:${this.userId}`, user, true).catch(voidCatch)

    return Object.assign(this, user)
  }

  public async addcoins(amount: bigint) {
    const user = await prisma.profile.update({
      where: {
        userId_guildId: {
          userId: this.userId,
          guildId: this.guildId
        }
      },
      data: {
        coins: {
          increment: amount
        }
      }
    })

    updateCache(`profile:${this.guildId}:${this.userId}`, user, true).catch(voidCatch)

    return Object.assign(this, user)
  }

  public async addfates(amount: number) {
    const user = await prisma.profile.update({
      where: {
        userId_guildId: {
          userId: this.userId,
          guildId: this.guildId
        }
      },
      data: {
        fates: {
          increment: amount
        }
      }
    })

    updateCache(`profile:${this.guildId}:${this.userId}`, user, true).catch(voidCatch)

    return Object.assign(this, user)
  }

  public async rmcoins(amount: bigint) {
    const user = await prisma.profile.update({
      where: {
        userId_guildId: {
          userId: this.userId,
          guildId: this.guildId
        }
      },
      data: {
        coins: {
          decrement: amount
        }
      }
    })

    updateCache(`profile:${this.guildId}:${this.userId}`, user, true).catch(voidCatch)

    return Object.assign(this, user)
  }

  public async rmfates(amount: number) {
    const user = await prisma.profile.update({
      where: {
        userId_guildId: {
          userId: this.userId,
          guildId: this.guildId
        }
      },
      data: {
        fates: {
          decrement: amount
        }
      }
    })

    updateCache(`profile:${this.guildId}:${this.userId}`, user, true).catch(voidCatch)

    return Object.assign(this, user)
  }

  public async addPrediction(game: 'valorant' | 'lol', prediction: Prediction) {
    const { teams, ...pred } = prediction
    await prisma.prediction.create({
      data: {
        ...pred,
        game,
        teams: {
          create: teams
        },
        profile: {
          connect: {
            userId_guildId: {
              userId: this.userId,
              guildId: this.guildId
            }
          }
        }
      }
    })

    return this
  }

  public async addPlayerToRoster(
    player: string,
    method:
      | 'CLAIM_PLAYER_BY_CLAIM_COMMAND'
      | 'CLAIM_PLAYER_BY_COMMAND' = 'CLAIM_PLAYER_BY_CLAIM_COMMAND',
    channel?: string
  ) {
    const updates: any = {
      reserve_players: {
        push: player
      }
    }

    if (method === 'CLAIM_PLAYER_BY_CLAIM_COMMAND') {
      const user = await UserSchema.fetch(this.userId)
      const claimTime = user?.premium
        ? new Date(Date.now() + 5 * 60 * 1000)
        : new Date(Date.now() + 10 * 60 * 1000)

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
              user: this.userId,
              guild: this.guildId
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

    const [_, profile] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          type: method,
          player: Number(player),
          profile: {
            connect: {
              userId_guildId: {
                userId: this.userId,
                guildId: this.guildId
              }
            }
          }
        }
      }),
      prisma.profile.update({
        where: {
          userId_guildId: {
            userId: this.userId,
            guildId: this.guildId
          }
        },
        data: updates
      })
    ])

    return Object.assign(this, profile)
  }

  public async addPlayersToRoster(players: string[]) {
    await prisma.$transaction(async tx => {
      const profile = await tx.profile.update({
        where: {
          userId_guildId: {
            userId: this.userId,
            guildId: this.guildId
          }
        },
        data: {
          reserve_players: {
            push: players
          }
        },
        select: {
          id: true
        }
      })

      await tx.transaction.createMany({
        data: players.map(p => ({
          type: 'CLAIM_PLAYER_BY_PACK',
          player: Number(p),
          profileId: profile.id
        }))
      })
    })

    return this
  }

  public async sellPlayer(id: string, price: bigint, i: number) {
    await prisma.$transaction(async tx => {
      const currentData = await tx.profile.findUnique({
        where: {
          userId_guildId: {
            userId: this.userId,
            guildId: this.guildId
          }
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

      const profile = await tx.profile.update({
        where: {
          userId_guildId: {
            userId: this.userId,
            guildId: this.guildId
          }
        },
        data: {
          coins: {
            increment: price
          },
          reserve_players: {
            set: newPlayers
          },
          arena_metadata: newArenaMetadata ? newArenaMetadata : undefined
        },
        select: {
          id: true
        }
      })

      await tx.transaction.create({
        data: {
          type: 'SELL_PLAYER',
          player: Number(id),
          price,
          profileId: profile.id
        }
      })
    })

    return this
  }

  public async addPack(options: AddPackOptions) {
    const checkStreak = (n: number) => n > 0 && n % 20 === 0

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
    const fieldToIncrement = packField[options.pack]

    const update: any = {}

    if (checkStreak(options.voteStreak + 1) && fieldToIncrement !== 'radiant_packs') {
      update.radiant_packs = {
        increment: 1
      }
    } else {
      update[fieldToIncrement] = {
        increment: 1
      }
    }

    await prisma.$transaction([
      prisma.profile.update({
        where: {
          userId_guildId: {
            userId: this.userId,
            guildId: this.guildId
          }
        },
        data: update
      }),
      prisma.transaction.create({
        data: {
          type: 'CLAIM_PACK_BY_VOTE',
          pack: options.pack,
          profile: {
            connect: {
              userId_guildId: {
                userId: this.userId,
                guildId: this.guildId
              }
            }
          }
        }
      })
    ])

    return this
  }
}
