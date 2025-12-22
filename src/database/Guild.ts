import { prisma } from '@db'
import type { $Enums, Event, Guild, LiveMessage, TBDMatch } from '@generated'
import { hydrateData } from '@/database/hydrate-data'
import { updateCache, voidCatch } from '@/database/update-cache'

export class SabineGuild implements Guild {
  public id: string
  public lang: $Enums.Language = 'en'
  public tbd_matches: TBDMatch[] = []
  public guildKeyId: string | null = null
  public events: Event[] = []
  public live_messages: LiveMessage[] = []
  public valorant_resend_time: Date | null = null
  public valorant_matches: string[] = []
  public valorant_news_channel: string | null = null
  public valorant_live_feed_channel: string | null = null
  public lol_resend_time: Date | null = null
  public lol_matches: string[] = []
  public lol_news_channel: string | null = null
  public lol_live_feed_channel: string | null = null
  public tournaments_length: number = 5
  public partner: boolean | null = null
  public invite: string | null = null

  public constructor(id: string) {
    this.id = id
  }

  public static async fetch(id: string) {
    const cachedData = await Bun.redis.get(`guild:${id}`)

    if (cachedData) {
      const hydrated = hydrateData<typeof this>(JSON.parse(cachedData))
      const guild = new SabineGuild(id)

      Object.assign(guild, hydrated)

      return guild
    }

    const data = await prisma.guild.findUnique({ where: { id } })

    if (!data) return data

    updateCache(`guild:${id}`, data).catch(voidCatch)

    const guild = new SabineGuild(data.id)

    return Object.assign(guild, data)
  }
}
