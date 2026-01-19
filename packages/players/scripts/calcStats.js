/**
 * @param {string} stats 
 */
export default function(stats) {
  const attr = stats.split('\n')
  const KPR = Number(attr[attr.findIndex(a => a === 'KPR') + 1])
  const HS = Number(attr[attr.findIndex(a => a === 'Headshot %') + 1].replace('%', '').trim())
  const DPR = Number(attr[attr.findIndex(a => a === 'DPR') + 1])
  const FBPR = Number(attr[attr.findIndex(a => a === 'FBPR') + 1])
  const ACS = Number(attr[attr.findIndex(a => a === 'ACS') + 1])
  const APR = Number(attr[attr.findIndex(a => a === 'APR') + 1])
  const FBSR = Number(attr[attr.findIndex(a => a === 'FBSR') + 1].replace('%', '').trim())

  const aim = (KPR * 40) + (HS * 1.8)
  const hs = HS * 2.6
  const mov = (1.5 - DPR) * 95
  const aggression = (FBPR * 300) + (KPR * 30)
  const acs = ACS / 3
  const gamesense = (APR * 150) + (FBSR * 0.6)

  const attributes = `,${aim.toFixed(2)},${hs.toFixed(2)},${mov.toFixed(2)},${aggression.toFixed(2)},${acs.toFixed(2)},${gamesense.toFixed(2)},true`
  
  return attributes
}