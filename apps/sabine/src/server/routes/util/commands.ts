import { Elysia } from 'elysia'
import { app } from '../../../structures/app/App'

await app.load()

export const commands = new Elysia().get('/commands', async ({ set }) => {
  type Command = Pick<
    typeof app.commands extends Map<any, infer V> ? V : never,
    | 'name'
    | 'nameLocalizations'
    | 'description'
    | 'descriptionLocalizations'
    | 'syntax'
    | 'syntaxes'
    | 'examples'
    | 'permissions'
    | 'botPermissions'
  >

  const commands: Command[] = []

  app.commands.forEach(command => {
    commands.push({
      name: command.name,
      nameLocalizations: command.nameLocalizations,
      description: command.description,
      descriptionLocalizations: command.descriptionLocalizations,
      syntax: command.syntax,
      syntaxes: command.syntaxes,
      examples: command.examples,
      permissions: command.permissions,
      botPermissions: command.botPermissions
    })
  })

  set.status = 'OK'

  return commands
})
