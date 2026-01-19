export type Emoji = {
  name: string
  aliases?: string[]
  emoji: string
}

export const emojis: Emoji[] = [
  // DEFAULT TEAM EMOJIS
  {
    name: 'default',
    emoji: '<:team:1439977512074739713>'
  },
  // VCT CHINA
  {
    name: 'all gamers',
    emoji: '<:all_gamers:1439979628465750146>'
  },
  {
    name: 'guangzhou huadu bilibili gaming',
    aliases: ['bilibili gaming'],
    emoji: '<:blg:1439977527572435055>'
  },
  {
    name: 'edward gaming',
    emoji: '<:edg:1439977531758612662>'
  },
  {
    name: 'funplus phoenix',
    emoji: '<:fpx:1439977528944230510>'
  },
  {
    name: 'jd mall jdg esports',
    aliases: ['jdg esports'],
    emoji: '<:jdg:1439977509255905310>'
  },
  {
    name: 'nova esports',
    aliases: ['nova esports gc'],
    emoji: '<:nova:1439977507418935378>'
  },
  {
    name: 'trace esports',
    aliases: ['trace esports gc'],
    emoji: '<:trace:1439977505258733671>'
  },
  {
    name: 'titan esports club',
    emoji: '<:tec:1439977502876373074>'
  },
  {
    name: 'tyloo',
    aliases: ['tyloo gc'],
    emoji: '<:tyloo:1439977501114765395>'
  },
  {
    name: 'wolves esports',
    emoji: '<:wolves:1439977499890286643>'
  },
  {
    name: 'dragon ranger gaming',
    emoji: '<:drg:1439977498598445107>'
  },
  {
    name: 'xi lai gaming',
    emoji: '<:xlg:1439977497088491684>'
  },
  // VCT AMERICAS
  {
    name: '100 thieves',
    emoji: '<:100t:1439977516600262786>'
  },
  {
    name: 'cloud9',
    emoji: '<:cloud9:1439977514973003888>',
    aliases: ['cloud9 kia']
  },
  {
    name: 'evil geniuses',
    emoji: '<:eg:1439977513420984370>'
  },
  {
    name: 'furia',
    emoji: '<:furia:1439977549374554283>',
    aliases: ['furia academy', 'furia esports']
  },
  {
    name: 'krü esports',
    emoji: '<:kru:1439977547877322812>',
    aliases: ['kru blaze', 'krü blaze', 'visa krü']
  },
  {
    name: 'leviatán',
    emoji: '<:leviatan:1439977545855406120>',
    aliases: ['leviatán academy', 'leviatán gc', 'leviatan esports']
  },
  {
    name: 'loud',
    emoji: '<:loud:1439971637226111016>',
    aliases: ['loud gc']
  },
  {
    name: 'mibr',
    emoji: '<:mibr:1439977463219486721>',
    aliases: ['mibr academy', 'mibr gc']
  },
  {
    name: 'nrg esports',
    emoji: '<:nrg:1439977543930482761>',
    aliases: ['nrg']
  },
  {
    name: 'sentinels',
    emoji: '<:sentinels:1439977541703303391>',
    aliases: ['cubert academy', 'sentinels cubert academy']
  },
  {
    name: 'g2 esports',
    aliases: ['g2 gozen'],
    emoji: '<:g2:1439977540193222776>'
  },
  {
    name: '2game esports',
    aliases: ['2game academy', '2game esports gc'],
    emoji: '<:2g:1439977538096205834>'
  },
  {
    name: 'corinthians esports',
    aliases: ['corinthians esports inclusivo', 'corinthians e-sports', 'corinthians esports'],
    emoji: '<:corinthians:1439977471859494912>'
  },
  {
    name: 'red canids',
    emoji: '<:red:1439977469925920899>',
    aliases: ['red kalunga', 'red academy']
  },
  {
    name: 'grêmio esports',
    emoji: '<:gremio:1439977461868658718>'
  },
  {
    name: 'tbk esports',
    emoji: '<:tbk:1439977460346257468>'
  },
  {
    name: 'los grandes',
    emoji: '<:los:1439977458831986831>',
    aliases: ['los']
  },
  {
    name: 'envy',
    emoji: '<:envy:1439977457326362744>'
  },
  {
    name: 'tsm',
    emoji: '<:tsm:1439977455971729520>'
  },
  {
    name: 'shopify rebellion',
    aliases: ['shopify rebellion gold', 'shopify rebellion black'],
    emoji: '<:shopify:1439977454369509448>'
  },
  {
    name: 'm80',
    emoji: '<:m80:1439977452758630544>'
  },
  {
    name: 'fluxo w7m',
    emoji: '<:fluxo_w7m:1439977448950468669>'
  },
  {
    name: 'vivo keyd stars',
    emoji: '<:keyd:1439977447415087244>',
    aliases: ['vivo keyd stars academy']
  },
  {
    name: 'pain gaming',
    emoji: '<:pain:1439977445649289216>'
  },
  {
    name: 'flamengo esports',
    emoji: '<:flamengo:1439977443711520768>'
  },
  // VCT APAC
  {
    name: 'detonation focusme',
    emoji: '<:dfm:1439977495452454912>',
    aliases: ['detonation focusme gc']
  },
  {
    name: 'drx',
    aliases: ['drx changers', 'drx academy'],
    emoji: '<:drx:1439977526028927097>'
  },
  {
    name: 'gen.g',
    aliases: ['gen.g global academy'],
    emoji: '<:geng:1439977524590415892>'
  },
  {
    name: 'global esports',
    emoji: '<:ge:1439977494064398440>',
    aliases: ['global esports academy']
  },
  {
    name: 'paper rex',
    emoji: '<:prx:1439977522753310790>'
  },
  {
    name: 'rex regum qeon',
    emoji: '<:rrq:1439977450401693696>'
  },
  {
    name: 't1',
    aliases: ['t1 academy'],
    emoji: '<:t1:1439977521176379543>'
  },
  {
    name: 'talon',
    aliases: ['talon academy'],
    emoji: '<:talon:1439977491199561810>'
  },
  {
    name: 'team secret',
    aliases: ['team secret academy'],
    emoji: '<:secret:1439977489983209712>'
  },
  {
    name: 'zeta division',
    aliases: ['zeta division academy'],
    emoji: '<:zeta:1439977519552925696>'
  },
  {
    name: 'nongshim redforce',
    emoji: '<:nongshim:1439977488431316992>'
  },
  {
    name: 'boom esports',
    emoji: '<:boom:1439977486959116318>'
  },
  // VCT EMEA
  {
    name: 'bbl esports',
    emoji: '<:bbl:1439977485365153834>'
  },
  {
    name: 'fnatic',
    emoji: '<:fnatic:1439977536355303537>'
  },
  {
    name: 'fut esports',
    emoji: '<:fut:1439977518093434910>'
  },
  {
    name: 'giantx',
    aliases: ['giantx gc'],
    emoji: '<:giantx:1439977483792547940>'
  },
  {
    name: 'karmine corp',
    aliases: ['karmine corp gc'],
    emoji: '<:karmine:1439977482320347166>'
  },
  {
    name: 'natus vincere',
    emoji: '<:navi:1439977480839631003>'
  },
  {
    name: 'team heretics',
    emoji: '<:heretics:1439977534828838975>'
  },
  {
    name: 'koi',
    aliases: ['movistar koi', 'koi fénix'],
    emoji: '<:koi:1439977479484735489>'
  },
  {
    name: 'team liquid',
    aliases: ['team liquid academy', 'team liquid brazil', 'team liquid honda'],
    emoji: '<:liquid:1439977533293592726>'
  },
  {
    name: 'team vitality',
    emoji: '<:vitality:1439977477605818498>'
  },
  {
    name: 'gentle mates',
    emoji: '<:m8:1439977476313972818>'
  },
  {
    name: 'apeks',
    emoji: '<:apeks:1439977474900492418>'
  },
  {
    name: 'controller',
    emoji: '<:controller:1404609821818228817>'
  },
  {
    name: 'duelist',
    emoji: '<:duelist:1404610039335092225>'
  },
  {
    name: 'initiator',
    emoji: '<:initiator:1404610214400884866>'
  },
  {
    name: 'sentinel',
    emoji: '<:sentinel:1404610314091364394>'
  },
  {
    name: 'flex',
    emoji:
      '<:controller:1404609821818228817> <:duelist:1404610039335092225> <:initiator:1404610214400884866> <:sentinel:1404610314091364394>'
  }
]
