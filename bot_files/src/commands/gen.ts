import axios from "axios";
import Discord from "discord.js";
import { APIActionKeys } from "../config/api";
import embeds from "../modules/embeds";
import { getMemberPermissions } from "@modules/permissions";

export default {
    execute: async (interaction: Discord.CommandInteraction, throwError: (title: string, desc?: string) => Discord.Message) => {
        if (!(interaction.member instanceof Discord.GuildMember)) return throwError("Error", "Something went wrong. Try again later.")
        if (!(await getMemberPermissions(interaction.member)).includes("gen")) return throwError("Error", "You're not permitted to use that.")
        await interaction.deferReply({ ephemeral: true })

        var res;
        try {
            res = await axios.get(
                `http://192.248.176.255:7777/api?magic=${process.env.MAGIC_KEY}&action=${APIActionKeys.KeyGenerate}&days=${interaction.options.get("days")?.value}` +
                `&count=${interaction.options.get("amount")?.value}&name=spoofer`, {
                headers: {
                    "User-Agent": "backendserver"
                }
            })
        } catch (err) {
            throwError("Oops", "Something went wrong! More information about error in console.")
            return console.log(err)
        }

        console.log(`GET to ${res.config.url} with status code ${res.status}.`)
        console.log(res.data)

        if (!res.data.keys || res.data.keys?.length === 0) return throwError("Error", "Something went wrong! More information in console.")

        interaction.editReply({
            embeds: [
                embeds.default(`\`\`\`\n${res.data.keys.map((key: string) => `${key}`).join("\n")}\n\`\`\``)
            ]
        })
    },
    data: new Discord.SlashCommandBuilder()
        .setName("gen")
        .setDescription("Generate certain amount of keys.")
        .addNumberOption((opt) =>
            opt
                .setName("days")
                .setDescription("days of keys life")
                .setMinValue(1)
                .setMaxValue(30)
                .setRequired(true)
        )
        .addNumberOption((opt) =>
            opt
                .setName("amount")
                .setMaxValue(20)
                .setDescription("amount of keys")
                .setRequired(true)
        )
        .toJSON()
}