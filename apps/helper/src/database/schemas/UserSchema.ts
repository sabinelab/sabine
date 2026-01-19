import type { $Enums, Premium, User } from '@generated'
import type { TextChannel } from 'discord.js'
import { hydrateData, prisma, updateCache, voidCatch } from '@/database'
import { env } from '@/env'
import { app } from '@/structures/app/App'
import EmbedBuilder from '@/structures/builders/EmbedBuilder'

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

  public async addPremium(by: 'ADD_PREMIUM_BY_COMMAND' | 'BUY_PREMIUM') {
    const expiresAt = new Date(Date.now() + 2592000000)

    const premium = await prisma.premium.findFirst({
      where: {
        type: 'PREMIUM',
        userId: this.id
      }
    })

    const [key] = await prisma.$transaction([
      prisma.key.create({
        data: {
          type: 'PREMIUM',
          user: this.id,
          expiresAt,
          activeIn: [],
          active: false
        }
      }),
      prisma.premium.upsert({
        create: {
          type: 'PREMIUM',
          expiresAt,
          userId: this.id
        },
        update: {
          expiresAt: !premium?.expiresAt
            ? expiresAt
            : new Date(premium.expiresAt.getTime() + 2592000000)
        },
        where: {
          userId: this.id
        }
      }),
      prisma.user.update({
        where: {
          id: this.id
        },
        data: {
          warned: false
        }
      })
    ])

    const channel = app.channels.cache.get(env.USERS_LOG) as TextChannel

    const user = app.users.cache.get(this.id)

    const embed = new EmbedBuilder()
      .setTitle('New register')
      .setDesc(`User: ${user?.toString()} (${this.id})`)
      .setFields({
        name: by,
        value: 'PREMIUM'
      })

    const webhooks = await channel.fetchWebhooks()
    let webhook = webhooks.find(w => w.name === app.user?.username + ' Logger')

    if (!webhook) webhook = await channel.createWebhook({ name: app.user?.username + ' Logger' })

    await webhook.send({
      avatarURL: app.user?.displayAvatarURL({ size: 2048 }),
      embeds: [embed]
    })

    return key
  }
}
