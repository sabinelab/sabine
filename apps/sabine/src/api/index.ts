import { lolEvents } from './services/lol/events-service'
import { lolLiveMatches } from './services/lol/live-matches-service'
import { lolMatches } from './services/lol/matches-service'
import { lolResults } from './services/lol/results-service'
import { valorantEvents } from './services/valorant/events-service'
import { valorantMatches } from './services/valorant/matches-service'
import { valorantPlayers } from './services/valorant/players-service'
import { valorantResults } from './services/valorant/results-service'

export default class Service {
  public async getEvents(game: 'valorant' | 'lol') {
    if (game === 'valorant') {
      return await valorantEvents.get()
    } else return await lolEvents.get()
  }

  public async getMatches(game: 'valorant' | 'lol') {
    if (game === 'valorant') {
      return await valorantMatches.get()
    } else return await lolMatches.get()
  }

  public async getAllPlayers() {
    return await valorantPlayers.get()
  }

  public async getPlayerById(id: string | number) {
    return await valorantPlayers.getById(id)
  }

  public async getResults(game: 'valorant' | 'lol') {
    if (game === 'valorant') {
      return await valorantResults.get()
    } else return await lolResults.get()
  }

  public async getLiveMatches() {
    return await lolLiveMatches.get()
  }
}