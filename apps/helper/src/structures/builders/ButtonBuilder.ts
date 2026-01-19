import {
  ButtonStyle,
  ButtonBuilder as DJSButtonBuilder,
  type InteractionReplyOptions
} from 'discord.js'

export default class ButtonBuilder extends DJSButtonBuilder {
  public defineStyle(style: 'blue' | 'gray' | 'green' | 'red' | 'link') {
    switch (style.toLowerCase()) {
      case 'blue':
        super.setStyle(ButtonStyle.Primary)
        break
      case 'gray':
        super.setStyle(ButtonStyle.Secondary)
        break
      case 'green':
        super.setStyle(ButtonStyle.Success)
        break
      case 'red':
        super.setStyle(ButtonStyle.Danger)
        break
      case 'link':
        super.setStyle(ButtonStyle.Link)
        break
      default:
        throw new Error('Invalid style! Please, choose: "BLUE", "GRAY", "GREEN", "RED", "LINK"')
    }

    return this
  }

  public setLabel(label: string) {
    super.setLabel(label)

    return this
  }

  public setCustomId(id: string) {
    super.setCustomId(id)

    return this
  }

  public setEmoji(emoji: string, animated?: boolean) {
    if (Number.isNaN(Number(emoji))) super.setEmoji({ name: emoji })
    else super.setEmoji({ id: emoji, animated })

    return this
  }

  public setURL(url: string) {
    super.setURL(url)

    return this
  }

  public setDisabled() {
    super.setDisabled(true)

    return this
  }

  public setEnabled() {
    super.setDisabled(false)

    return this
  }

  public build(content?: string | InteractionReplyOptions) {
    if (typeof content === 'string') {
      return {
        content: content ?? '',
        components: [
          {
            type: 1,
            components: [this]
          }
        ]
      }
    } else {
      return {
        components: [
          {
            type: 1,
            components: [this]
          }
        ],
        ...content
      }
    }
  }
}
