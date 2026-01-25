import * as cheerio from 'cheerio'
import type { MatchesData } from '../../../types/index.d'

export default {
  get: async () => {
    const html = await (
      await fetch('https://www.vlr.gg/matches', {
        cache: 'no-store'
      })
    ).text()

    const $ = cheerio.load(html)

    const matches: MatchesData[] = []

    $('.wf-module-item.match-item').each((_, element) => {
      const id = $(element).attr('href')!.split('/')[1]

      const teams = $(element).find('.match-item-vs-team-name').text().replace(/\t/g, '').trim()
      const [team1, team2] = teams.split('\n').filter(i => i !== '')

      const countryElements = $(element).find('.match-item-vs-team .flag')
      const country1 = countryElements.eq(0).attr('class')?.split(' ')[1].replace('mod-', '')
      const country2 = countryElements.eq(1).attr('class')?.split(' ')[1].replace('mod-', '')

      const status = $(element).find('.ml-status').text()

      const stage = $(element).find('.match-item-event-series').text().trim()

      const date = `${$(element.parent!).prev().text().replace('Today', '').trim()} ${$(element).find('.match-item-time').text().trim()}`
      const when = new Date(date)

      matches.push({
        id,
        teams: [
          {
            name: team1,
            country: country1
          },
          {
            name: team2,
            country: country2
          }
        ],
        status,
        tournament: {
          name: $(element)
            .find('.match-item-event')
            .text()
            .replace(/\t/g, '')
            .replace(stage, '')
            .trim(),
          image: `https:${$(element).find('.match-item-icon img').attr('src')}`
        },
        stage,
        when,
        url: 'https://vlr.gg/' + id
      })
    })

    return matches
  }
}
