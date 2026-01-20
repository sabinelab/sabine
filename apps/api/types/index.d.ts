export type EventsData = {
  id?: string
  name: string
  status?: string
  image?: string
  url?: string
}
export type MatchTeam = {
  name: string
  country?: string
}
export type MatchTournament = {
  name: string
  full_name?: string
  image?: string | null
}
export type MatchesData = {
  id: string
  teams: MatchTeam[]
  status?: string
  tournament: MatchTournament
  stage: string
  when: Date
  url?: string
}
export type PlayersData = {
  name: string
  teamTag: string
  country: string
  id: string
}
export type PlayerCountry = {
  name: string
  flag?: string
}
export type PlayerPastTeam = {
  id: string
  url: string
  name: string
}
export type PlayerLastResultTeam = {
  name: string
  score?: string
}
export type PlayerLastResult = {
  id: string
  teams: PlayerLastResultTeam[]
  url: string
}
export type PlayerCurrentTeam = {
  name: string
  url: string
}
export type PlayerData = {
  avatar: string
  user: string
  realName: string
  country: PlayerCountry
  team: PlayerCurrentTeam
  pastTeams: PlayerPastTeam[]
  lastResults: PlayerLastResult[]
  id: string
}
export type ResultsTeam = {
  name: string
  score: string
  country?: string
  winner?: boolean
}
export type ResultsData = {
  id: string
  teams: ResultsTeam[]
  status?: string
  tournament: MatchTournament
  stage: string
  when: Date
  url?: string
}
export type TeamsData = {
  id: string
  name: string
  url?: string
  image?: string
  country: string
}
export type Roster = {
  id: string
  user: string
  url: string
}
export type TeamRoster = {
  players: Roster[]
  staffs: Roster[]
}
export type UpcomingMatchTeam = {
  name: string
}
export type UpcomingMatch = {
  teams: UpcomingMatchTeam[]
  url: string
}
export type TeamData = {
  id: string
  name: string
  tag: string
  logo: string
  roster: TeamRoster
  lastResults: PlayerLastResult[]
  upcomingMatches: UpcomingMatch[]
}
export type NewsData = {
  title: string
  description?: string
  url: string
  id: string
}
export type LiveFeedStream = {
  main: boolean
  language: string
  embed_url: string
  official: boolean
  raw_url: string
}
export type LiveFeed = {
  teams: PlayerLastResultTeam[]
  currentMap?: string
  score1?: string
  score2?: string
  id: string | number
  url?: string
  stage?: string
  tournament: MatchTournament
  streams?: LiveFeedStream[]
}
