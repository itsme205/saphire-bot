import axios, { AxiosResponse } from "axios";
import Discord from "discord.js";
import { APIActionKeys } from "../config/api";
import embeds from "../modules/embeds";
import { StringsList } from "../modules/list";


export default {
    execute: async (interaction: Discord.CommandInteraction, throwError: (title: string, desc?: string) => Discord.Message) => {
        if (!(process.env.OWNER_IDS ?? "").split(" ").includes(interaction.user.id)) return throwError("Error", "You're not permitted to use that.")
        await interaction.deferReply({ ephemeral: true })

        var res: AxiosResponse;
        try {
            res = await axios.get(
                `http://192.248.176.255:7777/api?magic=${process.env.MAGIC_KEY}&action=${APIActionKeys.KeyStats}&name=spoofer&days=1`, {
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

        if (!res.data.activated) return throwError("Error", "Can't get information from API. More info in console.")
        if (Object.keys(res.data.activated).length === 0) return throwError("Error", "There're no information.")

        const list = new StringsList(interaction, {
            collector: {
                time: 60_000 * 20
            },
            elementsOnPage: 1,
            embed: embeds.default("Nothing to be here"),
            ephemeralReply: true,
            startPage: 0,
            stringJoiner: "\n",
            strings: [
                ...Object.keys(res.data.activated).map((index) =>
                    `## ${index}\n${res.data.activated[index].list.join("\n")}`
                )
            ]
        })
        list.showList()
    },
    data: new Discord.SlashCommandBuilder()
        .setName("keystats")
        .setDescription("Get key stats.")
        .toJSON()
}