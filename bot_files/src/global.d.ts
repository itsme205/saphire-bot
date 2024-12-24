import Handler_Client from "./classes/default/Handler_Client"
import { DataManager } from "@modules/data_manager/Manager"

interface CommandInterface {
    name: string,
    isValid: boolean,
    execute: Function
}

declare global {
    var client: Handler_Client
    var dataManager: DataManager;
    var interfaces: {
        Command: CommandInterface
    }
}