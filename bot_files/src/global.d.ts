import Handler_Client from "./classes/default/Handler_Client"
import DataManagerClass from "./modules/data_manager/Manager"

interface CommandInterface {
    name: string,
    isValid: boolean,
    execute: Function
}

declare global {
    var client: Handler_Client
    var interfaces: {
        Command: CommandInterface
    }
}