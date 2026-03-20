import type { valorantAgents } from './agents'

export const valorantMaps: {
  name: string
  meta_agents: (typeof valorantAgents)[number]['name'][]
  image: string
  current_map_pool?: boolean
  sides: ('A' | 'B' | 'C')[]
}[] = [
  {
    name: 'Ascent',
    meta_agents: [
      'Jett',
      'Killjoy',
      'Sova',
      'KAY/O',
      'Omen',
      'Vyse',
      'Yoru',
      'Waylay',
      'Cypher',
      'Chamber'
    ],
    image: 'https://imgur.com/HUdWHux.png',
    sides: ['A', 'B']
  },
  {
    name: 'Bind',
    meta_agents: [
      'Raze',
      'Brimstone',
      'Viper',
      'Skye',
      'Fade',
      'Gekko',
      'Neon',
      'Yoru',
      'Cypher',
      'Omen',
      'KAY/O',
      'Veto'
    ],
    current_map_pool: true,
    image: 'https://imgur.com/vSP4vQB.png',
    sides: ['A', 'B']
  },
  {
    name: 'Breeze',
    meta_agents: ['Viper', 'Jett', 'Cypher', 'KAY/O', 'Sova', 'Harbor'],
    image: 'https://imgur.com/p5Bxsca.png',
    sides: ['A', 'B'],
    current_map_pool: true
  },
  {
    name: 'Fracture',
    meta_agents: [
      'Brimstone',
      'Raze',
      'Neon',
      'Vyse',
      'Killjoy',
      'Cypher',
      'Fade',
      'Breach',
      'Skye',
      'Astra',
      'Neon'
    ],
    image: 'https://imgur.com/Fsas50g.png',
    sides: ['A', 'B']
  },
  {
    name: 'Haven',
    meta_agents: [
      'Cypher',
      'Omen',
      'Breach',
      'Killjoy',
      'Vyse',
      'Skye',
      'Sova',
      'Gekko',
      'Jett',
      'Yoru',
      'Iso',
      'Neon',
      'Viper',
      'Chamber'
    ],
    current_map_pool: true,
    image: 'https://imgur.com/oNm4lD3.png',
    sides: ['A', 'B', 'C']
  },
  {
    name: 'Icebox',
    meta_agents: ['Jett', 'Viper', 'Harbor', 'Killjoy', 'Sova', 'KAY/O', 'Gekko', 'Reyna', 'Sage'],
    image: 'https://imgur.com/aQrhYgx.png',
    sides: ['A', 'B']
  },
  {
    name: 'Pearl',
    meta_agents: [
      'Yoru',
      'Jett',
      'Astra',
      'Viper',
      'Vyse',
      'Killjoy',
      'Cypher',
      'KAY/O',
      'Fade',
      'Sova'
    ],
    image: 'https://imgur.com/P1189zs.png',
    sides: ['A', 'B'],
    current_map_pool: true
  },
  {
    name: 'Split',
    meta_agents: [
      'Raze',
      'Yoru',
      'Jett',
      'Breach',
      'Fade',
      'Skye',
      'Astra',
      'Omen',
      'Viper',
      'Cypher'
    ],
    image: 'https://imgur.com/36tar4S.png',
    sides: ['A', 'B'],
    current_map_pool: true
  },
  {
    name: 'Lotus',
    meta_agents: [
      'Raze',
      'Yoru',
      'Neon',
      'Fade',
      'Tejo',
      'Gekko',
      'Vyse',
      'Cypher',
      'Killjoy',
      'Viper',
      'Omen'
    ],
    image: 'https://imgur.com/CLq6LKn.png',
    sides: ['A', 'B', 'C']
  },
  {
    name: 'Sunset',
    meta_agents: ['Raze', 'Neon', 'Fade', 'Sova', 'Breach', 'Gekko', 'Viper', 'Omen', 'Cypher'],
    image: 'https://imgur.com/MuMwr1F.png',
    sides: ['A', 'B']
  },
  {
    name: 'Abyss',
    meta_agents: [
      'Astra',
      'Omen',
      'KAY/O',
      'Sova',
      'Cypher',
      'Vyse',
      'Chamber',
      'Jett',
      'Yoru',
      'Neon',
      'Veto'
    ],
    current_map_pool: true,
    image: 'https://imgur.com/7b8pgQz.png',
    sides: ['A', 'B']
  },
  {
    name: 'Corrode',
    meta_agents: [
      'Yoru',
      'Waylay',
      'Neon',
      'Omen',
      'Fade',
      'Sova',
      'Viper',
      'Vyse',
      'Chamber',
      'Sage',
      'Veto'
    ],
    current_map_pool: true,
    image: 'https://imgur.com/2rmdsWE.png',
    sides: ['A', 'B']
  }
]
