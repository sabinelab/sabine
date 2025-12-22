import { valorant_weapons } from '../../config'

type WeaponDamage = {
  head: number
  chest: number
}

type Weapon = {
  name?: string
  damage: WeaponDamage
  magazine?: number
  rate_fire: number
}

export type PlayerWeapon = {
  primary?: Weapon
  secondary?: Weapon
  melee: Weapon
}

type PlayerStats = {
  aim: number
  HS: number
  movement: number
  aggression: number
  ACS: number
  gamesense: number
  ovr: number
}

type PlayerOptions = {
  id: number
  name: string
  life: number
  credits: number
  weapon: PlayerWeapon
  stats: PlayerStats
  teamCredits: number
  rounds: number
}

export default class Player {
  public id: number
  public name: string
  public life: number
  public credits: number
  public weapon: PlayerWeapon
  public stats: PlayerStats
  public teamCredits: number
  public rounds: number

  public constructor(options: PlayerOptions) {
    this.id = options.id
    this.name = options.name
    this.life = options.life
    this.credits = options.teamCredits
    this.weapon = options.weapon
    this.stats = options.stats
    this.teamCredits = options.teamCredits
    this.rounds = options.rounds
  }

  public buy() {
    if (this.teamCredits >= 2500 && !this.weapon.primary) {
      let primary = valorant_weapons.filter(w => w.price > 800 && w.price + 1000 <= this.credits)

      let secondary = valorant_weapons.filter(w => w.price > 0 && w.price <= 800 && w.price + 1000 <= this.credits)

      if (!primary.length) {
        primary = valorant_weapons.filter(w => w.price > 800 && w.price + 400 <= this.credits)
      }

      if (!secondary.length) {
        secondary = valorant_weapons.filter(w => w.price > 0 && w.price <= 800 && w.price + 400 <= this.credits)
      }

      let weapon: (typeof valorant_weapons)[number]

      if (this.rounds >= 24) {
        weapon = this.chooseWeapon(
          primary.filter(w => w.price >= 2900),
          w => w.damage.head ** 3
        )
      } else {
        weapon = this.chooseWeapon(primary, w => w.damage.head ** 3)
      }

      const secondaryWeapon = this.chooseWeapon(secondary, w => w.price)

      this.credits -= weapon.price

      this.weapon.primary = {
        ...weapon
      }

      if (this.credits >= secondaryWeapon.price) {
        this.credits -= secondaryWeapon.price

        this.weapon.secondary = {
          ...secondaryWeapon
        }
      }

      if (this.credits >= 1000) {
        this.credits -= 1000
        this.life = 150
      } else if (this.credits >= 400) {
        this.credits -= 400
        this.life = 125
      }
    } else if (this.teamCredits === 800) {
      const secondary = valorant_weapons.filter(w => w.price <= 800 && w.name !== 'Melee')

      const weapon = this.chooseWeapon(secondary, w => w.price * 5)

      this.credits -= weapon.price

      this.weapon.secondary = {
        ...weapon
      }

      if (this.credits >= 400) {
        this.life = 125
        this.credits -= 400
      }
    } else {
      const secondary = valorant_weapons.filter(w => w.price <= 800 && w.name !== 'Melee')

      const weapon = this.chooseWeapon(secondary, w => w.price * 5)

      if (this.credits - weapon.price + 1900 < 2650) {
        return this
      }

      this.credits -= weapon.price

      this.weapon.secondary = {
        ...weapon
      }

      if (this.credits >= 400 && this.credits - 400 >= 2650) {
        this.life = 125
        this.credits -= 400
      }
    }

    return this
  }
  private chooseWeapon<T>(items: T[], weightFun: (item: T) => number) {
    const weight = items.reduce((sum, i) => sum + weightFun(i), 0)

    let random = Math.random() * weight

    for (const item of items) {
      random -= weightFun(item)

      if (random <= 0) {
        return item
      }
    }

    return items[items.length - 1]
  }
  private chooseShoot(mov: number) {
    let steepness = 0.12
    let midpoint = 70
    let prob = (1 / (1 + Math.exp(-steepness * (this.stats.aim - midpoint)))) * (1 - (mov / 100) * 0.2)
    let random = Math.random()

    if (random <= prob) {
      steepness = 0.02
      midpoint = 75
      prob = 1 / (1 + Math.exp(-steepness * (this.stats.HS - midpoint)))
      random = Math.random()

      if (random <= prob) {
        return 'head'
      } else return 'chest'
    }

    return 'none'
  }
  public shoot(mov: number) {
    if (this.weapon.primary?.magazine && this.weapon.primary.magazine > 0) {
      this.weapon.primary.magazine -= 1

      const choice = this.chooseShoot(mov)

      if (choice === 'head') {
        return [this.weapon.primary.damage.head, this.weapon.primary.rate_fire]
      } else if (choice === 'chest') {
        return [this.weapon.primary.damage.chest, this.weapon.primary.rate_fire]
      } else {
        return [0, this.weapon.primary.rate_fire]
      }
    } else if (this.weapon.secondary!.magazine && this.weapon.secondary!.magazine > 0) {
      this.weapon.secondary!.magazine -= 1

      const choice = this.chooseShoot(mov)

      if (choice === 'head') {
        return [this.weapon.secondary!.damage.head, this.weapon.secondary!.rate_fire]
      } else if (choice === 'chest') {
        return [this.weapon.secondary!.damage.chest, this.weapon.secondary!.rate_fire]
      } else {
        return [0, this.weapon.secondary!.rate_fire]
      }
    } else {
      const choice = this.chooseShoot(mov)

      if (choice === 'head') {
        return [this.weapon.melee.damage.head, this.weapon.melee.rate_fire]
      } else if (choice === 'chest') {
        return [this.weapon.melee.damage.chest, this.weapon.melee.rate_fire]
      } else {
        return [0, this.weapon.melee.rate_fire]
      }
    }
  }
}
