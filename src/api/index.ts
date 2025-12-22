import LOLEvents from './services/lol/EventsService'
import LiveMatchesService from './services/lol/LiveMatchesService'
import LOLMatches from './services/lol/MatchesService'
import LOLResults from './services/lol/ResultsService'
import ValorantEvents from './services/valorant/EventsService'
import ValorantMatches from './services/valorant/MatchesService'
import ValorantPlayers from './services/valorant/PlayersService'
import ValorantResults from './services/valorant/ResultsService'
import ValorantTeams from './services/valorant/TeamsService'

export default class Service {
  private __auth: string

  public constructor(auth: string) {
    this.__auth = auth
  }

  public async getEvents(game: 'valorant' | 'lol') {
    if (game === 'valorant') {
      return await ValorantEvents.get(this.__auth)
    } else return await LOLEvents.get(this.__auth)
  }

  public async getMatches(game: 'valorant' | 'lol') {
    if (game === 'valorant') {
      return await ValorantMatches.get(this.__auth)
    } else return await LOLMatches.get(this.__auth)
  }

  public async getAllPlayers() {
    return await ValorantPlayers.get(this.__auth)
  }

  public async getPlayerById(id: string | number) {
    return await ValorantPlayers.getById(this.__auth, id)
  }

  public async getAllTeams() {
    return await ValorantTeams.get(this.__auth)
  }

  public async getTeamById(id: string | number) {
    return await ValorantTeams.getById(this.__auth, id)
  }

  public async getResults(game: 'valorant' | 'lol') {
    if (game === 'valorant') {
      return await ValorantResults.get(this.__auth)
    } else return await LOLResults.get(this.__auth)
  }

  public async getLiveMatches() {
    return await LiveMatchesService.get(this.__auth)
  }
}
