import { ProfileSchema } from '@db'
import { ApplicationCommandOptionType } from 'discord.js'
import { valorant_maps } from '../../config'
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
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'unranked',
      description: 'Start a unranked duel',
      descriptionLocalizations: {
        'pt-BR': 'Inicia um confronto sem classificação'
      },
      options: [
        {
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
      ]
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'ranked',
      description: 'Start a ranked duel',
      descriptionLocalizations: {
        'pt-BR': 'Inicia um confronto ranqueado'
      },
      options: [
        {
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
      ]
    },
    {
      type: ApplicationCommandOptionType.SubcommandGroup,
      name: 'swiftplay',
      nameLocalizations: {
        'pt-BR': 'frenético'
      },
      description: 'Start a swiftplay duel',
      descriptionLocalizations: {
        'pt-BR': 'Inicia um confronto frenético'
      },
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'unranked',
          description: 'Start a unranked swiftplay duel',
          descriptionLocalizations: {
            'pt-BR': 'Inicia um confronto frenético sem classificação'
          },
          options: [
            {
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
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'ranked',
          description: 'Start a ranked swiftplay duel',
          descriptionLocalizations: {
            'pt-BR': 'Inicia um confronto frenético ranqueado'
          },
          options: [
            {
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
          ]
        }
      ]
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'tournament',
      nameLocalizations: {
        'pt-BR': 'torneio'
      },
      description: 'Start a tournament duel',
      descriptionLocalizations: {
        'pt-BR': 'Inicia um confronto em torneio'
      },
      options: [
        {
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
        {
          type: ApplicationCommandOptionType.String,
          name: 'map',
          nameLocalizations: {
            'pt-BR': 'mapa'
          },
          description: 'Select the map',
          descriptionLocalizations: {
            'pt-BR': 'Selecione o mapa'
          },
          choices: valorant_maps
            .filter(m => m.current_map_pool)
            .map(m => ({
              name: m.name,
              value: m.name
            })),
          required: true
        }
      ]
    }
  ],
  async run({ ctx, t, app }) {
    let id: string

    if (ctx.args.length === 2) {
      id = ctx.args[1].toString()
    } else if (ctx.args.length === 3 && ctx.args[0] === 'tournament') {
      id = ctx.args[1].toString()
    } else id = ctx.args[2].toString()

    const profile = await ProfileSchema.fetch(id, ctx.db.guild.id)

    const authorCounts: { [key: string]: number } = {}
    const userCounts: { [key: string]: number } = {}

    for (const p of ctx.db.profile.active_players) {
      authorCounts[p] = (authorCounts[p] || 0) + 1
    }

    const authorDuplicates = Object.values(authorCounts).filter(count => count > 1).length

    const keys = await app.redis.keys(`agent_selection:${ctx.db.guild.id}*`)

    if (!ctx.db.profile.team_name || !ctx.db.profile.team_tag) {
      return await ctx.reply('commands.duel.needed_team_name')
    }

    if (ctx.db.profile.active_players.length < 5) {
      return await ctx.reply('commands.duel.team_not_completed_1')
    }

    if (authorDuplicates) {
      return await ctx.reply('commands.duel.duplicated_cards')
    }

    if (!profile || profile.active_players.length < 5) {
      return await ctx.reply('commands.duel.team_not_completed_2')
    }

    if (!profile.team_name || !profile.team_tag) {
      return await ctx.reply('commands.duel.needed_team_name_2')
    }

    if (
      (await app.redis.get(`match:${ctx.db.guild.id}:${ctx.interaction.user.id}`)) ||
      keys.some(key => key.includes(ctx.interaction.user.id))
    ) {
      return await ctx.reply('commands.duel.already_in_match')
    }

    if (
      (await app.redis.get(`match:${ctx.db.guild.id}:${profile.userId}`)) ||
      keys.some(key => key.includes(profile.userId))
    ) {
      return await ctx.reply('commands.duel.already_in_match_2')
    }

    if (ctx.args.at(-1) === ctx.interaction.user.id) {
      return await ctx.reply('commands.duel.cannot_duel')
    }

    for (const p of profile.active_players) {
      userCounts[p] = (userCounts[p] || 0) + 1
    }

    const userDuplicates = Object.values(userCounts).filter(count => count > 1).length

    if (userDuplicates) {
      return await ctx.reply('commands.duel.duplicated_cards2')
    }

    let mode: string
    let map = ''

    if (ctx.args.length === 2) {
      mode = ctx.args.slice(0, 1).join(';')
      id = ctx.args[1].toString()
    } else if (ctx.args.length === 3 && ctx.args[0] === 'tournament') {
      mode = ctx.args.slice(0, 1).join(';')
      id = ctx.args[1].toString()
      map = `;${ctx.args[2].toString()}`
    } else {
      mode = ctx.args.slice(0, 2).join(';')
      id = ctx.args[2].toString()
    }

    const button = new ButtonBuilder()
      .defineStyle('green')
      .setLabel(t('commands.duel.button'))
      .setCustomId(`accept;${id};${ctx.interaction.user.id};${mode}${map}`)

    await ctx.reply(
      button.build(
        t('commands.duel.request', {
          author: ctx.interaction.user.toString(),
          opponent: `<@${id}>`,
          mode: t(`commands.duel.mode.${mode}`)
        })
      )
    )
  }
})
