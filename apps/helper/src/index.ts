import { UserSchema } from '@db'
import type { TextChannel } from 'discord.js'
import fastify from 'fastify'
import {
  type FastifyPluginAsyncZod,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider
} from 'fastify-type-provider-zod'
import { z } from 'zod'
import { app } from '@/structures/app/App'
import EmbedBuilder from '@/structures/builders/EmbedBuilder'

await app.connect()

const cache = new Set<string>()

const route: FastifyPluginAsyncZod = async fastify => {
  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/mercadopago',
    {
      schema: {
        body: z.object({
          type: z.string(),
          data: z.object({
            id: z.string()
          })
        })
      }
    },
    async req => {
      if (req.body.type === 'payment') {
        const details = await fetch(`https://api.mercadopago.com/v1/payments/${req.body.data.id}`, {
          headers: {
            Authorization: 'Bearer ' + process.env.MP_TOKEN
          }
        }).then(res => res.json())

        const args = details.external_reference.split(';')

        if (details.status === 'approved' && !cache.has(details.external_reference)) {
          cache.add(details.external_reference)

          const user = (await UserSchema.fetch(args[1])) || new UserSchema(args[1])

          const keyId = await user.addPremium('BUY_PREMIUM')

          const embed = new EmbedBuilder()
            .setTitle('Pagamento Aprovado')
            .setDesc(
              `Sua compra de **${details.transaction_details.total_paid_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}** foi aprovada e você já pode aproveitar seus benefícios!\n\nSua chave de ativação é \`${keyId}\`\nNão compartilhe com NINGUÉM!\n\nPara ativar sua chave, vá em https://canary.discord.com/channels/1233965003850125433/1313588710637568030 e use o comando \`${process.env.PREFIX}ativarchave <id do servidor>\``
            )
            .setFooter({
              text: 'O tópico será deletado automaticamente após 45 minutos de inatividade'
            })

          const channel = app.channels.cache.get(args[0]) as TextChannel

          if (channel) await channel.send({ embeds: [embed] })
        } else if (details.status === 'rejected') {
          const embed = new EmbedBuilder()
            .setTitle('Pagamento Rejeitado')
            .setDesc(
              `Sua compra de **${details.transaction_details.total_paid_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}** foi rejeitada e não foi possível prosseguir com o pagamento!`
            )

          const channel = app.channels.cache.get(args[0]) as TextChannel

          if (channel) await channel.send({ embeds: [embed] })
        }
      }
    }
  )

  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/stripe',
    {
      schema: {
        body: z.object({
          type: z.string(),
          data: z.object({
            object: z.object({
              amount_total: z.number(),
              metadata: z.object({
                user: z.string(),
                thread: z.string(),
                type: z.string()
              })
            })
          })
        })
      }
    },
    async (req, reply) => {
      if (req.body.type === 'checkout.session.completed') {
        const session = req.body.data.object

        const user =
          (await UserSchema.fetch(session.metadata.user)) || new UserSchema(session.metadata.user)

        const keyId = await user.addPremium('BUY_PREMIUM')

        const embed = new EmbedBuilder()
          .setTitle('Payment Approved')
          .setDesc(
            `Your purchase of **${(session.amount_total / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}** has been approved and you can now enjoy your benefits!\n\nYour activation key is \`${keyId}\`\nDo not share with ANYONE!\n\nTo activate your key, go to https://canary.discord.com/channels/1233965003850125433/1313588710637568030 and use the command \`${process.env.PREFIX}activatekey <server ID>\``
          )
          .setFooter({
            text: 'The thread will be deleted automatically after 45 minutes of inactivity'
          })

        const channel = app.channels.cache.get(session.metadata!.thread) as TextChannel

        await channel.send({ embeds: [embed] })

        reply.code(200).send({ message: 'Payment received' })
      } else if (req.body.type === 'checkout.session.async_payment_failed') {
        const session = req.body.data.object

        const embed = new EmbedBuilder()
          .setTitle('Payment Failed')
          .setDesc(
            `Your purchase of **${session.amount_total?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}** has been rejected and it was not possible to proceed with the payment!`
          )

        const channel = app.channels.cache.get(session.metadata!.thread) as TextChannel

        await channel.send({ embeds: [embed] })

        reply.code(400).send({ message: 'Payment rejected' })
      }
    }
  )
}

const server = fastify()
  .withTypeProvider<ZodTypeProvider>()
  .setValidatorCompiler(validatorCompiler)
  .setSerializerCompiler(serializerCompiler)

await server.register(route as any)
await server.listen({ host: '0.0.0.0', port: 3000 })
