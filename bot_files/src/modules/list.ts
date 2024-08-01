import Discord from 'discord.js'
import embeds from './embeds'

interface StringsListSettings {
  embed: Discord.EmbedBuilder

  elementsOnPage: number
  startPage: number
  stringJoiner: string
  strings: string[]

  collector: {
    filter?: (interaction: Discord.Interaction) => boolean
    time?: number
    max?: number
  }

  ephemeralReply?: boolean
}

class StringsList {
  public readonly interaction: Discord.CommandInteraction | Discord.ButtonInteraction | Discord.CommandInteraction | Discord.AnySelectMenuInteraction
  public elements_on_page: number
  private readonly pages_data: string[]
  private page_id: number
  private readonly embed: Discord.EmbedBuilder
  private readonly string_joiner: string

  private readonly collector_options: {
    filter?: (interaction: Discord.Interaction) => boolean
    time?: number | undefined
    max?: number | undefined
  } = {}

  public collector: any | undefined = undefined

  private readonly ephemeral_reply: boolean = true

  constructor (interaction: Discord.CommandInteraction | Discord.ButtonInteraction | Discord.CommandInteraction | Discord.AnySelectMenuInteraction, data: StringsListSettings) {
    this.interaction = interaction

    this.embed = data.embed || new Discord.EmbedBuilder()

    this.collector_options = data.collector

    this.page_id = data.startPage || 0
    this.pages_data = data.strings || []
    this.elements_on_page = data.elementsOnPage || 5
    this.string_joiner = data.stringJoiner || '\n'
    this.ephemeral_reply = data.ephemeralReply === undefined ? this.ephemeral_reply : data.ephemeralReply
  }

  private async reply (data: Discord.MessageCreateOptions | Discord.MessageEditOptions): Promise<Discord.Message<boolean> | undefined> {
    if (!this.interaction.isButton() && !this.interaction.isModalSubmit() && !this.interaction.isAnySelectMenu() && !this.interaction.isCommand()) return

    if (this.interaction?.replied || this.interaction?.deferred) {
      return (await this.interaction.editReply(data))
    } else {
      // @ts-expect-error
      return (await this.interaction.reply({
        ...data,
        ...{ ephemeral: this.ephemeral_reply }
      }))
    }
  }

  async showList () {
    return await new Promise(async (resolve, reject) => {
      if (!this.interaction.isButton() && !this.interaction.isModalSubmit() && !this.interaction.isAnySelectMenu() && !this.interaction.isCommand()) { reject(new Error('Unsupported interaction type.')); return }
      if (this.pages_data.length === 0) { reject(new Error('There are no pages to show.')); return }
      if (this.page_id >= (Math.ceil(this.pages_data.length / this.elements_on_page) - 1)) this.page_id = (Math.ceil(this.pages_data.length / this.elements_on_page) - 1)

      const reply = await this.reply({
        embeds: [
          this.embed.setDescription(
            this.pages_data.map((str: string, index) => {
              if (index >= (this.page_id * this.elements_on_page) && index < (this.page_id * this.elements_on_page + this.elements_on_page)) {
                return str
              } else {
                return undefined
              }
            }).filter(elem => elem).join(this.string_joiner)
          ).setFooter({
            text: `Страница: ${(this.page_id + 1)}/${Math.ceil(this.pages_data.length / this.elements_on_page)}`
          })
        ],
        components: [
          new Discord.ActionRowBuilder<Discord.ButtonBuilder>().setComponents([
            new Discord.ButtonBuilder({
              label: '<<',
              style: Discord.ButtonStyle.Secondary,
              custom_id: 'list_prev',
              disabled: this.page_id === 0
            }),
            new Discord.ButtonBuilder({
              label: '❌',
              style: Discord.ButtonStyle.Secondary,
              custom_id: 'list_close'
            }),
            new Discord.ButtonBuilder({
              label: '🔎',
              style: Discord.ButtonStyle.Secondary,
              custom_id: 'list_goto'
            }),
            new Discord.ButtonBuilder({
              label: '>>',
              style: Discord.ButtonStyle.Secondary,
              custom_id: 'list_next',
              disabled: this.page_id >= (Math.ceil(this.pages_data.length / this.elements_on_page) - 1)
            })
          ])
        ]
      })
      if (!reply) return
      if (!this.collector) {
        this.collector = reply.createMessageComponentCollector({
          ...(this.collector_options.time ? { time: this.collector_options.time } : {}),
          ...(this.collector_options.max ? { max: this.collector_options.max } : {}),
          filter: this.collector_options?.filter
        })
        this.collector.on('collect', async (collected_interaction: Discord.Interaction) => {
          if (!collected_interaction.isButton()) return

          if (collected_interaction.customId === 'list_next' || collected_interaction.customId === 'list_prev') {
            if (this.page_id >= (Math.ceil(this.pages_data.length / this.elements_on_page) - 1) && collected_interaction.customId === 'list_next') return await collected_interaction.deferUpdate()
            if (this.page_id === 0 && collected_interaction.customId === 'list_prev') return await collected_interaction.deferUpdate()

            this.page_id += collected_interaction.customId === 'list_next' ? 1 : -1
            collected_interaction.deferUpdate()
            this.showList()
          } else if (collected_interaction.customId === 'list_close') {
            this.interaction.deleteReply(collected_interaction.message)
          } else if (collected_interaction.customId === 'list_goto') {
            await collected_interaction.showModal(
              new Discord.ModalBuilder({
                title: 'Goto',
                custom_id: 'list_goto',
                components: [
                  new Discord.ActionRowBuilder<Discord.TextInputBuilder>().setComponents(
                    new Discord.TextInputBuilder({
                      label: 'Page',
                      style: Discord.TextInputStyle.Short,
                      placeholder: '1-' + Math.ceil(this.pages_data.length / this.elements_on_page),
                      value: (this.page_id + 1).toString(),
                      required: true,
                      max_length: 3,
                      custom_id: 'page_id'
                    })
                  )
                ]
              })
            )

            const submit = await collected_interaction.awaitModalSubmit({ time: 60_000 * 10, filter: (sbm) => sbm.user.id === collected_interaction.user.id && sbm.customId === 'list_goto' })
            if (!submit) return

            const page = Math.floor(parseInt(submit.fields.getTextInputValue('page_id')))
            if (isNaN(page) || page === 0 || page > Math.ceil(this.pages_data.length / this.elements_on_page)) {
              return await submit.reply({
                ephemeral: true,
                embeds: [
                  embeds.error('Error', 'You provided an incorrect page.')
                ]
              })
            }

            await submit.deferUpdate()
            this.page_id = page - 1
            this.showList()
          }
        })
      }

      resolve(reply)
    })
  }
}

export {
  StringsList
}
