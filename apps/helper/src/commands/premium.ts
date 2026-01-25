import EmbedBuilder from '@/structures/builders/EmbedBuilder'
import SelectMenuBuilder from '@/structures/builders/SelectMenuBuilder'
import createCommand from '@/structures/command/createCommand'

export default createCommand({
  name: 'premium',
  description: 'Premium!',
  onlyDev: true,
  ephemeral: true,
  async run({ ctx }) {
    const menu = new SelectMenuBuilder()
      .setPlaceholder('Select a plan')
      .setOptions(
        {
          label: 'Premium Booster',
          value: 'premium_booster',
          description: 'Get the Premium Booster just by boosting the server!'
        },
        {
          label: 'Premium | Mercado Pago, Pix, cartão de crédito',
          value: 'premium_br',
          description: 'Compre o Premium por apenas R$5,99 durante 30 dias!'
        },
        {
          label: 'Premium | Stripe, credit card',
          value: 'premium_usd',
          description: 'Buy Premium for just $2.99 for 30 days!'
        }
      )
      .setCustomId('premium')

    const embed = new EmbedBuilder()
      .setTitle('PREMIUM')
      .setDesc(
        'Use this panel to purchase one of our plans and gain exclusive advantages for your server!'
      )
      .setFields(
        {
          name: 'Premium Booster',
          value:
            '- Key Booster generated manually\n  - Can be activated on up to one server\n  - You can add up to 10 tournaments\n  - Lasts as long as the boost is active'
        },
        {
          name: 'Premium',
          value:
            '- Key Premium generated automatically\n  - Can be activated on up to **2 different servers**\n  - You can add up to 20 tournaments\n  - News feature unlocked\n  - Live matches feature unlocked\n- Bonus coins and fates in `/daily`\n- Cooldown for `/claim` reduced to **5 minutes**'
        },
        {
          name: 'Payment methods',
          value:
            '- <:mercadopago:1313901326744293427> Mercado Pago\n- <:stripe:1409597720313987204> Stripe\n- <:credit_card:1409598374000463913> Card'
        }
      )

    await ctx.send({
      embeds: [embed],
      components: [
        {
          type: 1,
          components: [menu.toJSON()]
        }
      ]
    })
  }
})
