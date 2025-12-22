import fs from 'node:fs'
import getPlayers from './getPlayers.js'

export default function (data) {
  const players = getPlayers()
  let id = players.length + 1
  const csv = data.map((row) => `${id++},${row.join(',')}`).join('\n')
  
  fs.appendFileSync('data.csv', `\n${csv}`, 'utf-8')
  
  console.log('players added')
}
