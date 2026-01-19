import {
  type APIEmbedField,
  EmbedBuilder as DJSEmbedBuilder,
  type EmbedAuthorOptions,
  type EmbedFooterOptions,
  type InteractionReplyOptions
} from 'discord.js'

export default class EmbedBuilder extends DJSEmbedBuilder {
  public constructor() {
    super()
    super.setColor(6719296)
  }

  public setAuthor(options: EmbedAuthorOptions) {
    super.setAuthor(options)

    return this
  }

  public setTitle(title: string) {
    super.setTitle(title)

    return this
  }

  public setDesc(desc: string) {
    super.setDescription(desc)

    return this
  }

  public addField(name: string, value: string, inline = false) {
    super.addFields({ name, value, inline })

    return this
  }

  public addFields(fields: APIEmbedField[]) {
    super.addFields(fields)

    return this
  }

  public setField(name: string, value: string, inline = false) {
    super.setFields({
      name,
      value,
      inline
    })

    return this
  }

  public setFields(...fields: APIEmbedField[]) {
    super.setFields(fields)

    return this
  }

  public setImage(url: string) {
    super.setImage(url)

    return this
  }

  public setThumb(url: string) {
    super.setThumbnail(url)

    return this
  }

  public setTimestamp(timestamp = new Date()) {
    super.setTimestamp(timestamp)

    return this
  }

  public setFooter(footer: EmbedFooterOptions) {
    super.setFooter(footer)

    return this
  }

  public build(content?: string | InteractionReplyOptions) {
    if (typeof content === 'string' || !content) {
      return {
        content: content ?? '',
        embeds: [this.toJSON()],
        components: []
      }
    } else {
      return {
        embeds: [this.toJSON()],
        ...content
      }
    }
  }
}
