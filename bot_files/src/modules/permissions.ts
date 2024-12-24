import { Permissions } from "@config/permissions";
import Discord from "discord.js";

export async function getMemberPermissions(member: Discord.GuildMember): Promise<string[]> {
    if ((process.env.OWNER_IDS ?? "").split(" ").includes(member.id)) return Permissions;
    const dataPermissions: { [key: string]: string[] } = (await dataManager.getKey("permissions")) ?? {};
    var permissions: string[] = [];
    member.roles.cache.forEach((role) =>
        dataPermissions[role.id] ? dataPermissions[role.id].forEach((perm) => permissions.includes(perm) ? null : permissions.push(perm)) : "");
    return permissions;
};