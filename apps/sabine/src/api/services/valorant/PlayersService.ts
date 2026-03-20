import type { PlayerData, PlayersData } from '@types'
import { env } from '@/env'

export default class PlayersService {
  public static async get(auth: string) {
    const data = await (
      await fetch(env.API_URL + '/players/valorant', {
        headers: {
          authorization: auth
        }
      })
    ).json()

    return data as PlayersData[]
  }
  public static async getById(auth: string, id: string | number) {
    const data = await (
      await fetch(env.API_URL + '/players/valorant?id=' + id, {
        headers: {
          authorization: auth
        }
      })
    ).json()

    return data as PlayerData
  }
}
