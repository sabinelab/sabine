import { ProfileSchema, prisma } from '@db'
import type { $Enums, Profile } from '@generated'
import { valorantAgents, valorantMaps, valorantWeapons } from '@sabinelab/utils'
import type { MessageEditOptions, TextChannel } from 'discord.js'
import EmbedBuilder from '../../structures/builders/EmbedBuilder'
import Match, { type KillEvent, type TeamRoster } from './Match'
import Player from './Player'

type SaveMatchOptions = {
  winnerIdx: number
  score1: number
  score2: number
  mode: $Enums.MatchMode
  profile1: Profile
  profile2: Profile
  points?: number
  fates?: number
  winKey?: string
  loseKey?: string
  updateRank?: boolean
}

export default class Round extends Match {
  public override async start() {
    if (this.rounds.length === this.switchSidesAt) {
      await this.switchSides()
    }

    const score1 = this.rounds.filter(r => r.winning_team === 0).length
    const score2 = this.rounds.filter(r => r.winning_team === 1).length

    if (this.mode === 'ranked') {
      if ((score1 === 13 || score2 === 13) && this.rounds.length <= 24) {
        return await this.finish(score1, score2)
      } else if ((score1 > 13 || score2 > 13) && Math.abs(score1 - score2) === 2) {
        return await this.finish(score1, score2)
      }
    } else if (this.mode === 'tournament') {
      if ((score1 === 13 || score2 === 13) && this.rounds.length <= 24) {
        return await this.finish(score1, score2)
      } else if ((score1 > 13 || score2 > 13) && Math.abs(score1 - score2) === 2) {
        return await this.finish(score1, score2)
      }
    } else if (!this.overtime) {
      if (score1 >= this.maxScore || score2 >= this.maxScore) {
        return await this.finish(score1, score2)
      }
    }

    if (this.rounds.length >= 24) {
      await this.switchSides()
    }

    this.content = this.t('simulator.processing')

    const embed = new EmbedBuilder()
      .setTitle(this.t(`simulator.mode.${this.mode}`))
      .setDesc(
        `### ${this.teams[0].name} ${this.rounds.filter(r => r.winning_team === 0).length} <:versus:1349105624180330516> ${this.rounds.filter(r => r.winning_team === 1).length} ${this.teams[1].name}\n` +
          this.content
      )
      .setImage(this.mapImage)
      .setFields(
        {
          name: `${this.teams[0].name} (${this.t(`simulator.sides.${this.teams[0].side}`)})`,
          value: this.teams[0].roster
            .map(
              player =>
                `${valorantAgents.find(a => a.name === player.agent.name)!.emoji} ${player.name} (${Math.floor(player.ovr)}) — \`${player.kills}/${player.deaths}\``
            )
            .join('\n'),
          inline: true
        },
        {
          name: `${this.teams[1].name} (${this.t(`simulator.sides.${this.teams[1].side}`)})`,
          value: this.teams[1].roster
            .map(
              player =>
                `${valorantAgents.find(a => a.name === player.agent.name)!.emoji} ${player.name} (${Math.floor(player.ovr)}) — \`${player.kills}/${player.deaths}\``
            )
            .join('\n'),
          inline: true
        }
      )

    await this.ctx.edit(embed.build(this.mentions) as MessageEditOptions)

    for (const t of this.teams) {
      const teamCredits = t.roster.reduce((sum, p) => sum + p.credits, 0) / 5

      for (const p of t.roster) {
        if (p.life <= 0) {
          p.weapon = {
            melee: {
              damage: {
                head: 50,
                chest: 50
              },
              rate_fire: 750
            },
            secondary: valorantWeapons.filter(w => w.name === 'Classic')[0]
          }
        }
        p.life = 100

        const player = new Player({
          name: p.name,
          life: p.life,
          credits: p.credits,
          weapon: p.weapon!,
          teamCredits,
          stats: p,
          id: p.id,
          rounds: this.rounds.length
        })

        player.buy()

        p.credits = player.credits
        p.weapon = player.weapon

        if (p.weapon.primary) {
          const weapon = valorantWeapons.filter(w => w.name === p.weapon?.primary?.name)[0]

          p.weapon.primary.magazine = weapon.magazine
        }

        if (p.weapon.secondary) {
          const weapon = valorantWeapons.filter(w => w.name === p.weapon?.secondary?.name)[0]

          p.weapon.secondary.magazine = weapon.magazine
        }
      }
    }

    await this.wait(3000)

    await this.firstStep(Math.floor(Math.random() * 6))

    return this
  }
  private async finish(score1: number, score2: number) {
    this.finished = true

    const profile1 = await ProfileSchema.fetch(this.teams[0].user, this.guildId)
    const profile2 = await ProfileSchema.fetch(this.teams[1].user, this.guildId)

    if (!profile1 || !profile2) return this

    const winnerIdx = score1 > score2 ? 0 : 1

    if (this.mode === 'ranked') {
      const diff = Math.abs(score1 - score2)
      const pts = Math.round(10 + (diff - 1) * ((40 - 10) / (13 - 1)))
      await this.saveMatch({
        winnerIdx,
        score1,
        score2,
        mode: 'RANKED',
        profile1,
        profile2,
        points: pts,
        fates: 35,
        winKey: 'rankedWins',
        loseKey: 'rankedDefeats',
        updateRank: true
      })
    } else if (this.mode === 'swiftplay:ranked') {
      const diff = Math.abs(score1 - score2)
      const pts = Math.round(7 + (diff - 1) * ((15 - 7) / (7 - 1)))
      await this.saveMatch({
        winnerIdx,
        score1,
        score2,
        mode: 'RANKED_SWIFTPLAY',
        profile1,
        profile2,
        points: pts,
        fates: 7,
        winKey: 'rankedSwiftplayWins',
        loseKey: 'rankedSwiftplayDefeats',
        updateRank: true
      })
    } else if (this.mode === 'swiftplay:unranked') {
      await this.saveMatch({
        winnerIdx,
        score1,
        score2,
        mode: 'SWIFTPLAY',
        profile1,
        profile2,
        winKey: 'swiftplayWins',
        loseKey: 'swiftplayDefeats'
      })
    } else if (this.mode === 'unranked') {
      await this.saveMatch({
        winnerIdx,
        score1,
        score2,
        mode: 'UNRANKED',
        profile1,
        profile2,
        winKey: 'unrankedWins',
        loseKey: 'unrankedDefeats'
      })
    } else if (this.mode === 'tournament' || (this.mode === 'tournament' && !this.overtime)) {
      await this.saveMatch({
        winnerIdx,
        score1,
        score2,
        mode: 'TOURNAMENT',
        profile1,
        profile2
      })
    }

    return this
  }

  private async saveMatch(options: SaveMatchOptions) {
    const {
      winnerIdx,
      score1,
      score2,
      mode,
      profile1,
      profile2,
      points = 0,
      fates = 0,
      winKey,
      loseKey,
      updateRank = false
    } = options
    const winnerScore = winnerIdx === 0 ? score1 : score2
    const loserScore = winnerIdx === 0 ? score2 : score1
    const p1Win = winnerIdx === 0

    if (winKey && loseKey) {
      if (p1Win) {
        ;(profile1 as any)[winKey] += 1
        if (updateRank) profile1.rankRating += points
        if (fates) profile1.fates += 5
      } else {
        ;(profile2 as any)[winKey] += 1
        if (updateRank) profile2.rankRating += points
        if (fates) profile2.fates += 5
      }

      if (p1Win) {
        ;(profile2 as any)[loseKey] += 1
        if (updateRank) {
          profile2.rankRating -= points - 5
          if (profile2.rankRating < 0) profile2.rankRating = 0
        }
      } else {
        ;(profile1 as any)[loseKey] += 1
        if (updateRank) {
          profile1.rankRating -= points - 5
          if (profile1.rankRating < 0) profile1.rankRating = 0
        }
      }
    }

    const stats = {
      stats: [
        ...this.teams[0].roster.map(p => ({
          id: p.id.toString(),
          kills: p.kills,
          deaths: p.deaths,
          agent: p.agent.name,
          ovr: p.ovr,
          name: p.name
        })),
        ...this.teams[1].roster.map(p => ({
          id: p.id.toString(),
          kills: p.kills,
          deaths: p.deaths,
          agent: p.agent.name,
          ovr: p.ovr,
          name: p.name
        }))
      ],
      map: this.mapImage,
      teams: [
        {
          name: this.teams[0].name,
          user: this.teams[0].user
        },
        {
          name: this.teams[1].name,
          user: this.teams[1].user
        }
      ]
    }

    const transactions: (Promise<unknown> | any)[] = []

    const createMatchData = {
      mode: mode as $Enums.MatchMode,
      profileId: p1Win ? profile1.id : profile2.id,
      winner: true,
      teams: {
        create: [
          {
            user: p1Win ? this.teams[0].user : this.teams[1].user,
            score: winnerScore
          },
          {
            user: p1Win ? this.teams[1].user : this.teams[0].user,
            score: loserScore
          }
        ]
      },
      metadata: stats
    } as any

    if (updateRank) createMatchData.points = points

    const createMatchLoseData = {
      mode: mode as $Enums.MatchMode,
      profileId: p1Win ? profile2.id : profile1.id,
      winner: false,
      teams: {
        create: [
          {
            user: p1Win ? this.teams[1].user : this.teams[0].user,
            score: loserScore
          },
          {
            user: p1Win ? this.teams[0].user : this.teams[1].user,
            score: winnerScore
          }
        ]
      },
      metadata: stats
    } as any

    if (updateRank) createMatchLoseData.points = -(points - 5)

    transactions.push(prisma.match.create({ data: createMatchData }))
    transactions.push(prisma.match.create({ data: createMatchLoseData }))

    if (winKey && loseKey) {
      const winData = {
        [winKey]: { increment: 1 }
      } as any
      if (fates) winData.fates = { increment: fates }
      if (updateRank) winData.rankRating = { increment: points }

      transactions.push(
        prisma.profile.update({
          where: {
            id: p1Win ? profile1.id : profile2.id
          },
          data: winData
        })
      )

      const loseData = {
        [loseKey]: { increment: 1 }
      } as any

      if (updateRank) loseData.rankRating = p1Win ? profile2.rankRating : profile1.rankRating

      transactions.push(
        prisma.profile.update({
          where: {
            id: p1Win ? profile2.id : profile1.id
          },
          data: loseData
        })
      )
    }

    await prisma.$transaction(transactions)

    const embed = new EmbedBuilder()
      .setTitle(this.t(`simulator.mode.${this.mode}`))
      .setDesc(
        `### ${this.teams[0].name} ${this.rounds.filter(r => r.winning_team === 0).length} <:versus:1349105624180330516> ${this.rounds.filter(r => r.winning_team === 1).length} ${this.teams[1].name}\n` +
          this.t('simulator.match_finished')
      )
      .setImage(this.mapImage)
      .setFields(
        {
          name: `${this.teams[0].name} (${this.t(`simulator.sides.${this.teams[0].side}`)})`,
          value: this.teams[0].roster
            .map(
              player =>
                `${valorantAgents.find(a => a.name === player.agent.name)!.emoji} ${player.name} (${Math.floor(player.ovr)}) — \`${player.kills}/${player.deaths}\``
            )
            .join('\n'),
          inline: true
        },
        {
          name: `${this.teams[1].name} (${this.t(`simulator.sides.${this.teams[1].side}`)})`,
          value: this.teams[1].roster
            .map(
              player =>
                `${valorantAgents.find(a => a.name === player.agent.name)!.emoji} ${player.name} (${Math.floor(player.ovr)}) — \`${player.kills}/${player.deaths}\``
            )
            .join('\n'),
          inline: true
        }
      )

    await this.ctx.edit(embed.build(this.mentions) as MessageEditOptions)

    await (this.ctx.channel as TextChannel).send({
      content: this.t('simulator.winner', {
        t: this.teams[winnerIdx].name,
        users: this.mentions
      }),
      reply: {
        messageReference: this.ctx.id
      }
    })
  }

  private async firstStep(duels: number) {
    const kills: KillEvent[] = []

    for (let i = 0; i < duels; i++) {
      const { winnerIndex, winnerTeamIndex, loserIndex, loserTeamIndex, weapon } =
        await this.startPlayerDuel()

      if (winnerIndex === undefined) continue

      const killer = this.teams[winnerTeamIndex].roster[winnerIndex]
      const victim = this.teams[loserTeamIndex].roster[loserIndex]

      kills.push({
        killer: {
          name: killer.name,
          id: killer.id.toString()
        },
        killerIndex: winnerTeamIndex,
        victim: {
          name: victim.name,
          id: victim.id.toString()
        },
        victimIndex: loserTeamIndex,
        weapon: weapon as (typeof valorantWeapons)[number]['name']
      })
    }

    for (const kill of kills) {
      const content = this.t('simulator.kill', {
        t1: this.teams[kill.killerIndex].tag,
        p1: kill.killer.name,
        t2: this.teams[kill.victimIndex].tag,
        p2: kill.victim.name,
        w: kill.weapon
      })

      this.content += `- ${content}\n`
    }

    const embed = new EmbedBuilder()
      .setTitle(this.t(`simulator.mode.${this.mode}`))
      .setDesc(
        `### ${this.teams[0].name} ${this.rounds.filter(r => r.winning_team === 0).length} <:versus:1349105624180330516> ${this.rounds.filter(r => r.winning_team === 1).length} ${this.teams[1].name}\n` +
          this.content
      )
      .setImage(this.mapImage)
      .setFields(
        {
          name: `${this.teams[0].name} (${this.t(`simulator.sides.${this.teams[0].side}`)})`,
          value: this.teams[0].roster
            .map(
              player =>
                `${valorantAgents.find(a => a.name === player.agent.name)!.emoji} ${player.name} (${Math.floor(player.ovr)}) — \`${player.kills}/${player.deaths}\``
            )
            .join('\n'),
          inline: true
        },
        {
          name: `${this.teams[1].name} (${this.t(`simulator.sides.${this.teams[1].side}`)})`,
          value: this.teams[1].roster
            .map(
              player =>
                `${valorantAgents.find(a => a.name === player.agent.name)!.emoji} ${player.name} (${Math.floor(player.ovr)}) — \`${player.kills}/${player.deaths}\``
            )
            .join('\n'),
          inline: true
        }
      )

    await this.ctx.edit(embed.build(this.mentions) as MessageEditOptions)

    const playersAlive1 = this.teams[0].roster.filter(p => p.life > 0).length > 0
    const playersAlive2 = this.teams[1].roster.filter(p => p.life > 0).length > 0

    if (!playersAlive1 || !playersAlive2) {
      const winningTeam = playersAlive1 ? 0 : 1

      this.rounds.push({
        winning_team: winningTeam,
        kills,
        win_type: 'ELIMINATION'
      })

      for (let i = 0; i < this.teams.length; i++) {
        if (i === winningTeam) {
          for (const p of this.teams[i].roster) {
            p.credits += 2900
          }
        } else {
          for (const p of this.teams[i].roster) {
            p.credits += 1900
          }
        }
      }

      const content = this.t('simulator.won_by_elimination', {
        t: this.teams[winningTeam].name
      })
      this.content = this.content.split('\n').slice(1).join('\n') + `${content}\n`

      const embed = new EmbedBuilder()
        .setTitle(this.t(`simulator.mode.${this.mode}`))
        .setDesc(
          `### ${this.teams[0].name} ${this.rounds.filter(r => r.winning_team === 0).length} <:versus:1349105624180330516> ${this.rounds.filter(r => r.winning_team === 1).length} ${this.teams[1].name}\n` +
            this.content
        )
        .setImage(this.mapImage)
        .setFields(
          {
            name: `${this.teams[0].name} (${this.t(`simulator.sides.${this.teams[0].side}`)})`,
            value: this.teams[0].roster
              .map(
                player =>
                  `${valorantAgents.find(a => a.name === player.agent.name)!.emoji} ${player.name} (${Math.floor(player.ovr)}) — \`${player.kills}/${player.deaths}\``
              )
              .join('\n'),
            inline: true
          },
          {
            name: `${this.teams[1].name} (${this.t(`simulator.sides.${this.teams[1].side}`)})`,
            value: this.teams[1].roster
              .map(
                player =>
                  `${valorantAgents.find(a => a.name === player.agent.name)!.emoji} ${player.name} (${Math.floor(player.ovr)}) — \`${player.kills}/${player.deaths}\``
              )
              .join('\n'),
            inline: true
          }
        )

      await this.ctx.edit(embed.build(this.mentions) as MessageEditOptions)

      return await this.wait(3000)
    } else {
      const playersAlive = this.teams
        .find(t => t.side === 'ATTACK')!
        .roster.filter(p => p.life > 0).length
      const minChance = 0.2
      const maxChance = 0.8
      const chance = minChance + ((playersAlive - 1) / (5 - 1)) * (maxChance - minChance)
      const bombPlanted = Math.random() < chance

      if (bombPlanted) {
        const bombSites = valorantMaps.find(m => m.name === this.map)!.sides
        const bombSite = bombSites[Math.floor(Math.random() * bombSites.length)]

        const content = this.t('simulator.spike_planted', {
          bomb: bombSite
        })

        this.content += `${content}\n`

        const embed = new EmbedBuilder()
          .setTitle(this.t(`simulator.mode.${this.mode}`))
          .setDesc(
            `### ${this.teams[0].name} ${this.rounds.filter(r => r.winning_team === 0).length} <:versus:1349105624180330516> ${this.rounds.filter(r => r.winning_team === 1).length} ${this.teams[1].name}\n` +
              this.content
          )
          .setImage(this.mapImage)
          .setFields(
            {
              name: `${this.teams[0].name} (${this.t(`simulator.sides.${this.teams[0].side}`)})`,
              value: this.teams[0].roster
                .map(
                  player =>
                    `${valorantAgents.find(a => a.name === player.agent.name)!.emoji} ${player.name} (${Math.floor(player.ovr)}) — \`${player.kills}/${player.deaths}\``
                )
                .join('\n'),
              inline: true
            },
            {
              name: `${this.teams[1].name} (${this.t(`simulator.sides.${this.teams[1].side}`)})`,
              value: this.teams[1].roster
                .map(
                  player =>
                    `${valorantAgents.find(a => a.name === player.agent.name)!.emoji} ${player.name} (${Math.floor(player.ovr)}) — \`${player.kills}/${player.deaths}\``
                )
                .join('\n'),
              inline: true
            }
          )

        await this.wait(1500)
        await this.ctx.edit(embed.build(this.mentions) as MessageEditOptions)

        return await this.secondStep(true)
      } else {
        await this.wait(1500)
        return await this.secondStep()
      }
    }
  }

  private async secondStep(bombPlanted?: boolean) {
    const kills: KillEvent[] = []

    const attacker = this.teams.findIndex(t => t.side === 'ATTACK')
    const defender = this.teams.findIndex(t => t.side === 'DEFENSE')

    const attackerOvr = this.calcTeamOvr(attacker, true)
    const defenderOvr = this.calcTeamOvr(defender, true)
    const totalOvr = attackerOvr + defenderOvr

    const attackerChance = attackerOvr / totalOvr
    const defenderChance = defenderOvr / totalOvr

    let win_type: 'ELIMINATION' | 'BOMB' | 'DEFUSE' | 'TIME'

    if (bombPlanted) {
      const random = Math.random()

      if (random < defenderChance * 0.5) {
        win_type = 'DEFUSE'
      } else if (random < attackerChance * 0.7) {
        win_type = 'BOMB'
      } else {
        win_type = 'ELIMINATION'
      }
    } else {
      if (Math.random() < defenderChance * 0.05) {
        win_type = 'TIME'
      } else {
        win_type = 'ELIMINATION'
      }
    }

    if (win_type === 'ELIMINATION') {
      let alivePlayers = [
        ...this.teams[0].roster.filter(p => p.life > 0),
        ...this.teams[1].roster.filter(p => p.life > 0)
      ].length

      while (alivePlayers > 0) {
        const { winnerIndex, winnerTeamIndex, loserIndex, loserTeamIndex, weapon } =
          await this.startPlayerDuel()

        if (winnerIndex === undefined) {
          alivePlayers--
          continue
        }

        const killer = this.teams[winnerTeamIndex].roster[winnerIndex]
        const victim = this.teams[loserTeamIndex].roster[loserIndex]

        kills.push({
          killer: {
            name: killer.name,
            id: killer.id.toString()
          },
          killerIndex: winnerTeamIndex,
          victim: {
            name: victim.name,
            id: victim.id.toString()
          },
          victimIndex: loserTeamIndex,
          weapon: weapon as (typeof valorantWeapons)[number]['name']
        })

        alivePlayers--
      }

      for (const kill of kills) {
        const content = this.t('simulator.kill', {
          t1: this.teams[kill.killerIndex].tag,
          p1: kill.killer.name,
          t2: this.teams[kill.victimIndex].tag,
          p2: kill.victim.name,
          w: kill.weapon
        })

        this.content += `- ${content}\n`
      }

      const winning_team = this.teams[0].roster.filter(p => p.life > 0).length > 0 ? 0 : 1

      this.rounds.push({
        kills,
        win_type,
        winning_team
      })

      for (let i = 0; i < this.teams.length; i++) {
        if (i === winning_team) {
          for (const p of this.teams[i].roster) {
            let bonus = 0

            if (bombPlanted) {
              bonus += 300
            }

            p.credits += 2900 + bonus
          }
        } else {
          for (const p of this.teams[i].roster) {
            p.credits += 1900
          }
        }
      }
      const content = this.t('simulator.won_by_elimination', {
        t: this.teams[winning_team].name
      })

      this.content = this.content.split('\n').slice(1).join('\n') + `${content}\n`

      const embed = new EmbedBuilder()
        .setTitle(this.t(`simulator.mode.${this.mode}`))
        .setDesc(
          `### ${this.teams[0].name} ${this.rounds.filter(r => r.winning_team === 0).length} <:versus:1349105624180330516> ${this.rounds.filter(r => r.winning_team === 1).length} ${this.teams[1].name}\n` +
            this.content
        )
        .setImage(this.mapImage)
        .setFields(
          {
            name: `${this.teams[0].name} (${this.t(`simulator.sides.${this.teams[0].side}`)})`,
            value: this.teams[0].roster
              .map(
                player =>
                  `${valorantAgents.find(a => a.name === player.agent.name)!.emoji} ${player.name} (${Math.floor(player.ovr)}) — \`${player.kills}/${player.deaths}\``
              )
              .join('\n'),
            inline: true
          },
          {
            name: `${this.teams[1].name} (${this.t(`simulator.sides.${this.teams[1].side}`)})`,
            value: this.teams[1].roster
              .map(
                player =>
                  `${valorantAgents.find(a => a.name === player.agent.name)!.emoji} ${player.name} (${Math.floor(player.ovr)}) — \`${player.kills}/${player.deaths}\``
              )
              .join('\n'),
            inline: true
          }
        )

      await this.ctx.edit(embed.build(this.mentions) as MessageEditOptions)
      await this.wait(3000)
    } else if (win_type === 'BOMB') {
      let alivePlayers = [
        ...this.teams[0].roster.filter(p => p.life > 0),
        ...this.teams[1].roster.filter(p => p.life > 0)
      ].length

      while (alivePlayers > 0) {
        const { winnerIndex, winnerTeamIndex, loserIndex, loserTeamIndex, weapon } =
          await this.startPlayerDuel()

        if (winnerIndex === undefined) {
          alivePlayers--
          continue
        }

        const killer = this.teams[winnerTeamIndex].roster[winnerIndex]
        const victim = this.teams[loserTeamIndex].roster[loserIndex]

        kills.push({
          killer: {
            name: killer.name,
            id: killer.id.toString()
          },
          killerIndex: winnerTeamIndex,
          victim: {
            name: victim.name,
            id: victim.id.toString()
          },
          victimIndex: loserTeamIndex,
          weapon: weapon as (typeof valorantWeapons)[number]['name']
        })

        alivePlayers--
      }
      for (const kill of kills) {
        const content = this.t('simulator.kill', {
          t1: this.teams[kill.killerIndex].tag,
          p1: kill.killer.name,
          t2: this.teams[kill.victimIndex].tag,
          p2: kill.victim.name,
          w: kill.weapon
        })

        this.content += `- ${content}\n`
      }
      const winning_team = this.teams.findIndex(t => t.side === 'ATTACK')

      this.rounds.push({
        kills,
        win_type,
        winning_team
      })

      for (let i = 0; i < this.teams.length; i++) {
        if (i === winning_team) {
          for (const p of this.teams[i].roster) {
            let bonus = 0

            if (bombPlanted) {
              bonus += 300
            }

            p.credits += 2900 + bonus
          }
        } else {
          for (const p of this.teams[i].roster) {
            p.credits += 1900
          }
        }
      }

      const content = this.t('simulator.spike_detonated', {
        t: this.teams[winning_team].name
      })

      this.content = this.content.split('\n').slice(1).join('\n') + `${content}\n`

      const embed = new EmbedBuilder()
        .setTitle(this.t(`simulator.mode.${this.mode}`))
        .setDesc(
          `### ${this.teams[0].name} ${this.rounds.filter(r => r.winning_team === 0).length} <:versus:1349105624180330516> ${this.rounds.filter(r => r.winning_team === 1).length} ${this.teams[1].name}\n` +
            this.content
        )
        .setImage(this.mapImage)
        .setFields(
          {
            name: `${this.teams[0].name} (${this.t(`simulator.sides.${this.teams[0].side}`)})`,
            value: this.teams[0].roster
              .map(
                player =>
                  `${valorantAgents.find(a => a.name === player.agent.name)!.emoji} ${player.name} (${Math.floor(player.ovr)}) — \`${player.kills}/${player.deaths}\``
              )
              .join('\n'),
            inline: true
          },
          {
            name: `${this.teams[1].name} (${this.t(`simulator.sides.${this.teams[1].side}`)})`,
            value: this.teams[1].roster
              .map(
                player =>
                  `${valorantAgents.find(a => a.name === player.agent.name)!.emoji} ${player.name} (${Math.floor(player.ovr)}) — \`${player.kills}/${player.deaths}\``
              )
              .join('\n'),
            inline: true
          }
        )

      await this.ctx.edit(embed.build(this.mentions) as MessageEditOptions)
      await this.wait(3000)
    } else if (win_type === 'DEFUSE') {
      let alivePlayers = [
        ...this.teams[0].roster.filter(p => p.life > 0),
        ...this.teams[1].roster.filter(p => p.life > 0)
      ].length

      while (alivePlayers > 0) {
        const { winnerIndex, winnerTeamIndex, loserIndex, loserTeamIndex, weapon } =
          await this.startPlayerDuel()

        if (winnerIndex === undefined) {
          alivePlayers--

          continue
        }

        const killer = this.teams[winnerTeamIndex].roster[winnerIndex]
        const victim = this.teams[loserTeamIndex].roster[loserIndex]

        kills.push({
          killer: {
            name: killer.name,
            id: killer.id.toString()
          },
          killerIndex: winnerTeamIndex,
          victim: {
            name: victim.name,
            id: victim.id.toString()
          },
          victimIndex: loserTeamIndex,
          weapon: weapon as (typeof valorantWeapons)[number]['name']
        })

        alivePlayers--
      }
      for (const kill of kills) {
        const content = this.t('simulator.kill', {
          t1: this.teams[kill.killerIndex].tag,
          p1: kill.killer.name,
          t2: this.teams[kill.victimIndex].tag,
          p2: kill.victim.name,
          w: kill.weapon
        })

        this.content += `- ${content}\n`
      }
      const winning_team = this.teams.findIndex(t => t.side === 'DEFENSE')

      this.rounds.push({
        kills,
        win_type,
        winning_team
      })

      for (let i = 0; i < this.teams.length; i++) {
        if (i === winning_team) {
          for (const p of this.teams[i].roster) {
            let bonus = 0

            if (bombPlanted) {
              bonus += 300
            }

            p.credits += 2900 + bonus
          }
        } else {
          for (const p of this.teams[i].roster) {
            p.credits += 1900
          }
        }
      }

      const content = this.t('simulator.spike_defused', {
        t: this.teams[winning_team].name
      })

      this.content = this.content.split('\n').slice(1).join('\n') + `${content}\n`

      const embed = new EmbedBuilder()
        .setTitle(this.t(`simulator.mode.${this.mode}`))
        .setDesc(
          `### ${this.teams[0].name} ${this.rounds.filter(r => r.winning_team === 0).length} <:versus:1349105624180330516> ${this.rounds.filter(r => r.winning_team === 1).length} ${this.teams[1].name}\n` +
            this.content
        )
        .setImage(this.mapImage)
        .setFields(
          {
            name: `${this.teams[0].name} (${this.t(`simulator.sides.${this.teams[0].side}`)})`,
            value: this.teams[0].roster
              .map(
                player =>
                  `${valorantAgents.find(a => a.name === player.agent.name)!.emoji} ${player.name} (${Math.floor(player.ovr)}) — \`${player.kills}/${player.deaths}\``
              )
              .join('\n'),
            inline: true
          },
          {
            name: `${this.teams[1].name} (${this.t(`simulator.sides.${this.teams[1].side}`)})`,
            value: this.teams[1].roster
              .map(
                player =>
                  `${valorantAgents.find(a => a.name === player.agent.name)!.emoji} ${player.name} (${Math.floor(player.ovr)}) — \`${player.kills}/${player.deaths}\``
              )
              .join('\n'),
            inline: true
          }
        )

      await this.ctx.edit(embed.build(this.mentions) as MessageEditOptions)
      await this.wait(3000)
    } else if (win_type === 'TIME') {
      let alivePlayers = [
        ...this.teams[0].roster.filter(p => p.life > 0),
        ...this.teams[1].roster.filter(p => p.life > 0)
      ].length

      while (alivePlayers > 0) {
        const { winnerIndex, winnerTeamIndex, loserIndex, loserTeamIndex, weapon } =
          await this.startPlayerDuel()

        if (winnerIndex === undefined) {
          alivePlayers--

          continue
        }

        const killer = this.teams[winnerTeamIndex].roster[winnerIndex]
        const victim = this.teams[loserTeamIndex].roster[loserIndex]

        kills.push({
          killer: {
            name: killer.name,
            id: killer.id.toString()
          },
          killerIndex: winnerTeamIndex,
          victim: {
            name: victim.name,
            id: victim.id.toString()
          },
          victimIndex: loserTeamIndex,
          weapon: weapon as (typeof valorantWeapons)[number]['name']
        })

        alivePlayers--
      }
      for (const kill of kills) {
        const content = this.t('simulator.kill', {
          t1: this.teams[kill.killerIndex].tag,
          p1: kill.killer.name,
          t2: this.teams[kill.victimIndex].tag,
          p2: kill.victim.name,
          w: kill.weapon
        })

        this.content += `- ${content}\n`
      }

      const winning_team = this.teams.findIndex(t => t.side === 'DEFENSE')

      this.rounds.push({
        kills,
        win_type,
        winning_team
      })

      for (let i = 0; i < this.teams.length; i++) {
        if (i === winning_team) {
          for (const p of this.teams[i].roster) {
            let bonus = 0

            if (bombPlanted) {
              bonus += 300
            }

            p.credits += 2900 + bonus
          }
        } else {
          for (const p of this.teams[i].roster) {
            p.credits += 1900
          }
        }
      }

      const content = this.t('simulator.spike_not_planted', {
        t: this.teams[winning_team].name
      })

      this.content = this.content.split('\n').slice(1).join('\n') + `${content}\n`

      const embed = new EmbedBuilder()
        .setTitle(this.t(`simulator.mode.${this.mode}`))
        .setDesc(
          `### ${this.teams[0].name} ${this.rounds.filter(r => r.winning_team === 0).length} <:versus:1349105624180330516> ${this.rounds.filter(r => r.winning_team === 1).length} ${this.teams[1].name}\n` +
            this.content
        )
        .setImage(this.mapImage)
        .setFields(
          {
            name: `${this.teams[0].name} (${this.t(`simulator.sides.${this.teams[0].side}`)})`,
            value: this.teams[0].roster
              .map(
                player =>
                  `${valorantAgents.find(a => a.name === player.agent.name)!.emoji} ${player.name} (${Math.floor(player.ovr)}) — \`${player.kills}/${player.deaths}\``
              )
              .join('\n'),
            inline: true
          },
          {
            name: `${this.teams[1].name} (${this.t(`simulator.sides.${this.teams[1].side}`)})`,
            value: this.teams[1].roster
              .map(
                player =>
                  `${valorantAgents.find(a => a.name === player.agent.name)!.emoji} ${player.name} (${Math.floor(player.ovr)}) — \`${player.kills}/${player.deaths}\``
              )
              .join('\n'),
            inline: true
          }
        )

      await this.ctx.edit(embed.build(this.mentions) as MessageEditOptions)
      await this.wait(3000)
    }
  }

  private calcTeamOvr(i: number, alivePlayers?: boolean) {
    if (alivePlayers) {
      return this.teams[i].roster.filter(p => p.life > 0).reduce((sum, p) => sum + p.ovr, 0)
    }

    return this.teams[i].roster.reduce((sum, p) => sum + p.ovr, 0)
  }

  private async startPlayerDuel() {
    const player1 = this.choosePlayer(
      this.teams[0].roster.filter(p => p.life > 0),
      0,
      p => p.aggression * 5
    )
    const player2 = this.choosePlayer(
      this.teams[1].roster.filter(p => p.life > 0),
      1,
      p => p.aggression * 5
    )

    const [winner1, winner2, weapon1, weapon2] = await this.chooseWinner(player1, player2)

    const i1 = this.teams[0].roster.findIndex(p => p.id === player1?.id)
    const i2 = this.teams[1].roster.findIndex(p => p.id === player2?.id)

    if (winner1 && i1 >= 0 && i2 >= 0) {
      this.teams[0].roster[i1].kills! += 1
      this.teams[0].roster[i1].life = player1?.life ?? 0
      this.teams[1].roster[i2].deaths! += 1
      this.teams[1].roster[i2].life = player2?.life ?? 0

      return {
        winnerIndex: i1,
        loserIndex: i2,
        winnerTeamIndex: 0,
        loserTeamIndex: 1,
        weapon: weapon1
      }
    } else if (winner2 && i1 >= 0 && i2 >= 0) {
      this.teams[1].roster[i2].kills! += 1
      this.teams[1].roster[i2].life = player2?.life ?? 0
      this.teams[0].roster[i1].deaths! += 1
      this.teams[0].roster[i1].life = player1?.life ?? 0

      return {
        winnerIndex: i2,
        loserIndex: i1,
        winnerTeamIndex: 1,
        loserTeamIndex: 0,
        weapon: weapon2
      }
    } else {
      return {
        winnerIndex: undefined,
        loserIndex: undefined,
        winnerTeamIndex: undefined,
        loserTeamIndex: undefined,
        weapon: undefined
      }
    }
  }

  private async chooseWinner(player1: Player | undefined, player2: Player | undefined) {
    let nextShot1 = 0
    let nextShot2 = 0

    let weapon1 = ''
    let weapon2 = ''

    if (!player1) {
      if (player2?.weapon.primary?.magazine && player2.weapon.primary.magazine > 0) {
        nextShot2 = player2!.weapon.primary.rate_fire
        weapon2 = player2!.weapon.primary.name!
      } else if (player2!.weapon.secondary?.magazine && player2!.weapon.secondary.magazine > 0) {
        nextShot2 = player2!.weapon.secondary.rate_fire
        weapon2 = player2!.weapon.secondary.name!
      } else {
        nextShot2 = player2!.weapon.melee.rate_fire
        weapon2 = 'Melee'
      }
      return [false, true, weapon1, weapon2]
    }
    if (!player2) {
      if (player1?.weapon.primary?.magazine && player1.weapon.primary.magazine > 0) {
        nextShot1 = player1.weapon.primary.rate_fire
        weapon1 = player1.weapon.primary.name!
      } else if (player1!.weapon.secondary?.magazine && player1.weapon.secondary.magazine > 0) {
        nextShot1 = player1.weapon.secondary.rate_fire
        weapon1 = player1.weapon.secondary.name!
      } else {
        nextShot1 = player1.weapon.melee.rate_fire
        weapon1 = 'Melee'
      }
      return [true, false, weapon1, weapon2]
    }

    if (!player1.weapon.secondary) {
      player1.weapon.secondary = valorantWeapons.find(w => w.name === 'Classic')!
    }

    if (!player2.weapon.secondary) {
      player2.weapon.secondary = valorantWeapons.find(w => w.name === 'Classic')!
    }

    if (player1.weapon.primary?.magazine && player1.weapon.primary.magazine > 0) {
      nextShot1 = player1.weapon.primary.rate_fire
      weapon1 = player1.weapon.primary.name!
    } else if (player1.weapon.secondary.magazine && player1.weapon.secondary.magazine > 0) {
      nextShot1 = player1.weapon.secondary.rate_fire
      weapon1 = player1.weapon.secondary.name!
    } else {
      nextShot1 = player1.weapon.melee.rate_fire
      weapon1 = 'Melee'
    }

    if (player2.weapon.primary?.magazine && player2.weapon.primary.magazine > 0) {
      nextShot2 = player2.weapon.primary.rate_fire
      weapon2 = player2.weapon.primary.name!
    } else if (player2.weapon.secondary.magazine && player2.weapon.secondary.magazine > 0) {
      nextShot2 = player2.weapon.secondary.rate_fire
      weapon2 = player2.weapon.secondary.name!
    } else {
      nextShot2 = player2.weapon.melee.rate_fire
      weapon2 = 'Melee'
    }

    while (player1.life > 0 && player2.life > 0) {
      const wait = Math.min(nextShot1, nextShot2)

      nextShot1 -= wait
      nextShot2 -= wait

      if (nextShot1 <= 0 && player1.life > 0) {
        const shoot = player1.shoot(player2.stats.movement)

        player2.life -= shoot[0]
        nextShot1 = shoot[1]
      }
      if (nextShot2 <= 0 && player2.life > 0) {
        const shoot = player2.shoot(player2.stats.movement)

        player1.life -= shoot[0]
        nextShot2 = shoot[1]
      }

      await this.wait(wait)
    }

    return [player1.life > 0, player2.life > 0, weapon1, weapon2]
  }

  private choosePlayer(
    items: TeamRoster[],
    index: number,
    weightFun: (item: TeamRoster) => number
  ) {
    const weight = items.reduce((sum, i) => sum + weightFun(i), 0)
    let random = Math.random() * weight

    for (const item of items) {
      random -= weightFun(item)

      if (random <= 0) {
        const player = new Player({
          name: item.name,
          life: item.life,
          credits: item.credits,
          weapon: item.weapon!,
          teamCredits: this.teams[index].roster.reduce((sum, p) => sum + p.credits, 0) / 5,
          stats: item,
          id: item.id,
          rounds: this.rounds.length
        })

        return player
      }
    }
  }
}
