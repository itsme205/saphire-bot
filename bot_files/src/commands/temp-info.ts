// import axios from "axios";
// import Discord from "discord.js";
// import { APIActionKeys } from "../config/api";
// import embeds from "../modules/embeds";
// import { memberHasOneRole } from "../modules/utils";
// import { getMemberPermissions } from "@modules/permissions";

// function replaceEmptyString(string: string, replacer?: string): string {
//     if ((typeof string === "string" && string.length > 0) || (typeof string === "number")) return string.toString()

//     return replacer ?? "-"
// }

// export default {
//     execute: async (interaction: Discord.CommandInteraction, throwError: (title: string, desc?: string) => Discord.Message) => {
//         if (!(interaction.member instanceof Discord.GuildMember)) return throwError("Error", "Something went wrong. Try again later.")
//         if (!(await getMemberPermissions(interaction.member)).includes("keyinfo")) return throwError("Error", "You're not permitted to use that.")
//         await interaction.deferReply({ ephemeral: true })

//         var res;
//         try {
//             res = await axios.get(
//                 `${process.env.TEMP_ENDPOINT}/renter.php?apikey=${process.env.TEMP_KEY}&action=${APIActionKeys.KeyInfo}&key=${interaction.options.get("key")?.value}`, {
//                 headers: {
//                     "User-Agent": "backendserver"
//                 }
//             })
//         } catch (err) {
//             throwError("Oops", "Something went wrong! More information about error in console.")
//             return console.log(err)
//         }

//         console.log(`GET to ${res.config.url} with status code ${res.status}.`)
//         console.log(res.data)

//         if (res.data === 404) {
//             throwError("Error", `License with key ||${interaction.options.get("key")?.value}|| not found.`)
//         } else {
//             interaction.editReply({
//                 embeds: [
//                     embeds.default(`We found some information about key ||${interaction.options.get("key")?.value}||!`)
//                         .setFields([
//                             ...[
//                                 { name: "Not blocked?", value: !res.data.blocked ? "✅" : "❌", inline: true },
//                                 { name: "Days left", value: `${res.data.days_left}/${res.data.days}`, inline: true },
//                                 { name: "HWID reset", value: replaceEmptyString(replaceEmptyString(res.data.hwid_reset)), inline: true },
//                                 { name: "Status", value: replaceEmptyString(res.data.status), inline: true }
//                             ],
//                             ...(
//                                 (process.env.OWNER_IDS ?? "").split(" ").includes(interaction.user.id) ? [ // owner only
//                                     { name: "Country", value: replaceEmptyString(res.data.country), inline: true },
//                                     { name: "Is Discord linked?", value: res.data.discord_linked ? "✅" : "❌", inline: true },
//                                     { name: "Discord ID", value: replaceEmptyString(res.data.discord_id), inline: true },
//                                     { name: "HWID", value: replaceEmptyString(res.data.hwid), inline: true },
//                                     { name: "IP", value: replaceEmptyString(res.data.ip), inline: true },
//                                     { name: "New HWID", value: replaceEmptyString(res.data.new_hwid), inline: true },
//                                     { name: "New timestamp", value: res.data.new_timestamp ? `<t:${res.data.new_timestamp}:D>` : "-", inline: true },
//                                     { name: "Note", value: replaceEmptyString(res.data.note), inline: true },
//                                     { name: "Status", value: replaceEmptyString(res.data.status), inline: true },
//                                     { name: "Timestamp", value: res.data.timestamp ? `<t:${res.data.timestamp}:D>` : "-", inline: true },
//                                     { name: "Suspend timestamp", value: res.data.suspend_timestamp ? `<t:${res.data.suspend_timestamp}:D>` : "-", inline: true }
//                                 ] : [])
//                         ])
//                 ]
//             })
//         }
//     },
//     data: new Discord.SlashCommandBuilder()
//         .setName("temp-info")
//         .setDescription("Get information about key.")
//         .addStringOption((opt) =>
//             opt
//                 .setName("key")
//                 .setDescription("license key")
//                 .setRequired(true)
//         )
//         .toJSON()
// }