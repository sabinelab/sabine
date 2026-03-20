import * as cheerio from 'cheerio'
import type { LiveFeed } from '../../../types/index.d'

export default {
  get: async (id: string | number) => {
    const html = await (
      await fetch('https://www.vlr.gg/' + id, {
        cache: 'no-store'
      })
    ).text()

    const $ = cheerio.load(html)

    const team0 = $('.wf-title-med').eq(0).text().replace(/\t/g, '').trim()
    const team1 = $('.wf-title-med').eq(1).text().replace(/\t/g, '').trim()

    const score0 = $('.js-spoiler')
      .find('span')
      .text()
      .replace(':', '')
      .replace(/\s+/g, '')
      .trim()
      .split('')[0]
    const score1 = $('.js-spoiler')
      .find('span')
      .text()
      .replace(':', '')
      .replace(/\s+/g, '')
      .trim()
      .split('')[1]

    const maps = $("div[style*='text-align: center']")
      .contents()
      .filter((_, el) => el.type === 'text')
      .text()
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
    const currentMap =
      maps[
        Number(
          $('.vm-stats-gamesnav-item.js-map-switch.mod-active.mod-live').find('span').text().trim()
        ) - 1
      ]

    const mapScore0 = $('.vm-stats-game.mod-active').find('div').find('.score').eq(0).text().trim()
    const mapScore1 = $('.vm-stats-game.mod-active').find('div').find('.score').eq(1).text().trim()

    const stage = $('.match-header-event-series').text().replace(/\t/g, '').replace(/\n/g, '')

    return {
      teams: [
        {
          name: team0.split('\n')[0],
          score: score0
        },
        {
          name: team1.split('\n')[0],
          score: score1
        }
      ],
      currentMap,
      score1: mapScore0,
      score2: mapScore1,
      id,
      url: 'https://www.vlr.gg/' + id,
      stage,
      tournament: {
        name: $("div[style='font-weight: 700;']").text().trim(),
        image: 'https:' + $('.match-header-event img').attr('src')
      }
    } as LiveFeed
  }
}
