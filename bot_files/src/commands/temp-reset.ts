import axios from "axios";
import Discord from "discord.js";
import { memberHasOneRole } from "../modules/utils";
import embeds from "../modules/embeds";
import { getMemberPermissions } from "@modules/permissions";


export default {
    execute: async (interaction: Discord.CommandInteraction, throwError: (title: string, desc?: string) => Discord.Message) => {
        if (!(interaction.member instanceof Discord.GuildMember)) return throwError("Error", "Something went wrong. Try again later.")
        if (!(await getMemberPermissions(interaction.member)).includes("reset")) return throwError("Error", "You're not permitted to use that.")

        await interaction.deferReply({ ephemeral: true })

        var res;
        try {
            res = await axios.get(
                `${process.env.TEMP_ENDPOINT}/renter.php?apikey=${process.env.TEMP_KEY}&action=resethwid&key=${interaction.options.get("key")?.value}`, {
                headers: {
                    "User-Agent": "backendserver"
                }
            })
        } catch (err) {
            throwError("Oops", "Something went wrong! More information about error in console.")
            return console.log(err)
        }
        console.log(`GET to ${res.config.url} with status code ${res.status}.`)

        if (res.data?.success) {
            interaction.editReply({
                embeds: [
                    embeds.success("Success", `The license (\`\`${interaction.options.get("key")?.value}\`\`) was reset successfully.`)
                ]
            })
        } else {
            throwError("Error", `License reset attempt is failed: \`\`${res.data.message}\`\`.`)
        }
    },
    data: new Discord.SlashCommandBuilder()
        .setName("temp-reset")
        .setDescription("Reset the license by key (through API).")
        .addStringOption((opt) =>
            opt
                .setName("key")
                .setDescription("license key generated by you")
                .setRequired(true)
        )
        .toJSON()
}