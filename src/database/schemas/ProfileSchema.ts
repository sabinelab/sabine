import { prisma } from '@db'
import type { $Enums, Profile } from '@generated'
import type { Pack } from '@/commands/misc/vote'
import { hydrateData } from '@/database/hydrate-data'
import { UserSchema } from '@/database/schemas/UserSchema'
import { updateCache, voidCatch } from '@/database/update-cache'
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

type AddPackOptions = {
  pack: Pack
  voteStreak: number
}

export class ProfileSchema implements Profile {
  public id!: string
  public createdAt: Date = new Date()
  public correctPredictions: number = 0
  public incorrectPredictions: number = 0
  public poisons: bigint = 0n
  public teamName: string | null = null
  public teamTag: string | null = null
  public arenaWins: number = 0
  public rankedWins: number = 0
  public unrankedWins: number = 0
  public swiftplayWins: number = 0
  public rankedSwiftplayWins: number = 0
  public arenaDefeats: number = 0
  public rankedDefeats: number = 0
  public unrankedDefeats: number = 0
  public swiftplayDefeats: number = 0
  public rankedSwiftplayDefeats: number = 0
  public dailyTime: Date | null = null
  public claimTime: Date | null = null
  public warn: boolean = false
  public pity: number = 0
  public claims: number = 0
  public fates: number = 0
  public rankRating: number = 50
  public remind: boolean | null = null
  public remindIn: string | null = null
  public reminded: boolean = true
  public warned: boolean | null = null
  public ironPacks: number = 0
  public bronzePacks: number = 0
  public silverPacks: number = 0
  public goldPacks: number = 0
  public platinumPacks: number = 0
  public diamondPacks: number = 0
  public ascendantPacks: number = 0
  public immortalPacks: number = 0
  public radiantPacks: number = 0
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

  public async daily(poisons: bigint, fates: number) {
    const user = await prisma.profile.update({
      where: {
        userId_guildId: {
          userId: this.userId,
          guildId: this.guildId
        }
      },
      data: {
        poisons: {
          increment: poisons
        },
        fates: {
          increment: fates
        },
        dailyTime: new Date(new Date().setHours(24, 0, 0, 0))
      }
    })

    updateCache(`profile:${this.guildId}:${this.userId}`, user, true).catch(voidCatch)

    return Object.assign(this, user)
  }

  public async addpoisons(amount: bigint) {
    const user = await prisma.profile.update({
      where: {
        userId_guildId: {
          userId: this.userId,
          guildId: this.guildId
        }
      },
      data: {
        poisons: {
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

  public async rmpoisons(amount: bigint) {
    const user = await prisma.profile.update({
      where: {
        userId_guildId: {
          userId: this.userId,
          guildId: this.guildId
        }
      },
      data: {
        poisons: {
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
    playerId: string,
    method:
      | 'CLAIM_PLAYER_BY_CLAIM_COMMAND'
      | 'CLAIM_PLAYER_BY_COMMAND' = 'CLAIM_PLAYER_BY_CLAIM_COMMAND',
    channel?: string
  ) {
    const player = app.players.get(playerId)
    if (!player) return this

    const updates: any = {
      cards: {
        create: {
          acs: player.ACS,
          aim: player.aim,
          hs: player.HS,
          gamesense: player.gamesense,
          movement: player.movement,
          aggression: player.aggression,
          overall: player.ovr,
          playerId: player.id.toString()
        }
      }
    }

    if (method === 'CLAIM_PLAYER_BY_CLAIM_COMMAND') {
      const user = await UserSchema.fetch(this.userId)
      const claimTime = user?.premium
        ? new Date(Date.now() + 5 * 60 * 1000)
        : new Date(Date.now() + 10 * 60 * 1000)

      updates.claimTime = claimTime
      updates.claims = { increment: 1 }
      updates.reminded = false
      updates.pity = { increment: 1 }

      if (channel) {
        updates.remindIn = channel

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

      if (app.players.get(playerId)!.ovr >= 85) {
        updates.pity = 0
      }
    }

    const [_, profile] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          type: method,
          player: Number(playerId),
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
          cards: {
            createMany: {
              data: players.map(p => {
                const player = app.players.get(p)!

                return {
                  playerId: p,
                  aim: player.aim,
                  hs: player.HS,
                  movement: player.movement,
                  acs: player.ACS,
                  gamesense: player.gamesense,
                  aggression: player.aggression,
                  overall: player.ovr
                }
              })
            }
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

  public async sellPlayer(id: number | bigint, price: bigint) {
    await prisma.$transaction(async tx => {
      const card = await tx.card.delete({
        where: { id },
        select: {
          profile: {
            select: {
              id: true
            }
          },
          playerId: true
        }
      })

      await tx.transaction.create({
        data: {
          type: 'SELL_PLAYER',
          player: Number(card.playerId),
          price,
          profileId: card.profile.id
        }
      })

      await tx.profile.update({
        where: {
          userId_guildId: {
            userId: this.userId,
            guildId: this.guildId
          }
        },
        data: {
          poisons: {
            increment: price
          }
        }
      })
    })

    return this
  }

  public async addPack(options: AddPackOptions) {
    const checkStreak = (n: number) => n > 0 && n % 20 === 0

    const packField = {
      IRON: 'ironPacks',
      BRONZE: 'bronzePacks',
      SILVER: 'silverPacks',
      GOLD: 'goldPacks',
      PLATINUM: 'platinumPacks',
      DIAMOND: 'diamondPacks',
      ASCENDANT: 'ascendantPacks',
      IMMORTAL: 'immortalPacks',
      RADIANT: 'radiantPacks'
    } as const
    const fieldToIncrement = packField[options.pack]

    const update: any = {}

    if (checkStreak(options.voteStreak + 1) && fieldToIncrement !== 'radiantPacks') {
      update.radiantPacks = {
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
      }),
      prisma.user.update({
        where: {
          id: this.userId
        },
        data: {
          collectedVoteReward: true
        }
      })
    ])

    return this
  }
}
