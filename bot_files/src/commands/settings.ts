import { Permissions } from "@config/permissions";
import embeds from "@modules/embeds";
import { getMemberPermissions } from "@modules/permissions";
import { collectModalData } from "@modules/utils";
import Discord from "discord.js";


export default {
    execute: async (interaction: Discord.CommandInteraction, throwError: (title: string, desc?: string) => Discord.Message) => {
        if (!(interaction.member instanceof Discord.GuildMember)) return throwError("Error", "Something went wrong. Try again later.")
        if (!(await getMemberPermissions(interaction.member)).includes("settings")) return throwError("Error", "You're not permitted to use that.")
        var dataPermissions: any;
        async function updatePermissionsData() {
            return dataPermissions = (await dataManager.getKey("permissions")) ?? {};
        }
        async function updateReply(): Promise<Discord.Message<boolean> | Discord.InteractionResponse> {
            await updatePermissionsData()
            console.log(dataPermissions)
            return await interaction[interaction.replied || interaction.deferred ? "editReply" : "reply"]({
                ephemeral: true,
                embeds: [
                    embeds.default("no-desc")
                        .setTitle("Role permissions")
                        .setDescription(null)
                        .setFields(Object.keys(dataPermissions).map((key) => {
                            const role = interaction.guild?.roles.cache.get(key)
                            return {
                                name: role ? role.name : `RoleID: ${key}`,
                                value: dataPermissions[key].map((perm: string) => `\`\`${perm}\`\``).join(" ")
                            }
                        }))
                ],
                components: [
                    new Discord.ActionRowBuilder<Discord.RoleSelectMenuBuilder>().setComponents([
                        new Discord.RoleSelectMenuBuilder({
                            placeholder: "Change permissions",
                            custom_id: "settings_setPermissions"
                        })
                    ]),
                    new Discord.ActionRowBuilder<Discord.ButtonBuilder>().setComponents([
                        new Discord.ButtonBuilder({
                            label: "Clear permissions",
                            custom_id: "settings_clearPermissions",
                            style: Discord.ButtonStyle.Danger
                        })
                    ])
                ]
            })
        }

        const reply = await updateReply()
        const collector = reply.createMessageComponentCollector({
            time: 60_000 * 15,
            filter: (collectedInteraction) => collectedInteraction.user.id === interaction.user.id
        })
        collector.on("collect", async (collectedInteraction) => {
            if (!collectedInteraction.isButton()) return
            if (collectedInteraction.customId === "settings_clearPermissions") {
                await collectedInteraction.deferReply({ ephemeral: true })
                await dataManager.writeKey("permissions", {})
                await collectedInteraction.editReply({
                    embeds: [
                        embeds.default("You have cleared all permissions.")
                    ]
                })
                updateReply()
            }
        })
        collector.on("collect", async (collectedInteraction) => {
            if (!collectedInteraction.isRoleSelectMenu()) return

            await updatePermissionsData()
            const roleId = collectedInteraction.values[0]
            if (!roleId) return collectedInteraction.deferUpdate()

            const submit = await collectModalData(collectedInteraction, "Permissions management", [
                new Discord.TextInputBuilder({
                    label: "Permissions",
                    custom_id: "permissions",
                    placeholder: "Permissions (from a new line)",
                    max_length: 1024,
                    value: dataPermissions[roleId]?.join("\n") ?? undefined,
                    required: false,
                    style: Discord.TextInputStyle.Paragraph
                })
            ])
            if (!submit) return
            const permissions = submit.fields.getTextInputValue("permissions") ? submit.fields.getTextInputValue("permissions").split("\n") : []
            const validPermissions = permissions.filter((perm) => Permissions.includes(perm))
            if (validPermissions.length !== permissions.length) {
                submit.reply({
                    ephemeral: true,
                    embeds: [
                        embeds.default(`These permissions were removed: \n\`\`\`\n` +
                            permissions.filter((perm) => !validPermissions.includes(perm)).join("\n") +
                            "\n\`\`\`\n" +
                            "Because they aren't provided in permissions list."
                        ),
                        embeds.default(Permissions.map((perm) => `\`\`${perm}\`\``).join("\n"))
                            .setTitle("Permissions list")
                    ]
                })
            } else {
                submit.deferUpdate()
            }

            await updatePermissionsData()
            if (validPermissions.length === 0) {
                delete dataPermissions[roleId]
            } else {
                dataPermissions[roleId] = validPermissions
            }
            await dataManager.writeKey("permissions", dataPermissions)
            updateReply()
        })
        collector.on("end", (_, reason) => {
            if (reason === "time") return interaction.editReply({
                embeds: [
                    embeds.default("Time out. Call another menu.")
                ]
            })
        })
    },
    data: new Discord.SlashCommandBuilder()
        .setName("settings")
        .setDescription("Open bot settings.")
        .toJSON()
}