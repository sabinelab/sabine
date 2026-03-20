import type { Collection, TextChannel } from 'discord.js'
import { env } from '@/env'
import createListener from '@/structures/app/createListener'
import Logger from '@/util/Logger'

export default createListener({
  name: 'clientReady',
  async run(app) {
    Logger.info(`${app.user?.tag} online!`)

    await app.postCommands()

    const removeUserFromBlacklist = async () => {
      const blacklist = await app.prisma.blacklist.findMany({
        where: {
          endsAt: {
            not: null
          },
          type: 'USER'
        }
      })

      if (!blacklist.length) return

      for (const user of blacklist) {
        if (!user.endsAt) continue

        if (user.endsAt < new Date()) {
          await app.prisma.blacklist.delete({
            where: {
              id: user.id,
              type: 'USER'
            }
          })

          const channel = app.channels.cache.get('1237496064580386917') as TextChannel

          await channel.send({
            content: `[Auto] - \`${(await app.users.fetch(user.id)).tag}\` (\`${user.id}\`) has been unbanned from the bot.`
          })
        }
      }
    }
    const removeGuildFromBlacklist = async () => {
      const blacklist = await app.prisma.blacklist.findMany({
        where: {
          endsAt: {
            not: null
          },
          type: 'GUILD'
        }
      })

      if (!blacklist.length) return

      for (const guild of blacklist) {
        if (!guild.endsAt) continue

        if (guild.endsAt < new Date()) {
          await app.prisma.blacklist.delete({
            where: {
              id: guild.id,
              type: 'GUILD'
            }
          })

          const channel = app.channels.cache.get('1237496064580386917') as TextChannel

          await channel.send({
            content: `[Auto] - \`${guild.id}\` has been unbanned from the bot.`
          })
        }
      }
    }

    const removePremium = async () => {
      const users = await app.prisma.user.findMany({
        include: {
          premium: true
        }
      })

      if (!users.length) return

      for (const user of users) {
        if (!user.premium) continue
        if (user.premium.expiresAt > new Date()) continue

        const member = app.guilds.cache.get('1233965003850125433')!.members.cache.get(user.id)

        if (member) {
          await member.roles.remove('1314272663316856863')

          member.user
            .createDM()
            .then(dm =>
              dm.send({
                content:
                  'Your premium has expired! If you want to renew your premium, go to https://canary.discord.com/channels/1233965003850125433/1313902950426345492 and select a premium!'
              })
            )
            .catch()
        }

        await app.prisma.user.update({
          where: {
            id: user.id
          },
          data: {
            premium: {
              delete: {
                userId: user.id
              }
            },
            warned: false
          }
        })
      }
    }
    const sendPremiumWarn = async () => {
      const users = await app.prisma.user.findMany({
        include: {
          premium: true
        }
      })

      for (const user of users) {
        if (user.warned) continue
        if (!user.premium) continue

        const member = app.guilds.cache.get('1233965003850125433')!.members.cache.get(user.id)

        if (user.premium.expiresAt.getTime() - Date.now() <= 2.592e8) {
          if (member) {
            member.user
              .createDM()
              .then(dm =>
                dm.send({
                  content: `Your premium will expires <t:${(user.premium!.expiresAt.getTime() / 1000).toFixed(0)}:R>! If you want to renew your premium, go to https://canary.discord.com/channels/1233965003850125433/1313902950426345492 and select a premium!`
                })
              )
              .catch(() => {})
          }
        }

        await app.prisma.user.update({
          where: {
            id: user.id
          },
          data: {
            warned: true
          }
        })
      }
    }
    const deleteInactiveThreads = async () => {
      const guild = app.guilds.cache.get('1233965003850125433')!
      const channels = guild.channels.cache.filter(c =>
        ['1313902950426345492', '1313588710637568030'].includes(c.id)
      ) as Collection<string, TextChannel>

      for (const channel of channels.values()) {
        const threads = channel.threads.cache.filter(
          t => Date.now() - new Date(t.createdAt ?? '').getTime() >= 1000 * 60 * 45
        )

        for (const thread of threads.values()) await thread.delete()
      }
    }

    const deleteKeys = async () => {
      const keysToDelete = await app.prisma.key.findMany({
        where: {
          expiresAt: {
            lte: new Date()
          },
          type: 'PREMIUM'
        },
        select: {
          id: true
        }
      })

      if (!keysToDelete.length) return

      await app.prisma.$transaction([
        app.prisma.guildKey.deleteMany({
          where: {
            keyId: {
              in: keysToDelete.map(key => key.id)
            }
          }
        }),
        app.prisma.key.deleteMany({
          where: {
            id: {
              in: keysToDelete.map(key => key.id)
            }
          }
        })
      ])
    }

    const verifyKeyBooster = async () => {
      const keys = await app.prisma.key.findMany({
        where: {
          type: 'BOOSTER'
        }
      })

      if (!keys.length) return

      const keysToDelete: string[] = []

      for (const key of keys) {
        const member = app.guilds.cache.get('1233965003850125433')!.members.cache.get(key.user)
        if (!member || (member && !member.premiumSince)) {
          keysToDelete.push(key.id)
        }
      }

      if (!keysToDelete.length) return

      await app.prisma.$transaction([
        app.prisma.guildKey.deleteMany({
          where: {
            keyId: {
              in: keysToDelete
            }
          }
        }),
        app.prisma.key.deleteMany({
          where: {
            id: {
              in: keysToDelete
            }
          }
        })
      ])
    }
    const verifyPartners = async () => {
      const channel = app.channels.cache.get('1346170715165950086') as TextChannel
      const message = channel.messages.cache.find(m => m.author.id === app.user?.id)

      if (!message) {
        const guilds = await app.prisma.guild.findMany({
          where: {
            partner: true,
            invite: {
              not: null
            }
          }
        })

        if (!guilds.length) return

        let content = '## Our official Partners\n'

        for (const guild of guilds) {
          content += `- ${guild.invite}\n`
        }

        await channel.send({ content })
      } else {
        const guilds = await app.prisma.guild.findMany({
          where: {
            partner: true,
            invite: {
              not: null
            }
          }
        })

        let content = '## Our official Partners\n'

        for (const guild of guilds) {
          content += `- ${guild.invite}\n`
        }

        await message.edit({ content })
      }
    }

    const runTasks = async () => {
      await deleteKeys().catch(e => new Logger(app).error(e))
      await verifyKeyBooster().catch(e => new Logger(app).error(e))
      await deleteInactiveThreads().catch(e => new Logger(app).error(e))
      await sendPremiumWarn().catch(e => new Logger(app).error(e))
      await removePremium().catch(e => new Logger(app).error(e))
      await removeUserFromBlacklist().catch(e => new Logger(app).error(e))
      await removeGuildFromBlacklist().catch(e => new Logger(app).error(e))
      await verifyPartners().catch(e => new Logger(app).error(e))
      setTimeout(runTasks, env.INTERVAL ?? 60 * 1000)
    }

    await runTasks()
  }
})
