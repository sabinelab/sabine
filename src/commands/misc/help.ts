import fs from 'node:fs'
import path from 'node:path'
import translate from '@iamtraction/google-translate'
import ButtonBuilder from '../../structures/builders/ButtonBuilder'
import EmbedBuilder from '../../structures/builders/EmbedBuilder'
import createCommand from '../../structures/command/createCommand'

const raw: {
  [key: string]: any
} = {
  pt: JSON.parse(fs.readFileSync(path.resolve('src/i18n/pt.json'), 'utf-8')),
  en: JSON.parse(fs.readFileSync(path.resolve('src/i18n/en.json'), 'utf-8')),
  es: JSON.parse(fs.readFileSync(path.resolve('src/i18n/es.json'), 'utf-8'))
}

export default createCommand({
  name: 'help',
  category: 'misc',
  nameLocalizations: {
    'pt-BR': 'ajuda'
  },
  description: 'List of commands',
  descriptionLocalizations: {
    'pt-BR': 'Lista de comandos'
  },
  options: [
    {
      type: 3,
      name: 'command',
      nameLocalizations: {
        'pt-BR': 'comando'
      },
      description: 'Select the command',
      descriptionLocalizations: {
        'pt-BR': 'Selecione o comando'
      },
      autocomplete: true
    }
  ],
  syntax: 'help <command>',
  examples: ['help', 'help ping', 'help team', 'help player'],
  userInstall: true,
  async run({ ctx, app, t }) {
    if (ctx.args[0]?.toString()) {
      const cmd = app.commands.get(ctx.args[0].toString())

      if (!cmd || cmd.onlyDev) {
        return await ctx.reply('commands.help.command_not_found')
      }

      const { permissions } = raw[ctx.locale]

      const embed = new EmbedBuilder()
        .setTitle(ctx.args[0].toString())
        .setDesc(
          (
            await translate(cmd.description, {
              to: ctx.db.guild!.lang
            })
          ).text
        )
        .addField(t('commands.help.name'), `\`${cmd.name}\``)
        .setFooter({ text: t('commands.help.footer') })
        .setThumb(app.user!.displayAvatarURL({ size: 2048 }))

      if (cmd.syntax) embed.addField(t('commands.help.syntax'), `\`/${cmd.syntax}\``)
      if (cmd.syntaxes)
        embed.addField(t('commands.help.syntax'), cmd.syntaxes.map(syntax => `\`/${syntax}\``).join('\n'))
      if (cmd.examples) embed.addField(t('commands.help.examples'), cmd.examples.map(ex => `\`/${ex}\``).join('\n'))
      if (cmd.permissions)
        embed.addField(
          t('commands.help.permissions'),
          cmd.permissions.map(perm => `\`${permissions[perm.toString()]}\``).join(', '),
          true
        )
      if (cmd.botPermissions)
        embed.addField(
          t('commands.help.bot_permissions'),
          cmd.botPermissions.map(perm => `\`${permissions[perm.toString()]}\``).join(', '),
          true
        )

      return await ctx.reply(embed.build())
    }

    const embed = new EmbedBuilder().setThumb(app.user!.displayAvatarURL({ size: 2048 })).setFields(
      {
        name: t('commands.help.support.title'),
        value: t('commands.help.support.desc')
      },
      {
        name: t('commands.help.get.title'),
        value: t('commands.help.get.desc')
      }
    )

    const button = new ButtonBuilder()
      .setLabel(t('commands.help.community'))
      .defineStyle('link')
      .setURL('https://discord.gg/g5nmc376yh')

    const terms = new ButtonBuilder()
      .setLabel(t('commands.help.privacy'))
      .defineStyle('link')
      .setURL('https://sabinebot.xyz/terms')

    await ctx.reply(
      embed.build({
        components: [
          {
            type: 1,
            components: [button, terms]
          }
        ]
      })
    )
  },
  async createAutocompleteInteraction({ i, app }) {
    const value = i.options.getString('command', true)

    const commands = Array.from(app.commands)
      .filter(c => c[0].includes(value.toLowerCase()))
      .slice(0, 25)

    await i.respond(commands.map(cmd => ({ name: cmd[0], value: cmd[0] })))
  }
})
