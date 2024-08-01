import Discord from "discord.js"

function memberHasOneRole(member: Discord.GuildMember, roles: string[]): boolean {
    let result = false;
    for (let i in roles) {
        if (member.roles.cache.has(roles[i])) { result = true; break }
    }

    return result
}

export { memberHasOneRole }