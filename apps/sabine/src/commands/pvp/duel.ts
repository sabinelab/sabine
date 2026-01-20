import { ProfileSchema } from '@db'
import { valorantMaps } from '@sabinelab/utils'
import { ApplicationCommandOptionType } from 'discord.js'
import ButtonBuilder from '../../structures/builders/ButtonBuilder'
import createCommand from '../../structures/command/createCommand'

export default createCommand({
  name: 'duel',
  nameLocalizations: {
    'pt-BR': 'confronto'
  },
  category: 'economy',
  description: 'Start a duel with someone',
  descriptionLocalizations: {
    'pt-BR': 'Inicia um confronto com alguém'
  },
  args: {
    unranked: {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'unranked',
      nameLocalizations: {
        'pt-BR': 'sem-classificação'
      },
      description: 'Start a unranked duel',
      descriptionLocalizations: {
        'pt-BR': 'Inicia um confronto sem classificação'
      },
      args: {
        user: {
          type: ApplicationCommandOptionType.User,
          name: 'user',
          nameLocalizations: {
            'pt-BR': 'usuário'
          },
          description: 'Provide a user',
          descriptionLocalizations: {
            'pt-BR': 'Informe o usuário'
          },
          required: true
        }
      }
    },
    ranked: {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'ranked',
      nameLocalizations: {
        'pt-BR': 'ranqueado'
      },
      description: 'Start a ranked duel',
      descriptionLocalizations: {
        'pt-BR': 'Inicia um confronto ranqueado'
      },
      args: {
        user: {
          type: ApplicationCommandOptionType.User,
          name: 'user',
          nameLocalizations: {
            'pt-BR': 'usuário'
          },
          description: 'Provide a user',
          descriptionLocalizations: {
            'pt-BR': 'Informe o usuário'
          },
          required: true
        }
      }
    },
    swiftplay: {
      type: ApplicationCommandOptionType.SubcommandGroup,
      name: 'swiftplay',
      nameLocalizations: {
        'pt-BR': 'frenético'
      },
      description: 'Start a swiftplay duel',
      descriptionLocalizations: {
        'pt-BR': 'Inicia um confronto frenético'
      },
      args: {
        unranked: {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'unranked',
          nameLocalizations: {
            'pt-BR': 'sem-classificação'
          },
          description: 'Start a unranked swiftplay duel',
          descriptionLocalizations: {
            'pt-BR': 'Inicia um confronto frenético sem classificação'
          },
          args: {
            user: {
              type: ApplicationCommandOptionType.User,
              name: 'user',
              nameLocalizations: {
                'pt-BR': 'usuário'
              },
              description: 'Provide a user',
              descriptionLocalizations: {
                'pt-BR': 'Informe o usuário'
              },
              required: true
            }
          }
        },
        ranked: {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'ranked',
          nameLocalizations: {
            'pt-BR': 'ranqueado'
          },
          description: 'Start a ranked swiftplay duel',
          descriptionLocalizations: {
            'pt-BR': 'Inicia um confronto frenético ranqueado'
          },
          args: {
            user: {
              type: ApplicationCommandOptionType.User,
              name: 'user',
              nameLocalizations: {
                'pt-BR': 'usuário'
              },
              description: 'Provide a user',
              descriptionLocalizations: {
                'pt-BR': 'Informe o usuário'
              },
              required: true
            }
          }
        }
      }
    },
    tournament: {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'tournament',
      nameLocalizations: {
        'pt-BR': 'torneio'
      },
      description: 'Start a tournament duel',
      descriptionLocalizations: {
        'pt-BR': 'Inicia um confronto em torneio'
      },
      args: {
        user: {
          type: ApplicationCommandOptionType.User,
          name: 'user',
          nameLocalizations: {
            'pt-BR': 'usuário'
          },
          description: 'Provide a user',
          descriptionLocalizations: {
            'pt-BR': 'Informe o usuário'
          },
          required: true
        },
        map: {
          type: ApplicationCommandOptionType.String,
          name: 'map',
          nameLocalizations: {
            'pt-BR': 'mapa'
          },
          description: 'Select the map',
          descriptionLocalizations: {
            'pt-BR': 'Selecione o mapa'
          },
          choices: valorantMaps
            .filter(m => m.current_map_pool)
            .map(m => ({
              name: m.name,
              value: m.name
            })),
          required: true
        }
      }
    }
  },
  async run({ ctx, t, app }) {
    let id: string
    let mode: string
    let map = ''

    if (ctx.args.unranked) {
      mode = 'unranked'
      id = ctx.args.unranked.user.id
    } else if (ctx.args.ranked) {
      mode = 'ranked'
      id = ctx.args.ranked.user.id
    } else if (ctx.args.swiftplay?.unranked) {
      mode = 'swiftplay;unranked'
      id = ctx.args.swiftplay.unranked.user.id
    } else if (ctx.args.swiftplay?.ranked) {
      mode = 'swiftplay;ranked'
      id = ctx.args.swiftplay.ranked.user.id
    } else if (ctx.args.tournament) {
      mode = 'tournament'
      id = ctx.args.tournament.user.id
      map = `;${ctx.args.tournament.map}`
    } else return

    const profile = await ProfileSchema.fetch(id, ctx.db.guild.id)
    if (!profile) {
      return await ctx.reply('commands.duel.team_not_completed_2')
    }

    const [userCards, authorCards] = await Promise.all([
      ctx.app.prisma.card.findMany({
        where: {
          profileId: profile.id,
          activeRoster: true
        }
      }),
      ctx.app.prisma.card.findMany({
        where: {
          profileId: ctx.db.profile.id,
          activeRoster: true
        }
      })
    ])

    const keys = await app.redis.keys(`agent_selection:${ctx.db.guild.id}*`)

    const authorCounts: { [key: string]: number } = {}
    const userCounts: { [key: string]: number } = {}
    const authorDuplicates = Object.values(authorCounts).filter(count => count > 1).length

    for (const c of authorCards) {
      authorCounts[c.playerId] = (authorCounts[c.playerId] || 0) + 1
    }

    if (!ctx.db.profile.teamName || !ctx.db.profile.teamTag) {
      return await ctx.reply('commands.duel.needed_team_name')
    }

    if (authorCards.length < 5) {
      return await ctx.reply('commands.duel.team_not_completed_1')
    }

    if (authorDuplicates) {
      return await ctx.reply('commands.duel.duplicated_cards')
    }

    if (userCards.length < 5) {
      return await ctx.reply('commands.duel.team_not_completed_2')
    }

    if (!profile.teamName || !profile.teamTag) {
      return await ctx.reply('commands.duel.needed_team_name_2')
    }

    if (
      (await app.redis.get(`match:${ctx.db.guild.id}:${ctx.author.id}`)) ||
      keys.some(key => key.includes(ctx.author.id))
    ) {
      return await ctx.reply('commands.duel.already_in_match')
    }

    if (
      (await app.redis.get(`match:${ctx.db.guild.id}:${profile.userId}`)) ||
      keys.some(key => key.includes(profile.userId))
    ) {
      return await ctx.reply('commands.duel.already_in_match_2')
    }

    if (id === ctx.author.id) {
      return await ctx.reply('commands.duel.cannot_duel')
    }

    for (const c of userCards) {
      userCounts[c.playerId] = (userCounts[c.playerId] || 0) + 1
    }

    const userDuplicates = Object.values(userCounts).filter(count => count > 1).length

    if (userDuplicates) {
      return await ctx.reply('commands.duel.duplicated_cards2')
    }

    const button = new ButtonBuilder()
      .defineStyle('green')
      .setLabel(t('commands.duel.button'))
      .setCustomId(`accept;${id};${ctx.author.id};${mode}${map}`)

    await ctx.reply(
      button.build(
        t('commands.duel.request', {
          author: ctx.author.toString(),
          opponent: `<@${id}>`,
          mode: t(`commands.duel.mode.${mode}`)
        })
      )
    )
  }
})
