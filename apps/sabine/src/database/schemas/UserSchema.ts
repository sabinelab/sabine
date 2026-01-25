import { prisma } from '@db'
import type { $Enums, Premium, User } from '@generated'
import { hydrateData, updateCache, voidCatch } from '@/database'

export class UserSchema implements User {
  public id: string
  public createdAt: Date = new Date()
  public lang: $Enums.Language = 'en'
  public premium: Premium | null = null
  public lastVote: Date | null = null
  public voteStreak: number = 0
  public votes: number = 0
  public collectedVoteReward: boolean = true
  public warn: boolean = false
  public warned: boolean | null = null

  public constructor(id: string) {
    this.id = id
  }

  public static async fetch(id: string) {
    const cachedData = await Bun.redis.get(`user:${id}`)

    if (cachedData) {
      const hydrated = hydrateData<typeof this>(JSON.parse(cachedData))
      const user = new UserSchema(id)

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

    const user = new UserSchema(data.id)

    return Object.assign(user, data)
  }
}
