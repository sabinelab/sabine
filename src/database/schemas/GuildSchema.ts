import { prisma } from '@db'
import type { $Enums, Event, Guild, LiveMessage, TBDMatch } from '@generated'
import { hydrateData } from '@/database/hydrate-data'
import { updateCache, voidCatch } from '@/database/update-cache'

export class GuildSchema implements Guild {
  public id: string
  public lang: $Enums.Language = 'en'
  public tbdMatches: TBDMatch[] = []
  public guildKeyId: string | null = null
  public events: Event[] = []
  public liveMessages: LiveMessage[] = []
  public valorantResendTime: Date | null = null
  public valorantMatches: string[] = []
  public valorantNewsChannel: string | null = null
  public valorantLiveFeedChannel: string | null = null
  public lolResendTime: Date | null = null
  public lolMatches: string[] = []
  public lolNewsChannel: string | null = null
  public lolLiveFeedChannel: string | null = null
  public tournamentsLength: number = 5
  public partner: boolean | null = null
  public invite: string | null = null

  public constructor(id: string) {
    this.id = id
  }

  public static async fetch(id: string) {
    const cachedData = await Bun.redis.get(`guild:${id}`)

    if (cachedData) {
      const hydrated = hydrateData<typeof this>(JSON.parse(cachedData))
      const guild = new GuildSchema(id)

      Object.assign(guild, hydrated)

      return guild
    }

    const data = await prisma.guild.findUnique({ where: { id } })

    if (!data) return data

    updateCache(`guild:${id}`, data).catch(voidCatch)

    const guild = new GuildSchema(data.id)

    return Object.assign(guild, data)
  }
}
