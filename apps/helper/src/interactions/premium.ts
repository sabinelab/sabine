import type { GuildMember, TextChannel } from 'discord.js'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import Stripe from 'stripe'
import { env } from '@/env'
import ButtonBuilder from '@/structures/builders/ButtonBuilder'
import EmbedBuilder from '@/structures/builders/EmbedBuilder'
import createComponentInteraction from '@/structures/interaction/createComponentInteraction'

const mercadopago = new MercadoPagoConfig({ accessToken: env.MP_TOKEN })
const stripe = new Stripe(env.STRIPE_TOKEN)

export default createComponentInteraction({
  name: 'premium',
  async run({ ctx }) {
    if (!ctx.guild || !ctx.interaction.isStringSelectMenu()) return

    const selection = ctx.interaction.values[0]

    switch (selection) {
      case 'premium_booster': {
        if ((ctx.interaction.member as GuildMember).premiumSince) {
          await ctx.interaction.reply({
            content: `You are already a Premium Booster!\nIf you want to generate and/or activate your key, just use the \`${env.PREFIX}genkey\` command.`,
            flags: 64
          })
          break
        }
        await ctx.interaction.reply({
          content: `To get Premium Booster, you need to follow the following steps:\n- Boost the server\n- Use the \`${env.PREFIX}genkey\` command`,
          flags: 64
        })
        break
      }
      case 'premium_br': {
        await ctx.interaction.reply({
          content: '<a:carregando:809221866434199634> Preparando o ambiente para a sua compra...',
          flags: 64
        })

        const thread = await (ctx.interaction.channel as TextChannel).threads.create({
          name: `BRL Premium (${ctx.interaction.user.id})`,
          type: 12, // Private Thread
          invitable: false
        })

        const preference = new Preference(mercadopago)
        const res = await preference.create({
          body: {
            items: [
              {
                title: 'PREMIUM - SABINE PAYMENTS',
                quantity: 1,
                currency_id: 'BRL',
                unit_price: 5.99,
                id: 'PREMIUM'
              }
            ],
            notification_url: env.MP_WEBHOOK_URL,
            external_reference: `${thread.id};${ctx.interaction.user.id};PREMIUM`,
            date_of_expiration: new Date(Date.now() + 600000).toISOString()
          }
        })

        if (!res.init_point) {
          await thread.send({
            content: `Não foi possível gerar o link de pagamento e a sua compra não pôde ser concluída.\nO tópico será excluído <t:${((Date.now() + 10000) / 1000).toFixed(0)}:R>`
          })
          return setTimeout(() => thread.delete(), 10000)
        }

        await thread.members.add(ctx.interaction.user.id)

        const embed = new EmbedBuilder()
          .setTitle('Plano Premium')
          .setDesc(
            `Clique no botão abaixo para ser redirecionado para a página de pagamento do Mercado Pago <:mercadopago:1313901326744293427>\nRealize o pagamento <t:${((Date.now() + 600000) / 1000).toFixed(0)}:R>, caso contrário, o link expirará.`
          )

        const button = new ButtonBuilder()
          .defineStyle('link')
          .setLabel('Link de pagamento')
          .setURL(res.init_point)

        await thread.send({
          components: [
            {
              type: 1,
              components: [button]
            }
          ],
          embeds: [embed]
        })

        await ctx.interaction.editReply({
          content: `Ambiente criado! Continue com a compra em ${thread.toString()}`
        })
        break
      }
      case 'premium_usd': {
        await ctx.interaction.reply({
          content:
            '<a:carregando:809221866434199634> Getting everything ready for your purchase...',
          flags: 64
        })

        const thread = await (ctx.interaction.channel as TextChannel).threads.create({
          name: `USD Premium (${ctx.interaction.user.id})`,
          type: 12, // Private Thread
          invitable: false
        })

        await thread.members.add(ctx.interaction.user.id)

        const payment = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: 'Premium - Sabine Payments'
                },
                unit_amount: 299
              },
              quantity: 1
            }
          ],
          mode: 'payment',
          metadata: {
            thread: thread.id,
            user: ctx.interaction.user.id,
            type: 'PREMIUM'
          },
          success_url: env.STRIPE_WEBHOOK_URL
        })

        if (!payment.url) {
          return await thread.send({
            content:
              'The payment link could not be generated and your purchase could not be completed.'
          })
        }

        const embed = new EmbedBuilder()
          .setTitle('Premium Plan')
          .setDesc(
            `Click on the button below to be redirected to the <:stripe:1409597720313987204> Stripe payment page.\nYou must complete the payment <t:${((Date.now() + 30 * 60 * 1000) / 1000).toFixed(0)}:R>, or the link will expire.`
          )

        const button = new ButtonBuilder()
          .defineStyle('link')
          .setLabel('Payment link')
          .setURL(payment.url)

        await thread.send({
          components: [
            {
              type: 1,
              components: [button]
            }
          ],
          embeds: [embed]
        })

        await ctx.interaction.editReply({
          content: `Everything is ready! Continue your purchase in ${thread.toString()}`
        })
        break
      }
    }
  }
})
