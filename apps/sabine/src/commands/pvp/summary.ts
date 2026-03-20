import { Prisma } from '@generated'
import { valorantAgents } from '@sabinelab/utils'
import { ApplicationCommandOptionType } from 'discord.js'
import EmbedBuilder from '../../structures/builders/EmbedBuilder'
import createCommand from '../../structures/command/createCommand'

type Stats = {
  id: string
  kills: number
  deaths: number
  agent: string
  ovr: number
  name: string
}

type MetadataTeam = {
  name: string
  user: string
}
type Metadata = {
  map: string
  stats: Stats[]
  teams: MetadataTeam[]
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
  syntax: 'summary [seed]',
  examples: ['summary 123456789'],
  args: {
    seed: {
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
  },
  async run({ ctx }) {
    const match = await ctx.app.prisma.match.findFirst({
      where: {
        id: BigInt(ctx.args.seed),
        metadata: { not: Prisma.DbNull },
        profile: {
          userId: ctx.db.profile.userId,
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
      .setTitle(
        ctx.t('commands.summary.embed.title', {
          mode: ctx.t(`commands.career.mode.${match.mode}`)
        })
      )
      .setDesc(
        `### <@${match.teams[0].user}> ${
          summary.teams.find(t => t.user === match.teams[0].user)?.name
        } ${match.teams[0].score} <:versus:1349105624180330516> ${match.teams[1].score} ${
          summary.teams.find(t => t.user === match.teams[1].user)?.name
        } <@${match.teams[1].user}>\n`
      )
      .setFields(
        {
          name: summary.teams[0].name,
          value: summary.stats
            .slice(0, 5)
            .map(p => {
              return `${valorantAgents.find(a => a.name === p.agent)?.emoji} ${p.name} (${Math.floor(p.ovr)}) — \`${p.kills}/${p.deaths}\``
            })
            .join('\n'),
          inline: true
        },
        {
          name: summary.teams[1].name,
          value: summary.stats
            .slice(-5)
            .map(p => {
              return `${valorantAgents.find(a => a.name === p.agent)?.emoji} ${p.name} (${Math.floor(p.ovr)}) — \`${p.kills}/${p.deaths}\``
            })
            .join('\n'),
          inline: true
        }
      )
      .setImage(summary.map)

    await ctx.reply(embed.build())
  }
})
