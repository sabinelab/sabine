import ms from 'humanize-duration'
import ButtonBuilder from '@/structures/builders/ButtonBuilder'
import EmbedBuilder from '@/structures/builders/EmbedBuilder'
import createCommand from '@/structures/command/createCommand'
import pkg from '../../../package.json'

export default createCommand({
  name: 'info',
  category: 'misc',
  description: 'Shows the bot info',
  descriptionLocalizations: {
    'pt-BR': 'Mostra as informações do bot'
  },
  syntax: 'info',
  examples: ['info'],
  isThinking: true,
  async run({ ctx, app, t }) {
    const [creator, guildsCount, usersCount] = await Promise.all([
      app.getUser('441932495693414410'),
      app.shard?.fetchClientValues('guilds.cache.size') as Promise<number[] | undefined>,
      app.shard?.broadcastEval(a => a.users.cache.filter(u => !u.bot).size) as Promise<
        number[] | undefined
      >
    ])

    const totalUsers = usersCount?.reduce((sum, count) => sum + count, 0) ?? 0
    const totalGuilds = guildsCount?.reduce((sum, count) => sum + count, 0) ?? 0

    const embed = new EmbedBuilder()
      .setAuthor({
        name: app.user!.username,
        iconURL: app.user!.displayAvatarURL({ size: 2048 })
      })
      .setThumb(creator.displayAvatarURL({ size: 2048 }))
      .setTitle(t('commands.info.embed.title'))
      .setFields(
        {
          name: 'Patch',
          value: `[${pkg.version}](https://sabinebot.xyz/changelog/v${pkg.version})`,
          inline: true
        },
        {
          name: t('commands.info.lib'),
          value: '[discord.js](https://discord.js.org/)',
          inline: true
        },
        {
          name: t('commands.info.creator'),
          value: creator.tag,
          inline: true
        },
        {
          name: t('commands.info.guilds'),
          value: totalGuilds.toLocaleString(),
          inline: true
        },
        {
          name: t('commands.info.users'),
          value: totalUsers.toLocaleString(),
          inline: true
        },
        {
          name: 'App',
          value: `Shards: \`${app.shard?.count}\`\nShard ID: \`${ctx.guild?.shard.id}\`\nUptime: \`${ms(
            app.uptime ?? 0,
            {
              language: ctx.db.profile.lang ?? ctx.db.guild!.lang,
              round: true
            }
          )}\``,
          inline: true
        }
      )

    await ctx.reply(
      embed.build({
        components: [
          {
            type: 1,
            components: [
              new ButtonBuilder()
                .setLabel(t('commands.help.community'))
                .defineStyle('link')
                .setURL('https://discord.gg/g5nmc376yh'),
              new ButtonBuilder()
                .setLabel(t('commands.info.invite'))
                .defineStyle('link')
                .setURL(
                  'https://discord.com/oauth2/authorize?app_id=1235576817683922954&scope=bot&permissions=388096'
                )
            ]
          }
        ]
      })
    )
  }
})
