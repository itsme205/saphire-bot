import Discord from "discord.js";
import { v4 } from "uuid";

export function memberHasOneRole(member: Discord.GuildMember, roles: string[]): boolean {
    let result = false;
    for (let i in roles) {
        if (member.roles.cache.has(roles[i])) { result = true; break }
    }

    return result
}
export function wrapButtons(buttons: Discord.ButtonBuilder[]): Array<Discord.ActionRowBuilder<Discord.ButtonBuilder>> {
    const rows: Array<Discord.ActionRowBuilder<Discord.ButtonBuilder>> = [
        new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
    ]
    for (const i in buttons) {
        if ((rows.at(-1)?.components.length || 0) >= 5) {
            rows.push(new Discord.ActionRowBuilder<Discord.ButtonBuilder>())
        }

        rows.at(-1)?.addComponents(buttons[i])
    }
    return rows
}
export async function collectModalData(interaction: Discord.ButtonInteraction | Discord.CommandInteraction | Discord.AnySelectMenuInteraction, title: string, components: Discord.TextInputBuilder[]): Promise<Discord.ModalSubmitInteraction> {
    const id = v4()
    await interaction.showModal(new Discord.ModalBuilder({
        title,
        customId: id,
        components: components.map(comp => new Discord.ActionRowBuilder<Discord.TextInputBuilder>().setComponents([comp]))
    }))

    const submit = await interaction.awaitModalSubmit({ time: 60_000 * 60, filter: (sbm) => sbm.user.id === interaction.user.id && sbm.customId === id })
    return submit
}