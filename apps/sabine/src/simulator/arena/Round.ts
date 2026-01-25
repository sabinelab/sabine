import { ProfileSchema, prisma } from '@db'
import { valorantMaps, valorantWeapons } from '@sabinelab/utils'
import Match, { type KillEvent, type TeamRoster } from './Match'
import Player from './Player'

export default class Round extends Match {
  public override async start() {
    if (this.rounds.length === this.switchSidesAt) {
      await this.switchSides()
    }

    const score1 = this.rounds.filter(r => r.winning_team === 0).length
    const score2 = this.rounds.filter(r => r.winning_team === 1).length

    if (this.mode === 'arena') {
      if ((score1 === 13 || score2 === 13) && this.rounds.length <= 24) {
        return await this.finish(score1, score2)
      } else if ((score1 > 13 || score2 > 13) && Math.abs(score1 - score2) === 2) {
        return await this.finish(score1, score2)
      }
    }

    if (this.rounds.length >= 24) {
      await this.switchSides()
    }

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

    await this.firstStep(Math.floor(Math.random() * 6))

    return this
  }

  private async finish(score1: number, score2: number) {
    this.finished = true

    const profile1 = await ProfileSchema.fetch(this.teams[0].user, this.teams[0].guildId)
    const profile2 = await ProfileSchema.fetch(this.teams[1].user, this.teams[1].guildId)

    if (!profile1 || !profile2) return this

    if (this.mode === 'arena') {
      const max = Math.max(score1, score2)

      if (max === 13 && score1 === max) {
        const diff = score1 - score2
        const maxDiff = 13
        const minPts = 20
        const maxPts = 60
        const pts = Math.round(minPts + (diff - 1) * ((maxPts - minPts) / (maxDiff - 1)))

        profile1.arenaWins += 1
        profile1.rankRating += pts
        profile1.fates += 5
        profile2.arenaDefeats += 1
        profile2.rankRating -= pts - 5

        if (profile2.rankRating < 0) {
          profile2.rankRating = 0
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

        await prisma.$transaction([
          prisma.match.create({
            data: {
              mode: 'ARENA',
              points: pts,
              profileId: profile1.id,
              winner: true,
              teams: {
                create: [
                  {
                    user: this.teams[0].user,
                    score: score1
                  },
                  {
                    user: this.teams[1].user,
                    score: score2
                  }
                ]
              },
              metadata: stats
            }
          }),
          prisma.match.create({
            data: {
              mode: 'ARENA',
              points: -(pts - 5),
              profileId: profile2.id,
              winner: false,
              teams: {
                create: [
                  {
                    user: this.teams[1].user,
                    score: score2
                  },
                  {
                    user: this.teams[0].user,
                    score: score1
                  }
                ]
              },
              metadata: stats
            }
          }),
          prisma.profile.update({
            where: {
              id: profile1.id
            },
            data: {
              arenaWins: {
                increment: 1
              },
              rankRating: {
                increment: pts
              },
              fates: {
                increment: 35
              }
            }
          }),
          prisma.profile.update({
            where: {
              id: profile2.id
            },
            data: {
              arenaDefeats: {
                increment: 1
              },
              rankRating: profile2.rankRating
            }
          })
        ])
      } else if (max === 13 && score2 === max) {
        const diff = score2 - score1
        const maxDiff = 13
        const minPts = 20
        const maxPts = 60
        const pts = Math.round(minPts + (diff - 1) * ((maxPts - minPts) / (maxDiff - 1)))

        profile2.arenaWins += 1
        profile2.rankRating += pts
        profile2.fates += 5
        profile1.arenaDefeats += 1
        profile1.rankRating -= pts - 5

        if (profile1.rankRating < 0) {
          profile1.rankRating = 0
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

        await prisma.$transaction([
          prisma.match.create({
            data: {
              mode: 'ARENA',
              points: pts,
              profileId: profile2.id,
              winner: true,
              teams: {
                create: [
                  {
                    user: this.teams[1].user,
                    score: score2
                  },
                  {
                    user: this.teams[0].user,
                    score: score1
                  }
                ]
              },
              metadata: stats
            }
          }),
          prisma.match.create({
            data: {
              mode: 'ARENA',
              points: -(pts - 5),
              profileId: profile1.id,
              winner: false,
              teams: {
                create: [
                  {
                    user: this.teams[0].user,
                    score: score1
                  },
                  {
                    user: this.teams[1].user,
                    score: score2
                  }
                ]
              },
              metadata: stats
            }
          }),
          prisma.profile.update({
            where: {
              id: profile2.id
            },
            data: {
              arenaWins: {
                increment: 1
              },
              rankRating: {
                increment: pts
              },
              fates: {
                increment: 35
              }
            }
          }),
          prisma.profile.update({
            where: {
              id: profile1.id
            },
            data: {
              arenaDefeats: {
                increment: 1
              },
              rankRating: profile1.rankRating
            }
          })
        ])
      } else if (max > 13 && score1 === max) {
        const diff = score1 - score2
        const maxDiff = 13
        const minPts = 20
        const maxPts = 60
        const pts = Math.round(minPts + (diff - 1) * ((maxPts - minPts) / (maxDiff - 1)))

        profile1.arenaWins += 1
        profile1.rankRating += pts
        profile1.fates += 5
        profile2.arenaDefeats += 1
        profile2.rankRating -= pts - 5

        if (profile2.rankRating < 0) {
          profile2.rankRating = 0
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

        await prisma.$transaction([
          prisma.match.create({
            data: {
              mode: 'ARENA',
              points: pts,
              profileId: profile1.id,
              winner: true,
              teams: {
                create: [
                  {
                    user: this.teams[0].user,
                    score: score1
                  },
                  {
                    user: this.teams[1].user,
                    score: score2
                  }
                ]
              },
              metadata: stats
            }
          }),
          prisma.match.create({
            data: {
              mode: 'ARENA',
              points: -(pts - 5),
              profileId: profile2.id,
              winner: false,
              teams: {
                create: [
                  {
                    user: this.teams[1].user,
                    score: score2
                  },
                  {
                    user: this.teams[0].user,
                    score: score1
                  }
                ]
              },
              metadata: stats
            }
          }),
          prisma.profile.update({
            where: {
              id: profile1.id
            },
            data: {
              arenaWins: {
                increment: 1
              },
              rankRating: {
                increment: pts
              },
              fates: {
                increment: 35
              }
            }
          }),
          prisma.profile.update({
            where: {
              id: profile2.id
            },
            data: {
              arenaDefeats: {
                increment: 1
              },
              rankRating: profile2.rankRating
            }
          })
        ])
      } else if (max > 13 && score2 === max) {
        const diff = score2 - score1
        const maxDiff = 13
        const minPts = 20
        const maxPts = 60
        const pts = Math.round(minPts + (diff - 1) * ((maxPts - minPts) / (maxDiff - 1)))

        profile2.arenaWins += 1
        profile2.rankRating += pts
        profile2.fates += 5
        profile1.arenaDefeats += 1
        profile1.rankRating -= pts - 5

        if (profile1.rankRating < 0) {
          profile1.rankRating = 0
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

        await prisma.$transaction([
          prisma.match.create({
            data: {
              mode: 'ARENA',
              points: pts,
              profileId: profile2.id,
              winner: true,
              teams: {
                create: [
                  {
                    user: this.teams[1].user,
                    score: score2
                  },
                  {
                    user: this.teams[0].user,
                    score: score1
                  }
                ]
              },
              metadata: stats
            }
          }),
          prisma.match.create({
            data: {
              mode: 'ARENA',
              points: -(pts - 5),
              profileId: profile1.id,
              winner: false,
              teams: {
                create: [
                  {
                    user: this.teams[0].user,
                    score: score1
                  },
                  {
                    user: this.teams[1].user,
                    score: score2
                  }
                ]
              },
              metadata: stats
            }
          }),
          prisma.profile.update({
            where: {
              id: profile2.id
            },
            data: {
              arenaWins: {
                increment: 1
              },
              rankRating: {
                increment: pts
              },
              fates: {
                increment: 35
              }
            }
          }),
          prisma.profile.update({
            where: {
              id: profile1.id
            },
            data: {
              arenaDefeats: {
                increment: 1
              },
              rankRating: profile1.rankRating
            }
          })
        ])
      }
    }

    return this
  }

  private async firstStep(duels: number) {
    const kills: KillEvent[] = []
    const summary: string[] = []

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

    const playersAlive1 = this.teams[0].roster.filter(p => p.life > 0).length > 0
    const playersAlive2 = this.teams[1].roster.filter(p => p.life > 0).length > 0

    if (!playersAlive1 || !playersAlive2) {
      const winningTeam = playersAlive1 ? 0 : 1

      this.rounds.push({
        winning_team: winningTeam,
        kills,
        win_type: 'ELIMINATION',
        summary
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

        return await this.secondStep(true, bombSite)
      } else {
        return await this.secondStep()
      }
    }
  }

  private async secondStep(bombPlanted?: boolean, site?: string) {
    const kills: KillEvent[] = []
    const summary: string[] = []

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

      const winning_team = this.teams[0].roster.filter(p => p.life > 0).length > 0 ? 0 : 1

      this.rounds.push({
        kills,
        win_type,
        winning_team,
        bomb_planted: bombPlanted,
        site,
        summary
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

      const winning_team = this.teams.findIndex(t => t.side === 'ATTACK')

      this.rounds.push({
        kills,
        win_type,
        winning_team,
        bomb_planted: bombPlanted,
        site,
        summary
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

      const winning_team = this.teams.findIndex(t => t.side === 'DEFENSE')

      this.rounds.push({
        kills,
        win_type,
        winning_team,
        bomb_defused: true,
        bomb_planted: bombPlanted,
        site,
        summary
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

      const winning_team = this.teams.findIndex(t => t.side === 'DEFENSE')

      this.rounds.push({
        kills,
        win_type,
        winning_team,
        bomb_planted: bombPlanted,
        site,
        summary
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
      if (player2?.weapon.primary?.magazine && player2!.weapon.primary.magazine > 0) {
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

    if (player1?.weapon.primary?.magazine && player1.weapon.primary.magazine > 0) {
      nextShot1 = player1.weapon.primary.rate_fire
      weapon1 = player1.weapon.primary.name!
    } else if (player1.weapon.secondary.magazine && player1.weapon.secondary.magazine > 0) {
      nextShot1 = player1.weapon.secondary.rate_fire
      weapon1 = player1.weapon.secondary.name!
    } else {
      nextShot1 = player1.weapon.melee.rate_fire
      weapon1 = 'Melee'
    }

    if (player2?.weapon.primary?.magazine && player2.weapon.primary.magazine > 0) {
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
