import { Prisma } from '@generated'
import { ApplicationCommandOptionType } from 'discord.js'
import { valorant_agents } from '../../config'
import EmbedBuilder from '../../structures/builders/EmbedBuilder'
import createCommand from '../../structures/command/createCommand'

type Stats = {
  id: string
  kills: number
  deaths: number
  agent: string
}

type Metadata = {
  map: string
  stats: Stats[]
  teams: string[]
}

export default createCommand({
  name: 'summary',
  nameLocalizations: {
    'pt-BR': 'resumo'
  },
  description: 'View a match summary',
  descriptionLocalizations: {
    'pt-BR': 'Veja o resumo de uma partida'
  },
  category: 'pvp',
  options: [
    {
      type: ApplicationCommandOptionType.Integer,
      name: 'seed',
      nameLocalizations: {
        'pt-BR': 'semente'
      },
      description: 'Insert the seed',
      descriptionLocalizations: {
        'pt-BR': 'Insira a semente'
      },
      required: true
    }
  ],
  async run({ ctx }) {
    const match = await ctx.app.prisma.match.findFirst({
      where: {
        id: BigInt(ctx.args[0]),
        metadata: { not: Prisma.DbNull },
        profile: {
          userId: ctx.db.profile.id,
          guildId: ctx.db.guild.id
        }
      },
      include: {
        teams: true
      },
      omit: {
        when: true,
        points: true,
        winner: true
      }
    })

    if (!match) {
      return await ctx.reply('commands.summary.match_not_found')
    }

    const summary = match.metadata as Metadata

    const embed = new EmbedBuilder()
      .setTitle(ctx.t('commands.summary.embed.title'))
      .setDesc(
        `### <@${match.teams[0].user}> ${match.teams[0].score} <:versus:1349105624180330516> ${match.teams[1].score} <@${match.teams[1].user}>\n`
      )
      .setFields(
        {
          name: summary.teams[0],
          value: summary.stats
            .slice(0, 5)
            .map(p => {
              const player = ctx.app.players.get(p.id)

              if (!player) return false

              return `${valorant_agents.find(a => a.name === p.agent)?.emoji} ${player.name} (${Math.floor(player.ovr)}) — \`${p.kills}/${p.deaths}\``
            })
            .join('\n'),
          inline: true
        },
        {
          name: summary.teams[1],
          value: summary.stats
            .slice(-5)
            .map(p => {
              const player = ctx.app.players.get(p.id)

              if (!player) return false

              return `${valorant_agents.find(a => a.name === p.agent)?.emoji} ${player.name} (${Math.floor(player.ovr)}) — \`${p.kills}/${p.deaths}\``
            })
            .join('\n'),
          inline: true
        }
      )
      .setImage(summary.map)

    await ctx.reply(embed.build())
  }
})
