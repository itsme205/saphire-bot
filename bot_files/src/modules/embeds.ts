import Discord from "discord.js"

export default {
  error: function (title: string, description?: string): Discord.EmbedBuilder {
    if (!title) return new Discord.EmbedBuilder({ color: Discord.Colors.White, title: "Empty." })
    const error_embed = new Discord.EmbedBuilder()
      .setColor(Discord.Colors.Red) // bd2222
      .setTitle("``❌``  »  " + title)
      .setTimestamp()
    if (description) error_embed.setDescription(description)
    return error_embed
  },
  success: function (title: string, description?: string): Discord.EmbedBuilder {
    if (!title) return new Discord.EmbedBuilder({ color: Discord.Colors.White, title: "Empty." })
    const success_embed = new Discord.EmbedBuilder()
      .setColor(Discord.resolveColor("#1ac72b"))
      .setTitle("``✅``  »  " + title)
      .setTimestamp()
    if (description) success_embed.setDescription(description)
    return success_embed
  },
  attention: function (title: string, description?: string): Discord.EmbedBuilder {
    if (!title) return new Discord.EmbedBuilder({ color: Discord.Colors.White, title: "Empty." })
    const attention_embed = new Discord.EmbedBuilder()
      .setColor(Discord.Colors.Yellow)
      .setTitle("``⚠``  »  " + title)
      .setTimestamp()
    if (description) attention_embed.setDescription(description)
    return attention_embed
  },
  default: function (description: string): Discord.EmbedBuilder {
    if (!description) return new Discord.EmbedBuilder({ color: Discord.Colors.White, title: "Empty." })
    const default_embed = new Discord.EmbedBuilder()
      .setColor(Discord.resolveColor("#2b2d31"))
      .setDescription(description)
    return default_embed
  }

}
