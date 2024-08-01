import { Client, ClientOptions } from "discord.js";
import CommandInterface from "../../interfaces/Command";

class Handler_Client extends Client {
    commands: {
        [key: string]: CommandInterface
    }
    events: Map<string, [...any]>
    modules: {}
    constructor(options: ClientOptions) {
        super(options)

        this.commands = {};
        this.events = new Map();
        this.modules = {};
    }
}

export default Handler_Client