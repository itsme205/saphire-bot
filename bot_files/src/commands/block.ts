import axios from "axios";
import Discord from "discord.js";
import { APIActionKeys } from "../config/api";
import embeds from "../modules/embeds";
import { getMemberPermissions } from "@modules/permissions";

export default {
    execute: async (interaction: Discord.CommandInteraction, throwError: (title: string, desc?: string) => Discord.Message) => {
        if (!(interaction.member instanceof Discord.GuildMember)) return throwError("Error", "Something went wrong. Try again later.")
        if (!(await getMemberPermissions(interaction.member)).includes("block")) return throwError("Error", "You're not permitted to use that.")
        await interaction.deferReply({ ephemeral: true })

        var res;
        try {
            res = await axios.get(
                `http://192.248.176.255:7777/api?magic=${process.env.MAGIC_KEY}&action=${APIActionKeys.KeyBlock}&key=${interaction.options.get("key")?.value}`, {
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

        if (res.data === 404 || res.data.status !== 10) return throwError("Error", "Something went wrong. Maybe this key is invalid?")
        interaction.editReply({
            embeds: [
                embeds.success("Blocked key", `Key ||${interaction.options.get("key")?.value}|| is blocked.`)
            ]
        })
    },
    data: new Discord.SlashCommandBuilder()
        .setName("block")
        .setDescription("Block license key.")
        .addStringOption((opt) =>
            opt
                .setName("key")
                .setDescription("license key")
                .setRequired(true)
        )
        .toJSON()
}