import fs from "fs";
import dotenv from "dotenv";
import path from "path";
dotenv.config({
    path: path.join(require.main?.path || "", ".env"),
    debug: true
})

import Discord from "discord.js";
import Handler_Client from "./classes/default/Handler_Client";

global.client = new Handler_Client({
    intents: [
        Discord.IntentsBitField.Flags.Guilds,
        Discord.IntentsBitField.Flags.GuildMessages,
        Discord.IntentsBitField.Flags.GuildPresences,
        Discord.IntentsBitField.Flags.GuildMembers,
        Discord.IntentsBitField.Flags.GuildInvites,
        Discord.IntentsBitField.Flags.GuildVoiceStates,
        Discord.IntentsBitField.Flags.MessageContent
    ]
})

import colors from "colors";
import { CommandInterface } from "./global";

process.on("unhandledRejection", (reason, promise) => {
    console.log("Unhandled rejection with reason " + reason)
    promise.catch((err) => { console.log(err) })
})

async function scanDir(dir: string) {
    if (!fs.readdirSync(dir)) return []
    var dirFiles = await fs.promises.readdir(dir)

    await new Promise((resolve) => {
        async function checkDir() {
            if (!dirFiles.find(val => val.split(".").length === 1)) return resolve(true)
            const dirName = dirFiles.find(val => val.split(".").length === 1) || ""
            dirFiles = [
                ...dirFiles.filter(val => val !== dirName),
                ...(
                    (await fs.promises.readdir(path.join(dir, dirName))).map((val) => path.join(dirName, val))
                )
            ]

            checkDir()
        }
        checkDir()
    })

    return dirFiles
}

client.on("ready", async () => {
    console.log(colors.bold(`Logged in as ${colors.green(client.user?.username || "unnamed")}. Connection time: ${colors.green(process.uptime().toFixed(2).toString())} sec.`))

    // Application preparation 
    // MODULES (will be added soon)
    const modules_dir: string[] = await scanDir(path.join(require.main?.path || "", "/modules")) || []
    if (modules_dir.length === 0) {
        console.log(
            colors.bold(`${colors.red("\n[X] There're no modules in your app!")}
            \r${colors.blue("[i]")} You can add it through creating file in \"modules\" directory.\n\n`)
        )
    } else {
        for (let i in modules_dir) {
            if (modules_dir[i].split(".")[1] !== "ts" && modules_dir[i].split(".")[1] !== "js") continue
            const module_file = require(path.join(require.main?.path || "", "modules", modules_dir[i]))?.default || {}
            if (!module_file?.id) {
                // console.log(colors.bold(`${colors.red("[X] Cannot initialize module ")} - ${modules_dir[i]}! Add \"id\" property to export as default.`))
                continue
            }

            // client.modules[module_file?.id as keyof Object] = module_file
            if (module_file.init) {
                module_file.init((text: string) => {
                    console.log(colors.bold(`[${colors.blue(module_file?.name || module_file?.id)}] ${text}`))
                })
            }
        }
    }
    // COMMANDS
    const commands_dir: string[] = await scanDir(path.join(require.main?.path || "", "/commands")) || []
    if (commands_dir.length === 0) {
        console.log(
            colors.bold(`${colors.red("\n[X] There're no commands in your app!")}
            \r${colors.blue("[i]")} You can add it through creating file in \"commands\" directory.\n\n`)
        )
    } else {
        console.log(colors.bold(`\nFound ${colors.green(commands_dir?.length?.toString() || "0")} commands.`))

        for (let i in commands_dir) {
            const command_file = require(path.join(require.main?.path || "", "commands", commands_dir[i]))?.default || {}
            const command_data: CommandInterface = {
                name: commands_dir[i].split(".")[0],
                isValid: command_file?.execute ? true : false,
                execute: require(path.join(require.main?.path || "", "commands", commands_dir[i]))?.default?.execute || function () {
                    console.log(colors.bold(`${colors.red("[X]")} Command ${colors.green(commands_dir[i].split(".")[0])} cannot be used! There isn't \"execute\" function!`))
                }
            }
            client.commands[command_data.name] = command_data


            if (command_file?.data) {
                client.application?.commands.create(command_file?.data)
                    .catch((err) => { console.log(err) })
                console.log(colors.bold(`[${colors.blue("CMD")}] Updating command's ${colors.yellow(command_data.name)} data.`))
            }
            console.log(colors.bold(`[${colors.blue("CMD")}] Command ${colors.green(command_data.name || "unnamed")} is prepared.`))
        }
    }

    // EVENTS
    const events_dir: string[] = await scanDir(path.join(require.main?.path || "", "/events")) || []
    if (events_dir.length === 0) {
        console.log(
            colors.bold(`${colors.red("\n[X] There're no events in your app!")}
            \r${colors.blue("[i]")} You can add it through creating file in \"events\" directory.\n\n`)
        )
    } else {
        console.log("\n")
        for (let i in events_dir) {
            const event_file = require(path.join(require.main?.path || "", "events", events_dir[i]))?.default || {}
            if (!event_file?.eventName || !event_file?.execute) {
                // console.log(colors.bold(`${colors.red("[X]")} Cannot initialize event ${colors.red(events_dir[i])}, check your file.`))
                continue
            } else if (event_file.eventName === "ready") {
                try {
                    event_file.execute()
                    continue
                } catch (err) {
                    console.log(colors.bold(`${colors.red("[X]")} Event execute error (${colors.red(events_dir[i])}).\n`), err)
                }
            }

            client.events.set(event_file.eventName, [
                ...(client.events.get(event_file.eventName) || []),
                ...[event_file.execute]
            ])
        }

        const event_names = Array.from(client.events.keys())
        for (let i in event_names) {
            client.on(event_names[i], (...args) => {
                const execute_functions = client.events.get(event_names[i])
                if (!execute_functions) return

                for (let k in execute_functions) {
                    execute_functions[k](...args)
                }
            })
        }
    }
})

client.on("interactionCreate", (interaction: Discord.Interaction) => {
    if (!interaction.isCommand()) return console.log("> Received interaction, but it's not command.")
    console.log(`> Received command: ${interaction.command?.name} [${interaction.id}]`)

    const command = global.client.commands[interaction.command?.name || ""]
    if (!command || !command.isValid) {
        interaction.reply({
            ephemeral: true,
            content: "Unfortunately we can't handle this command now. Please, try again later."
        }).catch(() => { })
        return
    }
    try {
        command.execute(interaction, (title: string, description: string) => {
            return new Promise(async (resolve) => {
                if (interaction.replied) return resolve(interaction)

                try {
                    await interaction[(interaction?.replied || interaction?.deferred) ? 'editReply' : 'reply']({
                        ephemeral: true,
                        embeds: [
                            new Discord.EmbedBuilder({
                                color: Discord.Colors.Red,
                                title: "``❌``  »  " + title,
                                description: description,
                                timestamp: new Date()
                            })
                        ]
                    })
                } catch (err) {
                    console.log("throwError() returned error.", err)
                }
            })
        })
    } catch (err) {
        console.log("There are an error!")
        console.log(err)
    }
})

client.login(process.env.BOT_TOKEN).catch((err) => {
    console.log(err)
})