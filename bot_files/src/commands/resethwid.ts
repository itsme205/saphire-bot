import axios from "axios";
import Discord from "discord.js";
import { APIActionKeys } from "../config/api";
import embeds from "../modules/embeds";
import { memberHasOneRole } from "../modules/utils";

const statusCodes: {
    [key: number]: {
        success: boolean,
        message: string
    }
} = {
    404: {
        success: false,
        message: "License not found"
    },

    10: {
        success: true,
        message: "HWID reset"
    },
    11: {
        success: false,
        message: "Something went wrong"
    },
    12: {
        success: false,
        message: "Format error"
    },
    13: {
        success: false,
        message: "Key not found"
    },
    14: {
        success: false,
        message: "HWID not found"
    },
    15: {
        success: false,
        message: "Product not found"
    },
    16: {
        success: false,
        message: "Discord not found"
    }
}

export default {
    execute: async (interaction: Discord.CommandInteraction, throwError: (title: string, desc?: string) => Discord.Message) => {
        if (!(interaction.member instanceof Discord.GuildMember)) return throwError("Oops!", "Something went wrong. Please try again later.")
        if (!(process.env.OWNER_IDS ?? "").split(" ").includes(interaction.user.id)
            && !memberHasOneRole(interaction.member, (process.env.ADMIN_ROLES ?? "").split(" "))) return throwError("Error", "You're not permitted to use that.")

        await interaction.deferReply({ ephemeral: true })

        var res;
        try {
            res = await axios.get(
                `http://192.248.176.255:7777/api?magic=${process.env.MAGIC_KEY}&action=${APIActionKeys.KeyRemoveHwid}&key=${interaction.options.get("key")?.value}`, {
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

        if (res.data === 404 || (res.data.status && statusCodes[res.data.status]?.success === false))
            return throwError(
                "Error",
                `Unable to reset HWID by key ||${interaction.options.get("key")?.value}||\n` +
                `Reason: \`\`${(statusCodes[res.data.status ?? 404] ? statusCodes[res.data.status ?? 404].message : `no reason`)} (code ${(res.data.status ?? 404)})\`\``)
        if (!statusCodes[res.data.status]) return throwError("Error", "We can't handle this error now. Report to developers.")

        interaction.editReply({
            embeds: [
                embeds.success("Success", `HWID by key ||${interaction.options.get("key")?.value}|| reset successfully.`)
            ]
        })
    },
    data: new Discord.SlashCommandBuilder()
        .setName("resethwid")
        .setDescription("Reset HWID.")
        .addStringOption((opt) =>
            opt
                .setName("key")
                .setDescription("license key")
                .setRequired(true)
        )
        .toJSON()
}